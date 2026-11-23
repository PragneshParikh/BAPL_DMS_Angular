//src\app\core\services\vehicle-ocr.service.ts
// Reads a Chassis No / Registration No from a photo (number plate, chassis sticker, RC, invoice) in the browser.
// OCR engine: tesseract.js (npm), loaded only when the user scans (dynamic import, not in the main bundle;
// never runs during SSR). The image never leaves the browser; only the recognised text is used to search.
// Note: tesseract.js downloads its engine + English data (~4 MB, once, then cached) from cdn.jsdelivr.net
// by default. If the network blocks it, host the files in /assets and set workerPath/corePath/langPath below.
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface OcrCandidate {
  value: string;               // letters/digits only, upper case
  kind: 'Reg No' | 'Chassis No';
  score: number;               // higher = more likely
}

/** Indian state / UT codes used on registration plates (incl. old codes still on the road). */
const STATE_CODES = new Set([
  'AN', 'AP', 'AR', 'AS', 'BR', 'CH', 'CG', 'DD', 'DL', 'DN', 'GA', 'GJ', 'HR', 'HP', 'JK', 'JH', 'KA', 'KL', 'LA', 'LD',
  'MP', 'MH', 'MN', 'ML', 'MZ', 'NL', 'OD', 'OR', 'PY', 'PB', 'RJ', 'SK', 'TN', 'TS', 'TG', 'TR', 'UP', 'UK', 'UA', 'WB',
]);
/** same rule as JobCardServiceHistoryReportService.RegNoPattern (incl. Bharat series) */
const REG_RE = /^(?:[A-Z]{2}\d{1,2}[A-Z]{0,3}\d{1,4}|\d{2}BH\d{4}[A-Z]{1,2})$/;
const REG_FIND = /[A-Z]{2}\d{1,2}[A-Z]{0,3}\d{4}|\d{2}BH\d{4}[A-Z]{1,2}/g;

const TO_LETTER: Record<string, string> = { '0': 'O', '1': 'I', '2': 'Z', '4': 'A', '5': 'S', '6': 'G', '8': 'B' };
const TO_DIGIT: Record<string, string> = { O: '0', Q: '0', D: '0', I: '1', L: '1', Z: '2', S: '5', G: '6', B: '8', T: '7' };

const norm = (s: string) => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

/**
 * Typical OCR slips on a plate fixed by position: first 2 = letters (state), last 4 = digits.
 * Exported for unit tests.
 */
export function fixPlate(s: string): string {
  if (s.length < 6) return s;
  const a = s.split('');
  for (let i = 0; i < 2; i++) a[i] = TO_LETTER[a[i]] ?? a[i];
  for (let i = a.length - 4; i < a.length; i++) a[i] = TO_DIGIT[a[i]] ?? a[i];
  // first character of the RTO code (right after the state) is always a digit
  if (a.length > 6) a[2] = TO_DIGIT[a[2]] ?? a[2];
  return a.join('');
}

/** Pulls Reg No / Chassis No candidates out of OCR text, best first. Exported for unit tests. */
export function extractCandidates(text: string): OcrCandidate[] {
  const out = new Map<string, OcrCandidate>();
  const add = (value: string, kind: OcrCandidate['kind'], score: number) => {
    const prev = out.get(value);
    if (!prev || prev.score < score) out.set(value, { value, kind, score });
  };
  // drop printed labels ("CHASSIS NO:", "VIN", "REG NO", "IND" on plates) so they do not stick to the number
  const LABELS = /\b(CHASSIS|CHASIS|FRAME|VIN|ENGINE|MOTOR|REGN?|REGD|REGISTRATION|NO|NUMBER|IND)\b\.?:?/g;
  const lines = (text || '').toUpperCase().split(/\r?\n/).map(l => l.replace(LABELS, ' ').trim()).filter(Boolean);
  // a plate is often read as two lines ("MH 12" / "AB 1234") → also try each line joined with the next
  const joined: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    joined.push(lines[i]);
    if (i + 1 < lines.length) joined.push(lines[i] + lines[i + 1]);
  }

  for (const raw of joined) {
    const n = norm(raw);
    if (n.length < 6) continue;

    // ---------- Registration No ----------
    for (const variant of [n, fixPlate(n)]) {
      for (const m of variant.match(REG_FIND) ?? []) {
        if (!REG_RE.test(m)) continue;
        let score = 50;
        if (STATE_CODES.has(m.slice(0, 2)) || /^\d{2}BH/.test(m)) score += 30;
        if (variant !== n) score -= 5;               // needed correction
        if (m.length >= 9) score += 5;
        add(m, 'Reg No', score);
      }
    }

    // ---------- Chassis No ----------
    // VIN-style: 10-17 letters/digits with both letters and digits (e.g. 17-char VIN, DMS chassis numbers)
    const tokens = raw.split(/[\s:;,.|/\\-]+/).map(norm).filter(t => t.length >= 10);
    const pieces = new Set<string>([...tokens, n.length >= 10 && n.length <= 20 ? n : '']);
    for (const t of pieces) {
      if (!t) continue;
      const digits = (t.match(/\d/g) ?? []).length;
      const letters = t.length - digits;
      if (digits < 3 || letters < 2) continue;
      if (REG_RE.test(t)) continue;                  // that is a plate, handled above
      const values = t.length > 17 ? [t.slice(0, 17), t.slice(-17)] : [t];
      for (const v of values) {
        let score = 40;
        if (v.length === 17) score += 30;
        else if (v.length >= 14) score += 15;
        if (!/[IOQ]/.test(v)) score += 5;            // VINs do not use I, O, Q
        add(v, 'Chassis No', score);
      }
    }
  }
  return [...out.values()].sort((a, b) => b.score - a.score).slice(0, 6);
}

/** Levenshtein distance (small strings) – ranks DB matches against an OCR read. Exported for unit tests. */
export function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

/** Good enough to use without a manual check: a full chassis or a registration number with a real state code. */
export function isConfident(c: OcrCandidate | undefined | null): boolean {
  if (!c) return false;
  return c.kind === 'Chassis No' ? c.score >= 70 : c.score >= 80;
}

/** Accepted when the same value is the best reading in `needed` of the last `windowSize` frames (live scan). */
export class VoteTracker {
  private recent: (string | null)[] = [];
  private best = new Map<string, OcrCandidate>();
  constructor(private needed = 2, private windowSize = 3) {}
  push(found: OcrCandidate[]): OcrCandidate | null {
    const top = found[0] ?? null;
    this.recent.push(top?.value ?? null);
    if (this.recent.length > this.windowSize) this.recent = this.recent.slice(-this.windowSize);
    if (!top) return null;
    const prev = this.best.get(top.value);
    if (!prev || prev.score < top.score) this.best.set(top.value, top);
    return this.recent.filter(v => v === top.value).length >= this.needed ? this.best.get(top.value)! : null;
  }
  reset() { this.recent = []; this.best.clear(); }
}

/**
 * Part of the video frame under the on-screen guide box. The <video> uses object-fit: cover, so the frame is scaled
 * until it covers the view and the overflow is cut off evenly. Returns the box in video pixels.
 */
export function viewBoxToVideo(
  box: { left: number; top: number; width: number; height: number },
  view: { width: number; height: number }, video: { width: number; height: number },
) {
  const scale = Math.max(view.width / video.width, view.height / video.height);
  const offX = (video.width * scale - view.width) / 2;
  const offY = (video.height * scale - view.height) / 2;
  return { left: (box.left + offX) / scale, top: (box.top + offY) / scale, width: box.width / scale, height: box.height / scale };
}

@Injectable({ providedIn: 'root' })
export class VehicleOcrService {
  private workerPromise: Promise<any> | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  get supported(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private getWorker(): Promise<any> {
    if (!this.workerPromise) {
      this.workerPromise = (async () => {
        const { createWorker } = await import('tesseract.js');
        const worker = await createWorker('eng');
        await worker.setParameters({
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -',
          tessedit_pageseg_mode: '11' as any,       // sparse text: plates / stickers, not paragraphs
        });
        return worker;
      })().catch(err => { this.workerPromise = null; throw err; });
    }
    return this.workerPromise;
  }

  /** OCR on an image file / blob (photo or camera frame). Returns raw text. */
  async recognize(image: Blob): Promise<string> {
    if (!this.supported) throw new Error('OCR is only available in the browser.');
    const canvas = await this.prepare(image);
    return this.recognizeCanvas(canvas);
  }

  /** OCR on a canvas that is already prepared (live scan: only the guide-box part of the video frame). */
  async recognizeCanvas(canvas: HTMLCanvasElement): Promise<string> {
    const worker = await this.getWorker();
    const { data } = await worker.recognize(canvas);
    return data?.text ?? '';
  }

  /** Engine started in the background, so the first live frame does not wait for the download. */
  warmUp(): void {
    if (this.supported) this.getWorker().catch(() => undefined);
  }

  /**
   * Live scan: copies the part of the video under the guide box to a canvas (scaled for OCR, grey, contrast
   * stretched). Only that part is read, so other numbers in view are ignored.
   */
  cropVideo(video: HTMLVideoElement, box: { left: number; top: number; width: number; height: number }): HTMLCanvasElement | null {
    if (!video.videoWidth || !video.clientWidth) return null;
    const r = viewBoxToVideo(box, { width: video.clientWidth, height: video.clientHeight }, { width: video.videoWidth, height: video.videoHeight });
    const scale = Math.min(3, Math.max(1, 1400 / r.width));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(r.width * scale);
    canvas.height = Math.round(r.height * scale);
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(video, r.left, r.top, r.width, r.height, 0, 0, canvas.width, canvas.height);
    this.greyAndStretch(ctx, canvas.width, canvas.height);
    return canvas;
  }

  private greyAndStretch(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    let min = 255, max = 0;
    for (let i = 0; i < d.length; i += 4) {
      const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      d[i] = d[i + 1] = d[i + 2] = g;
      if (g < min) min = g;
      if (g > max) max = g;
    }
    const range = Math.max(1, max - min);
    for (let i = 0; i < d.length; i += 4) {
      const v = ((d[i] - min) * 255) / range;
      d[i] = d[i + 1] = d[i + 2] = v;
    }
    ctx.putImageData(img, 0, 0);
  }

  /** Scale to a readable size, grey scale and stretch contrast – noticeably better reads on phone photos. */
  private async prepare(image: Blob): Promise<HTMLCanvasElement> {
    const bmp = await createImageBitmap(image);
    const longest = Math.max(bmp.width, bmp.height);
    const scale = longest > 1800 ? 1800 / longest : longest < 900 ? 900 / longest : 1;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close?.();

    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = img.data;
    let min = 255, max = 0;
    for (let i = 0; i < d.length; i += 4) {
      const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      d[i] = d[i + 1] = d[i + 2] = g;
      if (g < min) min = g;
      if (g > max) max = g;
    }
    const range = Math.max(1, max - min);
    for (let i = 0; i < d.length; i += 4) {
      const v = ((d[i] - min) * 255) / range;
      d[i] = d[i + 1] = d[i + 2] = v;
    }
    ctx.putImageData(img, 0, 0);
    return canvas;
  }

  /** Free the OCR engine (about 20-30 MB). Called when the job card page closes. */
  async dispose(): Promise<void> {
    const p = this.workerPromise;
    this.workerPromise = null;
    if (p) { try { (await p).terminate(); } catch { /* ignore */ } }
  }
}
