import { Component } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-material-transfer',
  imports: [
    SharedModule,
    NgbTooltipModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    NgbPaginationModule,
    RouterOutlet
  ],
  templateUrl: './material-transfer.html',
  styleUrl: './material-transfer.scss',
})
export class MaterialTransfer {
  public searchTerm: string = '';
  dataSource: any[] = [];

  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // #region pagination variables
  page = 1;
  pageSize = 10;
  collectionSize = 0;

  constructor(private router: Router) { }

  onSearchChange() {
    // Logic to handle search term change
  }

  addMaterialTransfer() {
    this.router.navigate(['/material-transfer', 0]);
  }

  onMaterialClick(row: any) {
    this.router.navigate(['/material-transfer', row.id]);
  }

  onPageChange(page: number) {
    // Logic to handle page change
  }

  onSort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    // Logic to sort data based on sortColumn and sortDirection
  }
}
