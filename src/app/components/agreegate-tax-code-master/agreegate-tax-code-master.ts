import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbHighlight, NgbModal, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { AgreegateTaxCodeMasterservice } from '../../core/services/agreegate-tax-code-masterservice';
import { debug } from 'console';

@Component({
  selector: 'app-agreegate-tax-code-master',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgbHighlight,
    NgbPaginationModule
  ],
  templateUrl: './agreegate-tax-code-master.html',
  styleUrls: ['./agreegate-tax-code-master.scss'],
})
export class AgreegateTaxCodeMaster implements OnInit {

  constructor(
    private agreegatetaxService: AgreegateTaxCodeMasterservice,
    private modalService: NgbModal
  ) { }

  // FORM DATA
  formData: any = {
    id: 0,
    ataxCode: '',
    description: '',
    SrNo: '',
    TaxCode: '',
    TaxRate: '',
    createdBy: 'Admin'
  };

  //taxcode dropdown list
  taxList: any[] = [];
  selectedTax: any;
  addGridData: any = {
    ataxCode: '',
    description: '',
    taxDetails: []
  };

  //  DATA LISTS
  taxDetails: any[] = [];
  filteredData: any[] = [];
  pagedData: any[] = [];

  selectedagreegateitem: any;
  searchTerm: string = '';

  //  PAGINATION
  page = 1;
  pageSize = 5;
  collectionSize = 0;

  //  SORTING
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  //  ALERT
  showAlert: boolean = false;
  alertMessage: string = '';


  ngOnInit(): void {
    this.loadAggreegateTaxCode();
    this.agreegatetaxService.getTaxCodesWithRate().subscribe(res => {
      this.taxList = res;
    });
  }
  onTaxChange() {
debugger
    if (this.selectedTax) {

      // 👇 BOTH values set karo
      this.formData.TaxCode = this.selectedTax.taxCode;
      this.formData.TaxRate = this.selectedTax.taxRate;

    } else {
      this.formData.TaxCode = '';
      this.formData.TaxRate = '';
    }
  }
  // LOAD DATA
  loadAggreegateTaxCode() {
    this.agreegatetaxService.getAggregateTaxcodesAsync(this.searchTerm)
      .subscribe({
        next: (res: any) => {

          console.log("FULL RESPONSE:", res);

          // CORRECT FIX
          this.filteredData = Array.isArray(res.data) ? res.data : [];

          this.collectionSize = this.filteredData.length;

          this.refreshTable();
        },
        error: (err) => console.error(err)
      });
  }

  //  SEARCH
  searchItems(event: any) {
    this.searchTerm = event.target.value || '';
    this.loadAggreegateTaxCode();
  }
  //  OPEN VIEW MODAL
  openDetails(modal: any, item: any) {

    // Step 1: Call API with selected ataxCode
    this.agreegatetaxService
      .getAggregateTaxCodesByAtaxCode(item.ataxCode)
      .subscribe({
        next: (res: any[]) => {

          // Step 2: Store full details
          this.selectedagreegateitem = {
            ataxCode: item.ataxCode,
            description: item.description,
            taxDetails: res
          };

          // Step 3: Open modal
          this.modalService.open(modal, { size: 'xl' });
        },
        error: (err) => console.error(err)
      });
  }
  //  INSERT
 addAggregateTax () {

    debugger;
    const nextSrNo = this.addGridData.taxDetails.length + 1;
    const payload = {
      ataxCode: this.formData.ataxCode,
      description: this.formData.description,
      createdBy: 'Admin',
      taxDetails: [
        {

          srNo: nextSrNo,
          taxCode: this.formData.TaxCode,
          taxRate: this.formData.TaxRate
        }
      ]
    };

    this.agreegatetaxService.insertAggregateTaxCode(payload)
      .subscribe({
        next: (res: any) => {

          this.addGridData.ataxCode = this.formData.ataxCode;
          this.addGridData.description = this.formData.description;

          this.addGridData.taxDetails.push({
            srNo: nextSrNo,
            taxCode: this.formData.TaxCode,
            taxRate: this.formData.TaxRate
          });
          this.loadAggreegateTaxCode();
          this.resetForm();
        },
        error: (err) => {
          this.alertMessage = err.error?.message;
          this.showAlert = true;
        }
      });
  }



  // SR NO CHANGE
  onSrNoChange() {
    const selected = this.taxDetails.find(
      x => x.srNo == this.formData.SrNo
    );

    if (selected) {
      this.formData.TaxCode = selected.taxCode;
      this.formData.TaxRate = selected.taxRate;
    }
  }

  //  PAGINATION
  pageChange(page: number) {
    this.page = page;
    this.refreshTable();
  }

  refreshTable() {

    if (!Array.isArray(this.filteredData)) {
      this.filteredData = [];
    }

    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.pagedData = this.filteredData.slice(start, end);
  }

  //  SORT
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

    this.refreshTable();
  }



  //  OPEN ADD MODAL
  openAddDetails(modal: any) {
    debugger;
    this.resetForm();
    this.addGridData = {
      ataxCode: '',
      description: '',
      taxDetails: []
    };

    this.modalService.open(modal, { size: 'xl' });
  }

  //  RESET FORM
  resetForm() {
    this.formData = {
      id: 0,
      ataxCode: '',
      description: '',
      TaxRate: '',
      createdBy: 'Admin'
    };
    this.selectedTax = null;
  }

}