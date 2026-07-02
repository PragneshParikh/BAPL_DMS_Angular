import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from '../../shared/shared.module';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { PrefixService } from '../../core/services/prefix';
import { ToastService } from '../../shared/toaster/toast-service';
import { LoaderService } from '../../core/services/loader';
import { StorageService } from '../../core/services/storage';
import { ModuleTypes } from '../../constant';
import { GetPrefixModuleNamePipe } from '../../core/pipes/get-prefix-module-name-pipe';

@Component({
  selector: 'app-prefix-master',
  imports: [
    RouterOutlet,
    CommonModule,
    NgbPaginationModule,
    NgbTooltipModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    RouterOutlet,
    GetPrefixModuleNamePipe
  ],
  templateUrl: './prefix-master.html',
  styleUrl: './prefix-master.scss',
})
export class PrefixMaster implements OnInit {
  lstModule = ModuleTypes;
  public searchTerm: string = '';
  sequenceList: any[] = [];

  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // #region pagination variables
  page = 1;
  pageSize = 10;
  collectionSize = 0;

  dealerCode: string = '';

  constructor(
    private router: Router,
    private prefixService: PrefixService,
    private storageServie: StorageService,
    private loader: LoaderService,
    private toast: ToastService
  ) { }

  ngOnInit() {
    this.lstModule = [...ModuleTypes].sort((a, b) =>
      a.moduleName.localeCompare(b.moduleName)
    );
    this.loadSequences();
  }

  newPrefix() {
    this.router.navigate(['/prefix', 0]);
  }

  onSearchChange() {
    this.page = 1
    this.loadSequences();
  }

  onSort(column: string) {

  }

  onSequenceClick(row: any) {

  }

  onPageChange(page: number) {
    this.page = page;
    this.loadSequences();
  }

  loadSequences() {
    this.loader.show();
    this.prefixService.getPrefixByPaged(this.searchTerm, this.page - 1, this.pageSize).subscribe({
      next: (response: any) => {
        this.loader.hide();

        this.sequenceList = response.data || [];
        this.collectionSize = response.totalRecords || 0;

      },
      error: (error) => {
        this.loader.hide();
        console.error('Error fetching sequences:', error);
        this.toast.show('Failed to load sequences.', { classname: 'bg-danger text-light', delay: 5000 });
      }
    });

  }

  onDownloadExcel() {
    this.loader.show();

    this.prefixService.downloadExcel().subscribe({
      next: (data: Blob) => {
        const blob = new Blob([data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const downloadURL = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = downloadURL;
        link.download = 'Prefix.xlsx';

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadURL);
      },
      error: (err) => {
        console.error(err);
        this.toast.show('Failed to download file', { classname: 'bg-danger text-white', delay: 5000 });
      },
      complete: () => {
        this.loader.hide();
      }
    });
  }

}