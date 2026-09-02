import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnInit,
  ViewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  NgbModal,
  NgbPaginationModule,
  NgbTooltipModule
} from '@ng-bootstrap/ng-bootstrap';

import { HsnWiseTaxCodeService } from '../../core/services/hsnwisetaxcodeservice';
import {
  AddHsnTaxPayload,
  HsnTaxFormModel
} from '../../ViewModels/HSNWiseTaxcodeModel';

import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import { MenuAccessService } from '../../core/services/menu-access.service';


@Component({
  selector: 'app-hsnwisetaxcode',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    NgbPaginationModule,
    NgbTooltipModule
  ],

  templateUrl: './hsnwisetaxcode.html',
  styleUrl: './hsnwisetaxcode.scss',
})
export class Hsnwisetaxcode implements OnInit {

  readonly SUBMENU_ID = 16;

  canCreate = false;

  // ==========================================
  // FILE INPUT
  // ==========================================

  @ViewChild('importFileInput')
  importFileInput!: ElementRef<HTMLInputElement>;


  constructor(
    private hsnwisetaxcodeservice: HsnWiseTaxCodeService,
    private loader: LoaderService,
    public toaster: ToastService,
    private modalService: NgbModal,
    private menuAccess: MenuAccessService
  ) {
    this.canCreate = this.menuAccess.canCreate(this.SUBMENU_ID);
  }


  // ==========================================
  // PAGINATION
  // ==========================================

  page = 1;
  pageSize = 10;
  collectionSize = 0;
  pagedData: any[] = [];


  // ==========================================
  // SORTING
  // ==========================================

  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';


  // ==========================================
  // ALERT
  // ==========================================

  showAlert: boolean = false;
  alertMessage: string = '';


  // ==========================================
  // FORM DATA
  // ==========================================

  payload: any;

  formData: HsnTaxFormModel = {
    id: 0,
    hsncode: '',
    selectedATax: null,
    ataxCode: '',
    taxCode: '',
    taxRate: 0,
    stateflag: '',
    effectivedate: '',
    createdBy: 'Admin'
  };


  // ==========================================
  // DROPDOWNS
  // ==========================================

  selectedTax: any = null;

  HsnCodeDDList: any[] = [];
  ataxCodeList: any[] = [];


  // ==========================================
  // GRID DATA
  // ==========================================

  griddata: any[] = [];
  filteredData: any[] = [];

  searchTerm: string = '';


  // ==========================================
  // INITIALIZATION
  // ==========================================

  ngOnInit(): void {
    this.getHsnwiseTaxcodedetails();
    this.getHsnCodeList();
    this.getATaxCodeList();
  }


  // ==========================================
  // HSN CODE LIST
  // ==========================================

  getHsnCodeList(): void {

    this.hsnwisetaxcodeservice
      .getHsncodeList()
      .subscribe({

        next: (res: any) => {
          this.HsnCodeDDList = res;
        },

        error: (err) => {
          console.error('Failed to load HSN codes:', err);
        }

      });
  }


  // ==========================================
  // AGGREGATE TAX CODE LIST
  // ==========================================

  getATaxCodeList(): void {

    this.hsnwisetaxcodeservice
      .getAggregateTaxCodeList()
      .subscribe({

        next: (res: any) => {
          this.ataxCodeList = res;
        },

        error: (err) => {
          console.error('Failed to load aggregate tax codes:', err);
        }

      });
  }


  // ==========================================
  // MAIN GRID LIST
  // ==========================================

  getHsnwiseTaxcodedetails(): void {

    this.loader.show();

    this.hsnwisetaxcodeservice
      .getHsnwiseTaxcodedetails(this.searchTerm)
      .subscribe({

        next: (res: any) => {

          this.griddata = res || [];

          this.filteredData = [...this.griddata];

          this.collectionSize = this.filteredData.length;

          this.page = 1;

          this.refreshTable();

          this.loader.hide();
        },

        error: (err) => {

          console.error(
            'Failed to load HSNWise Tax Code details:',
            err
          );

          this.loader.hide();
        }

      });
  }


  // ==========================================
  // OPEN ADD MODAL
  // ==========================================

  openAddDetails(modal: any): void {

    this.resetForm();

    this.modalService.open(
      modal,
      {
        size: 'xl'
      }
    );
  }


  // ==========================================
  // ATAX CODE CHANGE
  // ==========================================

  onATaxCodeChange(): void {

    const selected = this.formData.selectedATax;

    if (selected) {

      this.formData.taxCode =
        selected.taxCode || '';

      this.formData.taxRate =
        selected.taxRate || 0;

      this.formData.ataxCode =
        selected.ataxCode || '';

    } else {

      this.formData.taxCode = '';

      this.formData.taxRate = 0;

      this.formData.ataxCode = '';

    }
  }


  // ==========================================
  // INSERT HSN WISE TAX CODE
  // ==========================================

  addHSNWiseATax(form: any, modal: any): void {

    const payload: AddHsnTaxPayload = {

      hsncode:
        this.formData.hsncode || '',

      ataxCode:
        this.formData.ataxCode || '',

      stateFlag:
        this.formData.stateflag || '',

      effectiveDate:
        this.formData.effectivedate || '',

      createdBy:
        this.formData.createdBy || 'Admin'
    };


    this.loader.show();


    this.hsnwisetaxcodeservice
      .insertHsnwiseTaxcodedetails(payload)
      .subscribe({

        next: () => {

          this.loader.hide();


          this.toaster.show(
            'HSNWise TaxCode details added successfully!',
            {
              classname: 'bg-success text-white',
              delay: 5000
            }
          );


          // Reload grid
          this.getHsnwiseTaxcodedetails();


          // Reset form
          form.resetForm();

          this.resetForm();


          // Close modal
          modal.close();
        },


        error: (err) => {

          console.error(
            'Failed to add HSNWise TaxCode:',
            err
          );

          this.loader.hide();


          this.showAlert = true;

          this.alertMessage =
            'Failed to add HSNWise TaxCode details';


          this.toaster.show(
            'Failed to add HSNWise TaxCode details',
            {
              classname: 'bg-danger text-white',
              delay: 5000
            }
          );
        }

      });
  }


  // ==========================================
  // SEARCH
  // ==========================================

  searchItems(event: Event): void {

    const input =
      event.target as HTMLInputElement;

    this.searchTerm =
      input.value || '';

    this.page = 1;

    this.getHsnwiseTaxcodedetails();
  }


  // ==========================================
  // PAGINATION
  // ==========================================

  pageChange(page: number): void {

    this.page = page;

    this.refreshTable();
  }


  refreshTable(): void {

    const start =
      (this.page - 1) * this.pageSize;

    const end =
      start + this.pageSize;

    this.pagedData =
      this.filteredData.slice(
        start,
        end
      );

    this.collectionSize =
      this.filteredData.length;
  }


  // ==========================================
  // SORTING
  // ==========================================

  sort(column: string): void {

    if (this.sortColumn === column) {

      this.sortDirection =
        this.sortDirection === 'asc'
          ? 'desc'
          : 'asc';

    } else {

      this.sortColumn = column;

      this.sortDirection = 'asc';
    }


    this.filteredData.sort(
      (a: any, b: any) => {

        const valueA =
          a[column] ?? '';

        const valueB =
          b[column] ?? '';


        let result = 0;


        if (
          typeof valueA === 'string' &&
          typeof valueB === 'string'
        ) {

          result =
            valueA.localeCompare(valueB);

        } else {

          result =
            valueA > valueB
              ? 1
              : valueA < valueB
                ? -1
                : 0;
        }


        return this.sortDirection === 'asc'
          ? result
          : -result;
      }
    );


    this.page = 1;

    this.refreshTable();
  }


  // ==========================================
  // RESET FORM
  // ==========================================

  resetForm(): void {

    this.formData = {

      id: 0,

      hsncode: '',

      selectedATax: null,

      ataxCode: '',

      taxCode: '',

      taxRate: 0,

      stateflag: '',

      effectivedate: '',

      createdBy: 'Admin'
    };


    this.showAlert = false;

    this.alertMessage = '';
  }


  // ==========================================
  // OPEN FILE SELECTOR
  // ==========================================

  triggerImportFileInput(): void {

    if (this.importFileInput) {

      this.importFileInput
        .nativeElement
        .click();
    }
  }


  // ==========================================
  // EXCEL FILE IMPORT
  // ==========================================

  onImportFileSelected(event: Event): void {

    const input =
      event.target as HTMLInputElement;


    const file =
      input.files?.[0];


    if (!file) {
      return;
    }


    // Validate Excel file
    const allowedExtensions = [
      '.xlsx',
      '.xls'
    ];


    const fileName =
      file.name.toLowerCase();


    const isExcelFile =
      allowedExtensions.some(
        extension =>
          fileName.endsWith(extension)
      );


    if (!isExcelFile) {

      input.value = '';


      this.toaster.show(
        'Please select a valid Excel file (.xlsx or .xls)',
        {
          classname: 'bg-warning text-dark',
          delay: 5000
        }
      );

      return;
    }


    this.loader.show();


    this.hsnwisetaxcodeservice
      .importHsnwiseTaxCodeExcel(file)
      .subscribe({

        next: (res: any) => {

          this.loader.hide();

          // Clear selected file
          input.value = '';


          const summary =
            res?.data;


         const message = summary
          ? `Import complete: ${summary.insertedCount ?? 0} added, ${summary.skippedCount ?? 0} skipped, ${summary.failedCount ?? 0} failed.`
          : 'HSNWise Tax Code data imported successfully';


       this.toaster.show(message, {
          classname: summary?.failedCount
            ? 'bg-warning text-dark'
            : 'bg-success text-white',
          delay: 5000
        });


          // Reload grid after import
          this.getHsnwiseTaxcodedetails();
        },


        error: (err) => {

          console.error(
            'Excel import failed:',
            err
          );


          this.loader.hide();


          // Important:
          // clearing this allows the same file
          // to be selected again
          input.value = '';


          const errorMessage =
            err?.error?.message ||
            err?.error?.title ||
            'Failed to import HSNWise Tax Code data';


          this.toaster.show(
            errorMessage,
            {
              classname: 'bg-danger text-white',
              delay: 5000
            }
          );
        }

      });
  }

}

