//src\app\components\prefix-master\prefix-master.ts
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
import { MenuAccessService } from '../../core/services/menu-access.service';

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

  readonly SUBMENU_ID = 26;
  canCreate = false;
  canEdit = false;
  canDelete = false;
  canDownload = false;

  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // #region pagination variables
  page = 1;
  pageSize = 10;
  collectionSize = 0;

  isSuperAdmin: boolean = false;
  dealerCode: string | null = null;

  constructor(
    private router: Router,
    private prefixService: PrefixService,
    private storageService: StorageService,
    private loader: LoaderService,
    private toast: ToastService
  ) {
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';

    if (!this.isSuperAdmin) {
      this.dealerCode = this.storageService.getDealerCode();
    }
  }

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

    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.sequenceList.sort((a: any, b: any) => {

      let valueA: any;
      let valueB: any;

      if (column === 'sequenceName') {
        valueA = this.getModuleName(a.sequenceName).toLowerCase();
        valueB = this.getModuleName(b.sequenceName).toLowerCase();
      } else {
        valueA = a[column] ?? '';
        valueB = b[column] ?? '';

        if (typeof valueA === 'string') valueA = valueA.toLowerCase();
        if (typeof valueB === 'string') valueB = valueB.toLowerCase();
      }

      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }

      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }

      return 0;
    });
  }

  getModuleName(id: any): string {
    const module = this.lstModule.find(x => x.name === id); // adjust property names
    return module ? module.name : '';
  }

  // onSequenceClick(row: any) { }

  onPageChange(page: number) {
    this.page = page;
    this.loadSequences();
  }

  loadSequences() {
    this.loader.show();
    this.prefixService.getPrefixByPagedByDealer(this.searchTerm, this.page, this.pageSize, this.dealerCode).subscribe({
      next: (response: any) => {
        this.loader.hide();

        this.sequenceList = response.data || [];
        this.collectionSize = response.totalRecords || 0;

        this.onSort('sequenceName');
      },
      error: (error) => {
        this.loader.hide();
        console.error('Error fetching sequences:', error);
        this.toast.show('Failed to load sequences.', { classname: 'bg-danger text-light', delay: 5000 });
      }
    });

  }

  onSequenceClick(row: any) {
    this.router.navigate(['/prefix', row.id]);
  }

  deleteSequence(row: any) {
    if (!this.isSuperAdmin) return;

    const confirmed = window.confirm(`Delete this prefix sequence for ${row.sequenceName}? This cannot be undone.`);
    if (!confirmed) return;

    this.loader.show();
    this.prefixService.deletePrefix(row.id).subscribe({
      next: () => {
        this.loader.hide();
        this.toast.show('Deleted successfully.', { classname: 'bg-success text-white', delay: 5000 });
        this.loadSequences();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toast.show('Failed to delete.', { classname: 'bg-danger text-white', delay: 5000 });
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