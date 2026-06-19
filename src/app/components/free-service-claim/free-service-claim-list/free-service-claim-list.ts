import { Component } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { CommonModule } from '@angular/common';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-free-service-claim-list',
  imports: [SharedModule, CommonModule, NgbPagination, FormsModule, ReactiveFormsModule],
  templateUrl: './free-service-claim-list.html',
  styleUrl: './free-service-claim-list.scss',
})
export class FreeServiceClaimList {

  public searchTerm: string = '';
  dataSource: any[] = [];

  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // #region pagination variables
  page = 1;
  pageSize = 10;
  collectionSize = 0;

  isSuperAdmin: boolean;

  constructor() { }

  newClaim() { }

  onSearchChange() { }

  onPageChange(event: any) { }
}
