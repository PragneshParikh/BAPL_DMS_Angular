import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-counter-bill',
  imports: [CommonModule,FormsModule,NgbModule],
  templateUrl: './counter-bill.html',
  styleUrl: './counter-bill.scss',
})
export class CounterBill  implements OnInit {

  filter = {
    fromDate: '',
    toDate: ''
  };

  searchTerm: string = '';

  page: number = 1;
  pageSize: number = 10;

  counterBills: any[] = [];
  filteredCounterBills: any[] = [];
  paginatedCounterBills: any[] = [];

  constructor(private router:Router) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.filteredCounterBills = [...this.counterBills];
    this.updatePagination();
  }

  onSearch(): void {
    // API call/filter logic
    this.page = 1;
    this.updatePagination();
  }

  onSearchChange(): void {
    // Search logic
    this.page = 1;
    this.updatePagination();
  }

  onSort(column: string): void {
    console.log('Sort:', column);
  }

  onPageChange(pageNo: number): void {
    this.page = pageNo;
    this.updatePagination();
  }

  updatePagination(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;

    this.paginatedCounterBills =
      this.filteredCounterBills.slice(startIndex, endIndex);
  }

  addCounterBill(): void {
    this.router.navigate(['/add-counter-bill']);
  }

  exportExcel(): void {
    console.log('Export Excel');
  }

  editCounterBill(item: any): void {
    console.log(item);
  }

}

