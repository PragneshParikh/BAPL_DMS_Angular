import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { KitCreationService } from '../../core/services/kit-creation.service';

@Component({
  selector: 'app-kit-creation',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule, NgbModule],
  templateUrl: './kit-creation.html',
  styleUrl: './kit-creation.scss',
})
export class KitCreation implements OnInit {

  searchTerm: string = '';
  dataSource: any[] = [];
  rowData: any = {};
  kitData: any[] = [];

  page = 1;
  pageSize = 10;

  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(private kitCreationService: KitCreationService,
    private modalService: NgbModal) {

  }

  ngOnInit() {
    this.kitData = [];
    this.loadKitData();
  }

  loadKitData() {

    this.kitCreationService.getKits().subscribe({

      next: (res: any) => {
        const data = res.data || [];
        this.kitData = data.map((kit: any, index: number) => ({
          ...kit,
          slNo: index + 1
        }));
        this.dataSource = [...this.kitData];

        this.refreshPage();
      }, error: (err) => {
        console.error(err);
      }
    });
  }

  refreshPage() {

    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.kitData = this.dataSource.slice(start, end);
  }

  //#region Sorting
  onSort(column: string) {

    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.dataSource.sort((a, b) => {

      let valueA = a[column];
      let valueB = b[column];

      if (valueA == null) valueA = '';
      if (valueB == null) valueB = '';

      valueA = valueA.toString().toLowerCase();
      valueB = valueB.toString().toLowerCase();

      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;

      return 0;

    });

    this.refreshPage();

  }
  //#endregion

}
