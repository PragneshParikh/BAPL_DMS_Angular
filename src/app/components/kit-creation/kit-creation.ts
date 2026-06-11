import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { KitCreationService } from '../../core/services/kit-creation.service';
import { privateDecrypt } from 'crypto';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import { Router, RouterOutlet } from "@angular/router";
import { error } from 'console';

@Component({
  selector: 'app-kit-creation',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule, NgbModule, RouterOutlet],
  templateUrl: './kit-creation.html',
  styleUrl: './kit-creation.scss',
})
export class KitCreation implements OnInit {

  public searchTerm: string = '';
  kitData: any[] = [];

  page = 1;
  pageSize = 10;
  collectionSize = 0;

  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private kitCreationService: KitCreationService,
    private loader: LoaderService,
    private toaster: ToastService,
    private router: Router
  ) { }

  ngOnInit() {
    this.getKitCreationData();
  }

  getKitCreationData() {

    this.loader.show();
    this.kitCreationService.getKitByPaged(this.searchTerm, this.page - 1, this.pageSize).subscribe({
      next: (res: any) => {
        this.kitData = [];
        this.collectionSize = 0;

        if (res) {
          this.kitData = res.data;
          this.collectionSize = res.totalRecords;

        }
        this.loader.hide();
      }, error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show('Something went wrong', {
          classname: 'bg-danger text-white',
          delay: 5000
        });
      }
    });
  }

  //#region Sorting
  onSort(column: string) {

    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.kitData.sort((a, b) => {

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

  }
  //#endregion

  onPageChange(page: number) {
    this.page = page;
    this.getKitCreationData();
  }

  newKit() {
    this.router.navigate(['/kit-creation', 0]);
  }
  onSearchChange() {
    this.page = 1; // Reset to first page on new search
    this.getKitCreationData();
  }
  onKitClick(rowData: any) {
    if (rowData) {
      this.router.navigate(['/kit-creation', rowData.id]);
    }
  }

  onDownloadExcel() {
    this.loader.show();

    this.kitCreationService.downloadExcel().subscribe({
      next: (data: Blob) => {
        const blob = new Blob([data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const downloadURL = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = downloadURL;
        link.download = 'KitDetails.xlsx';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.URL.revokeObjectURL(downloadURL);

        this.loader.hide();
      },
      error: (error) => {
        console.error(error);
        this.loader.hide();
        this.toaster.show('Something went wrong.', { calssname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

}
