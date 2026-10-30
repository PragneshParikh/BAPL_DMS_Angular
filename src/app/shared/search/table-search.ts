// src\app\shared\search\table-search.ts
// One search rule for every list page: searches the columns shown in the table, from the first
// character typed.
//  * case-insensitive, matches anywhere in the value ("cus05" finds CUS0512)
//  * several words = all must match, in any column ("pune active" / "cus0442 shakti")
//  * dates match as shown in DMS: 30-10-2026, 30/10/2026, 30.10.2026, 2026-10-30
//  * rows whose FIRST listed field starts with the text come first (codes before names)
//  * field paths: 'header.billNo' for nested objects, 'details.chassisNo' searches every item of an array

/** Text of one value as the user may type it. */
function valueTexts(v: any): string[] {
  if (v === null || v === undefined || typeof v === 'boolean') return [];
  if (v instanceof Date) return dateTexts(v);
  if (typeof v === 'number') return [String(v)];
  const s = String(v).trim();
  if (!s) return [];
  // ISO date / date-time from the API ("2026-10-30" or "2026-10-30T11:20:00")
  if (/^\d{4}-\d{2}-\d{2}(T|$)/.test(s)) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) return [s, ...dateTexts(d)];
  }
  return [s];
}

function dateTexts(d: Date): string[] {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return [`${dd}-${mm}-${yyyy}`, `${dd}/${mm}/${yyyy}`, `${dd}.${mm}.${yyyy}`, `${yyyy}-${mm}-${dd}`];
}

/** All texts of a field path; arrays on the way are searched item by item. */
function pathTexts(row: any, path: string): string[] {
  let current: any[] = [row];
  for (const key of path.split('.')) {
    const next: any[] = [];
    for (const c of current) {
      if (c === null || c === undefined) continue;
      const v = c[key];
      if (Array.isArray(v)) next.push(...v); else next.push(v);
    }
    current = next;
  }
  return current.flatMap(valueTexts);
}

function tokens(term: string | null | undefined): string[] {
  return (term ?? '').toLowerCase().trim().split(/\s+/).filter(t => t.length > 0);
}

/** True when every word of the search text is found in at least one of the fields. */
export function rowMatches(row: any, term: string | null | undefined, fields: string[]): boolean {
  const words = tokens(term);
  if (!words.length) return true;
  const texts = fields.flatMap(f => pathTexts(row, f)).map(t => t.toLowerCase());
  return words.every(w => texts.some(t => t.includes(w)));
}

/**
 * Rows matching the search text, best matches first: first field starting with the text,
 * then any field starting with it, then the rest (original order kept inside each group).
 * Empty text = all rows, unchanged order.
 */
export function filterRows<T>(rows: T[] | null | undefined, term: string | null | undefined, fields: string[]): T[] {
  const list = rows ?? [];
  const words = tokens(term);
  if (!words.length) return [...list];
  const first = words[0];
  return list
    .filter(r => rowMatches(r, term, fields))
    .map((r, i) => {
      const primary = fields.length ? pathTexts(r, fields[0]).some(t => t.toLowerCase().startsWith(first)) : false;
      const any = !primary && fields.some(f => pathTexts(r, f).some(t => t.toLowerCase().startsWith(first)));
      return { r, i, rank: primary ? 0 : any ? 1 : 2 };
    })
    .sort((a, b) => a.rank - b.rank || a.i - b.i)
    .map(x => x.r);
}

/**
 * Server-side search: runs the load a moment after typing pauses (one request per pause, not per key)
 * and drops answers of older searches that arrive late.
 *   private search = new SearchDebouncer();
 *   (input)="search.run(() => { page = 1; load(); })"
 */
export class SearchDebouncer {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private seq = 0;
  constructor(private delayMs = 200) { }

  /** Schedules fn; a newer call cancels the pending one. */
  run(fn: () => void, immediate = false): void {
    if (this.timer) clearTimeout(this.timer);
    this.seq++;
    if (immediate) { this.timer = null; fn(); return; }
    this.timer = setTimeout(() => { this.timer = null; fn(); }, this.delayMs);
  }

  /** Ticket for a request: pass it back to isCurrent() when the answer arrives. */
  ticket(): number { return this.seq; }
  isCurrent(ticket: number): boolean { return ticket === this.seq; }

  cancel(): void { if (this.timer) clearTimeout(this.timer); this.timer = null; }
}
