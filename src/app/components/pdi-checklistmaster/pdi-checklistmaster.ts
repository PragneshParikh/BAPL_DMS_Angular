// src\app\components\pdi-checklistmaster\pdi-checklistmaster.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbModal, NgbModule, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { PdiChecklistMasterService } from '../../core/services/pdi-checklistmaster-service';
import Swal from 'sweetalert2';
import { firstValueFrom } from 'rxjs';
import * as XLSX from 'xlsx';
import { LoaderService } from '../../core/services/loader';
import { Form22MasterService } from '../../core/services/form22masterservice';
import * as bootstrap from 'bootstrap';
import { StorageService } from '../../core/services/storage';
import { MenuAccessService } from '../../core/services/menu-access.service';
import { SearchDebouncer } from '../../shared/search/table-search';

@Component({
  selector: 'app-pdi-checklistmaster',
  standalone: true,
  imports: [FormsModule, CommonModule, NgbModule, NgbPagination],
  templateUrl: './pdi-checklistmaster.html',
  styleUrl: './pdi-checklistmaster.scss',
})
export class PdiChecklistmaster implements OnInit {
  checklistList: any[] = [];
  searchText: string = '';
  private searchDebounce = new SearchDebouncer(200);   // search runs as you type (one request per pause)
  isEditMode: boolean = false;
  isLoading: boolean = false;
  isImportingExcel = false;
  oemModelList: any[] = [];
  selectedOemModelId: number | null = null;
  readonly SUBMENU_ID = 36;
  canCreate = false;
  canEdit = false;
  canDelete = false;


  PdiChecklistmastermodel: any = {
    oemmodelId: 0,
    checklistName: '',
    description: '',
    isActive: true,
    createdBy: 'Admin'
  };
  sortColumn: string;
  sortDirection: string;
  filteredData: any;
  pagedData: any[] = [];
  userRole: string = '';
  readonly pageSizeOptions = [10, 25, 50, 100];


  constructor(
    private Pdichecklistmasterservice: PdiChecklistMasterService,
    private form22service: Form22MasterService,
    private storageService: StorageService,
    private modalService: NgbModal,
    private loader: LoaderService,
    private menuAccess: MenuAccessService
  ) {
    this.canCreate = this.menuAccess.canCreate(this.SUBMENU_ID);
    this.canEdit = this.menuAccess.canEdit(this.SUBMENU_ID);
    this.canDelete = this.menuAccess.canDelete(this.SUBMENU_ID);
  }
  ngOnInit() {
    this.userRole = this.storageService.getRole();
    this.loadPdiChecklistList();
    this.loadOemModels();
  }
  //pagination
  page = 1;
  pageSize = 10;
  collectionSize = 0;

  get firstVisibleRecord(): number {
    return this.collectionSize === 0 ? 0 : (this.page - 1) * this.pageSize + 1;
  }

  get lastVisibleRecord(): number {
    return Math.min(this.page * this.pageSize, this.collectionSize);
  }

  openAddpdiChecklist() {
    this.isEditMode = false;

    this.PdiChecklistmastermodel = {
      oemmodelId: null,
      checklistName: '',
      description: '',
      isActive: true
    };

    const modal = document.getElementById('pdiChecklistmasterModal');
    if (modal) {
      bootstrap.Modal.getOrCreateInstance(modal).show();
    }

  }
  openEdit(item: any) {

    this.isEditMode = true;

    this.PdiChecklistmastermodel = {
      ...item
    };

    const modal = document.getElementById('pdiChecklistmasterModal');
    if (modal) {
      bootstrap.Modal.getOrCreateInstance(modal).show();
    }
  }

  loadOemModels() {
    this.form22service.getOemModelList().subscribe({
      next: (res: any) => {
        //  Direct assign (API already gives ID + Name)
        this.oemModelList = res;
      },
      error: (err) => {
        console.error('Error fetching OEM Models', err);
      }
    });
  }

  loadPdiChecklistList() {
    this.loader.show();
    this.Pdichecklistmasterservice.getPdiChecklistMasterList(this.searchText)
      .subscribe({
        next: (res: any[]) => {
          this.loader.hide();
          this.checklistList = res;
          this.refreshTable();
        },
        error: (err) => {
          this.loader.hide();
          console.error('Error loading list', err);
        }
      });
  }

  downloadPdiChecklistExcel(): void {
    if (!this.checklistList.length) {
      void Swal.fire({
        icon: 'info',
        title: 'No records to download',
        text: 'There are no PDI checklist records to export.'
      });
      return;
    }

    const rows = this.checklistList.map((item, index) => [
      index + 1,
      item.oemModelName ?? '',
      item.checklistName ?? '',
      item.isActive ? 'Yes' : 'No'
    ]);
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['Sr. No.', 'OEM Model Name', 'PDI Checkpoint', 'Status'],
      ...rows
    ]);
    worksheet['!cols'] = [{ wch: 10 }, { wch: 25 }, { wch: 60 }, { wch: 12 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PDI Checklist');
    XLSX.writeFile(
      workbook,
      `PDI_ChecklistMaster_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  }

  downloadPdiChecklistSample(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const worksheet = XLSX.utils.aoa_to_sheet([
      ['S.no', 'OEM Model Name', 'PDI Checkpoint']
    ]);
    worksheet['!cols'] = [{ wch: 10 }, { wch: 25 }, { wch: 30 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PDI Checklist');

    const fileContents = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const file = new Blob([fileContents], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(file);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = 'PDI_ChecklistMaster_Sample.xlsx';
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async uploadPdiChecklistExcel(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.isImportingExcel = true;
    this.loader.show();

    let importedCount = 0;
    let fileError = '';
    const rowErrors: string[] = [];

    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error('The workbook does not contain a worksheet.');
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
        header: 1,
        defval: '',
        raw: false
      });
      if (!rows.length) {
        throw new Error('The worksheet is empty.');
      }

      const normalize = (value: unknown) =>
        String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const headers = rows[0].map(normalize);
      const serialIndex = headers.indexOf('sno');
      const oemModelIndex = headers.indexOf('oemmodelname');
      const checklistIndex = headers.indexOf('pdicheckpoint') >= 0
        ? headers.indexOf('pdicheckpoint')
        : headers.indexOf('pdichecklist');

      if (serialIndex < 0 || oemModelIndex < 0 || checklistIndex < 0) {
        throw new Error('Required columns: S.no, OEM Model Name, and PDI Checkpoint.');
      }
      if (!this.oemModelList.length) {
        throw new Error('OEM models are not loaded. Please try again in a moment.');
      }

      const dataRows = rows.slice(1)
        .map((row, index) => ({ row, rowNumber: index + 2 }))
        .filter(({ row }) => row.some(value => String(value ?? '').trim() !== ''));

      if (!dataRows.length) {
        throw new Error('The worksheet has no data rows to upload.');
      }

      for (const { row, rowNumber } of dataRows) {
        const serialNumber = String(row[serialIndex] ?? '').trim();
        const oemModelName = String(row[oemModelIndex] ?? '').trim();
        const checklistName = String(row[checklistIndex] ?? '').trim();

        if (!oemModelName || !checklistName) {
          rowErrors.push(`Row ${rowNumber}: OEM Model Name and PDI Check list are required.`);
          continue;
        }

        const oemModel = this.oemModelList.find(model =>
          normalize(model.oemModelName) === normalize(oemModelName)
        );
        if (!oemModel) {
          rowErrors.push(`Row ${rowNumber}${serialNumber ? ` (S.no ${serialNumber})` : ''}: OEM model "${oemModelName}" was not found.`);
          continue;
        }

        try {
          const result = await firstValueFrom(
            this.Pdichecklistmasterservice.insertPdiChecklistMaster({
              oemmodelId: oemModel.oemmodelId,
              checklistName,
              description: checklistName,
              isactive: true
            })
          );
          if (result?.success === false || result?.Success === false) {
            throw new Error(result.message ?? result.Message ?? 'The API rejected this row.');
          }
          importedCount++;
        } catch (error) {
          rowErrors.push(`Row ${rowNumber}${serialNumber ? ` (S.no ${serialNumber})` : ''}: ${this.getExcelImportErrorMessage(error)}`);
        }
      }
    } catch (error) {
      fileError = this.getExcelImportErrorMessage(error);
    } finally {
      this.loader.hide();
      this.isImportingExcel = false;
      input.value = '';
    }

    if (importedCount > 0) {
      this.loadPdiChecklistList();
    }

    const hasErrors = Boolean(fileError) || rowErrors.length > 0;
    const title = importedCount > 0
      ? hasErrors ? 'Import partially completed' : 'Import successful'
      : 'Import failed';
    const details = [
      `Added: ${importedCount}`,
      `Failed: ${rowErrors.length + (fileError ? 1 : 0)}`,
      ...(fileError ? [`File: ${fileError}`] : []),
      ...rowErrors.slice(0, 10),
      ...(rowErrors.length > 10 ? [`...and ${rowErrors.length - 10} more row errors.`] : [])
    ].join('\n');

    await Swal.fire({
      icon: importedCount > 0 ? hasErrors ? 'warning' : 'success' : 'error',
      title,
      text: details
    });
  }

  private getExcelImportErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const responseBody = error.error;
      if (typeof responseBody === 'string') {
        return responseBody.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || error.message;
      }
      return responseBody?.message ?? responseBody?.title ?? error.message;
    }

    return error instanceof Error ? error.message : 'Unknown error.';
  }

  onSearch(searchText: string) {
    this.searchText = searchText;
    this.searchDebounce.run(() => {
      this.page = 1;
      this.loadPdiChecklistList();
    });
  }

  savePdiChecklistmaster(form: any) {
    if (form.invalid) return;
    const payload = {
      id: this.PdiChecklistmastermodel.id,
      oemmodelId: this.PdiChecklistmastermodel.oemmodelId,
      checklistName: this.PdiChecklistmastermodel.checklistName,
      description: this.PdiChecklistmastermodel.description,
      isactive: this.PdiChecklistmastermodel.isActive
    };

    if (this.isEditMode) {
      // UPDATE
      this.loader.show();
      this.Pdichecklistmasterservice.updatePdiChecklistMaster(payload).subscribe({
        next: () => {
          this.loader.hide();
          this.afterSave(form, 'Updated successfully');
        },
        error: (error: HttpErrorResponse) => {
          this.loader.hide();
          this.showError(error);
        }
      });
    } else {
      //  INSERT
      this.loader.show();
      this.Pdichecklistmasterservice.insertPdiChecklistMaster(payload).subscribe({
        next: () => {
          this.loader.hide();
          this.afterSave(form, 'Inserted successfully');
        },
        error: (error: HttpErrorResponse) => {
          this.loader.hide();
          this.showError(error);
        }
      });
    }
  }
  afterSave(form: any, message: string) {

    Swal.fire({
      icon: 'success',
      title: message,
      timer: 1500,
      showConfirmButton: false
    }).then(() => {

      const modalEl = document.getElementById('pdiChecklistmasterModal');

      if (modalEl) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal?.hide();
      }

      form.resetForm();
      this.isEditMode = false;

      this.loadPdiChecklistList();
    });
  }
  showError(error: HttpErrorResponse) {
    const responseBody = error.error;
    const serverMessage = typeof responseBody === 'string'
      ? responseBody.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      : responseBody?.message ?? responseBody?.title;
    const message = serverMessage || error.message || `Request failed (HTTP ${error.status}).`;

    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message.slice(0, 500)
    });
  }
  deletePdiCheclistMaster(pdicheckId: number, event: Event) {
    event.stopPropagation();
    Swal.fire({
      title: 'Are you sure?',
      text: 'You want to delete this record?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {

      if (result.isConfirmed) {
        this.loader.show()
        this.Pdichecklistmasterservice.deletePdiChecklistMaster(pdicheckId).subscribe({
          next: (res) => {
            this.loader.hide()
            Swal.fire({
              icon: 'success',
              title: res,
              timer: 1500,
              showConfirmButton: false
            });

            this.loadPdiChecklistList();
          },
          error: (err) => {
            this.loader.hide();
            Swal.fire({
              icon: 'warning',
              title: 'Deleted successfully'
              //text: err.error
            });
            this.loadPdiChecklistList();

          }
        });

      }
    });
  }

  sort(column: string) {

    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.checklistList.sort((a, b) => {
      let valueA = a[column] ?? '';
      let valueB = b[column] ?? '';

      // Special handling for Status column
      if (column === 'isActive') {
        valueA = valueA ? 1 : 0;
        valueB = valueB ? 1 : 0;
      }

      const result = valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      return this.sortDirection === 'asc' ? result : -result;
    });

    this.refreshTable();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = Number(pageSize);
    this.page = 1;
    this.refreshTable();
  }

  refreshTable() {
    if (!Array.isArray(this.checklistList)) {
      this.pagedData = [];
      this.collectionSize = 0;
      return;
    }

    this.collectionSize = this.checklistList.length;
    const lastPage = Math.max(1, Math.ceil(this.collectionSize / this.pageSize));
    this.page = Math.min(this.page, lastPage);
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagedData = this.checklistList.slice(start, end);
  }

}


