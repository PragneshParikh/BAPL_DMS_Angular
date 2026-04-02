import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbHighlight, NgbModal, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { Hsnwisetaxcodeservice } from '../../core/services/hsnwisetaxcodeservice';
import { AddHsnTaxPayload, HsnTaxFormModel } from '../../ViewModels/HSNWiseTaxcodeModel';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';

@Component({
  selector: 'app-hsnwisetaxcode',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgbHighlight,
    NgbPaginationModule
  ],
  templateUrl: './hsnwisetaxcode.html',
  styleUrl: './hsnwisetaxcode.scss',
})
export class Hsnwisetaxcode implements OnInit {

  constructor(
    private hsnwisetaxcodeservice: Hsnwisetaxcodeservice,
    private loader: LoaderService,
    public toaster: ToastService,
    private modalService: NgbModal
  ) { }

  // PAGINATION
  page = 1;
  pageSize = 10;
  collectionSize = 0;
  pagedData: any[] = [];

  // SORTING
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // ALERT
  showAlert: boolean = false;
  alertMessage: string = '';

  // FORM DATA
  payload: any
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

  // DROPDOWNS
  selectedTax: any = null;   // FIX (type) for TaxCode
  HsnCodeDDList: any[] = [];
  ataxCodeList: any[] = [];


  // GRID DATA
  griddata: any[] = [];
  filteredData: any[] = [];

  searchTerm: string = '';

  ngOnInit(): void {
    this.getHsnwiseTaxcodedetails();
    this.getHsnCodeList();
    this.getATaxCodeList();
  }

  // HSN LIST
  getHsnCodeList() {
    this.hsnwisetaxcodeservice.getHsncodeList().subscribe({
      next: (res: any) => {
        this.HsnCodeDDList = res;
      },
      error: (err) => console.error(err)
    });
  }

  // ATAX LIST
  getATaxCodeList() {
    this.hsnwisetaxcodeservice.getAggregateTaxCodeList().subscribe({
      next: (res: any) => {
        console.log("ATax List", res);
        this.ataxCodeList = res;
      },
      error: (err) => console.error(err)
    });
  }

  // MAIN LIST
  getHsnwiseTaxcodedetails() {
    this.loader.show();
    this.hsnwisetaxcodeservice.getHsnwiseTaxcodedetails(this.searchTerm)
      .subscribe({
        next: (res: any) => {
          this.griddata = res;
          this.filteredData = [...this.griddata];
          this.collectionSize = this.filteredData.length;
          this.loader.hide();
          this.refreshTable();
        },
        error: (err) => {
          console.error(err)
          this.loader.hide();
        }

      });
  }

  // OPEN MODAL
  openAddDetails(modal: any) {
    this.resetForm();
    this.modalService.open(modal, { size: 'xl' });
  }

  // ATAX CHANGE
  onATaxCodeChange() {
    const selected = this.formData.selectedATax;

    if (selected) {
      this.formData.taxCode = selected.taxCode;
      this.formData.taxRate = selected.taxRate;
      this.formData.ataxCode = selected.ataxCode; // API ke liye
    } else {
      this.formData.taxCode = '';
      this.formData.taxRate = 0;
      this.formData.ataxCode = '';
    }
  }

  // INSERT
  addHSNWiseATax(form: any, modal: any) {

    const payload: AddHsnTaxPayload = {
      hsncode: this.formData.hsncode || '',
      ataxCode: this.formData.ataxCode,
      stateFlag: this.formData.stateflag,
      effectiveDate: this.formData.effectivedate,
      createdBy: this.formData.createdBy
    };

    console.log("Payload :", payload);
    this.loader.show();
    this.hsnwisetaxcodeservice.insertHsnwiseTaxcodedetails(payload)
      .subscribe({
        next: () => {
          this.toaster.show('HSNWise TaxCode details added successfully!', {
            classname: 'bg-success text-white',
            delay: 5000
          });

          this.getHsnwiseTaxcodedetails();
          this.loader.hide();
          setTimeout(() => {
            modal.close();   // this will close popup
            form.resetForm(); // optional reset
          }, 1000); // 1 sec delay
          form.resetForm();
        },
        error: (err) => {
          console.error(err);
          this.showAlert = true;
          this.alertMessage = 'Failed to adding HSNWise TaxCode details';
          this.loader.hide();
        }
      });
  }

  // SEARCH
  searchItems(event: any) {
    this.searchTerm = event.target.value || '';
    this.getHsnwiseTaxcodedetails();
  }

  // PAGINATION
  pageChange(page: number) {
    this.page = page;
    this.refreshTable();
  }

  refreshTable() {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagedData = this.filteredData.slice(start, end);
  }

  // SORTING
  sort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredData.sort((a, b) => {
      let valueA = a[column] ?? '';
      let valueB = b[column] ?? '';
      const result = valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      return this.sortDirection === 'asc' ? result : -result;
    });

    this.page = 1;
    this.refreshTable();
  }

  // RESET
  resetForm() {
    this.formData = {
      id: 0,
      hsncode: null,
      selectedATax: null,
      ataxCode: '',
      taxCode: '',
      taxRate: 0,
      stateflag: '',
      effectivedate: '',
      createdBy: 'Admin'
    };
  }
}