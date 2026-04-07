import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DealerService } from '../../../core/services/dealer-service';
import { LoaderService } from '../../../core/services/loader';
import { ToastService } from '../../../shared/toaster/toast-service';
import { PrefixService } from '../../../core/services/prefix';
import { StorageService } from '../../../core/services/storage';
import { Router } from '@angular/router';

@Component({
  selector: 'app-prefix-master-details',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './prefix-master-details.html',
  styleUrl: './prefix-master-details.scss',
})
export class PrefixMasterDetails implements OnInit {

  lstDealers: any[] = [];
  lstFinancialYears: string[] = [];
  sequence = {
    moduleName: 'INVOICE',
    dealerCode: '',
    financialYear: '',
    prefix: '',
    padding: 5,
    nextNo: 0,
    isActive: true
  };

  constructor(
    private dealerService: DealerService,
    private loader: LoaderService,
    private toast: ToastService,
    private prefixService: PrefixService,
    private storageServie: StorageService,
    private router: Router
  ) { }

  ngOnInit() {
    this.getDealers();

    this.lstFinancialYears = this.generateFinancialYears();

    this.sequence.financialYear = this.getCurrentFinancialYear();
  }

  getDealers() {
    this.loader.show();
    this.dealerService.getDealers().subscribe({
      next: (response) => {
        this.lstDealers = response.data
          .sort((a, b) => a.compname.localeCompare(b.compname));

        this.loader.hide();
      },
      error: (error) => {
        this.loader.hide();
        console.error('Error fetching dealers:', error);
        this.toast.show('Something went wrong.', {
          classname: 'bg-danger text-light',
          delay: 5000
        });
      }
    });

  }

  generateFinancialYears(): string[] {
    const years: string[] = [];
    const currentYear = new Date().getFullYear();

    // 5 years before and 5 years after
    for (let i = -5; i <= 5; i++) {
      const startYear = currentYear + i;
      const endYear = startYear + 1;
      years.push(`${startYear.toString().slice(-2)}-${endYear.toString().slice(-2)}`);
    }
    return years;
  }

  generatePreview() {
    const length = this.sequence.padding || 4;
    const masked = '#'.repeat(length);
    return `${this.sequence.prefix || ''}${this.sequence.dealerCode || ''}${this.sequence.financialYear || ''}${masked}`;
  }

  saveSequence() {
    const length = this.sequence.padding || 4;
    const masked = '#'.repeat(length);
    const numberSequence: any = {
      id: 0,
      sequenceCode: `${this.sequence.prefix || ''}${this.sequence.dealerCode || ''}${this.sequence.financialYear || ''}`,
      sequenceName: this.sequence.moduleName,
      format: `${this.sequence.prefix || ''}${this.sequence.dealerCode || ''}${this.sequence.financialYear || ''}${masked}`,
      nextNo: this.sequence.nextNo || 0,
      increment: 1,
      dealerCode: this.sequence.dealerCode,
      year: this.sequence.financialYear,
      isActive: this.sequence.isActive,
      createdBy: this.storageServie.getUserId() || 0,
      createdDate: new Date()
    }

    console.log('Saving sequence:', numberSequence);

    this.prefixService.saveSequence(numberSequence).subscribe({
      next: (response) => {
        this.backToList();
        this.toast.show('Sequence saved successfully.', { classname: 'bg-success text-light', delay: 3000 });
      },
      error: (error) => {
        console.error('Error saving sequence:', error);
        this.toast.show('Failed to save sequence.', { classname: 'bg-danger text-light', delay: 5000 });
      }
    });
  }

  backToList() {
    this.router.navigate(['/prefix']);
  }

  getCurrentFinancialYear(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // Jan = 0

    let startYear = month >= 4 ? year : year - 1;
    let endYear = startYear + 1;

    return `${startYear.toString().slice(-2)}-${endYear.toString().slice(-2)}`;
  }

}
