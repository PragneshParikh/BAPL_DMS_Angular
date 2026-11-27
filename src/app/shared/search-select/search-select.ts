//src\app\shared\search-select\search-select.ts
// 26.11.2026 - small searchable dropdown (Dealer / City / State filters).
// Usage: <app-search-select [options]="opts" [(value)]="x" allLabel="All Dealers" (valueChange)="reload()"></app-search-select>
// Type in the box to search the label and the sub text (e.g. dealer name + dealer code).
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbDropdown, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

export interface SearchSelectOption {
  value: string;
  label: string;
  /** shown small next to the label and searched too, e.g. the dealer code */
  sub?: string | null;
}

@Component({
  selector: 'app-search-select',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbDropdownModule],
  templateUrl: './search-select.html',
  styleUrl: './search-select.scss'
})
export class SearchSelect {
  @Input() options: SearchSelectOption[] = [];
  @Input() value: string | null = null;
  @Output() valueChange = new EventEmitter<string | null>();
  /** first row, value = null */
  @Input() allLabel = 'All';
  @Input() placeholder = 'Type to search...';
  @Input() disabled = false;
  /** list is cut to this many rows while nothing is typed (keeps the popup fast) */
  @Input() maxRows = 300;

  @ViewChild('dd') dd!: NgbDropdown;
  @ViewChild('searchBox') searchBox?: ElementRef<HTMLInputElement>;

  search = '';
  active = -1;

  get selectedText(): string {
    if (!this.value) return this.allLabel;
    const o = this.options.find(x => x.value === this.value);
    return o ? (o.sub ? `${o.label} (${o.sub})` : o.label) : this.value;
  }

  get filtered(): SearchSelectOption[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.options.slice(0, this.maxRows);
    return this.options.filter(o => `${o.label} ${o.sub || ''}`.toLowerCase().includes(q)).slice(0, this.maxRows);
  }

  get hiddenCount(): number {
    return this.search.trim() ? 0 : Math.max(0, this.options.length - this.maxRows);
  }

  onOpen(open: boolean): void {
    if (!open) return;
    this.search = '';
    this.active = -1;
    setTimeout(() => this.searchBox?.nativeElement.focus(), 0);
  }

  pick(v: string | null): void {
    if (v !== this.value) {
      this.value = v;
      this.valueChange.emit(v);
    }
    this.dd?.close();
  }

  onKey(e: KeyboardEvent): void {
    const list = this.filtered;
    if (e.key === 'ArrowDown') { this.active = Math.min(this.active + 1, list.length - 1); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { this.active = Math.max(this.active - 1, -1); e.preventDefault(); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.active >= 0 && list[this.active]) this.pick(list[this.active].value);
      else if (list.length === 1) this.pick(list[0].value);
    }
  }
}
