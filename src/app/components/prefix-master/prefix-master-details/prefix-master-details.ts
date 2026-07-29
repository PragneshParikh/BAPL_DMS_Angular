import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LoaderService } from '../../../core/services/loader';
import { ToastService } from '../../../shared/toaster/toast-service';
import { PrefixService } from '../../../core/services/prefix';
import { StorageService } from '../../../core/services/storage';
import { Router } from '@angular/router';
import { ModuleTypes } from '../../../constant';

@Component({
  selector: 'app-prefix-master-details',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './prefix-master-details.html',
  styleUrl: './prefix-master-details.scss',
})
export class PrefixMasterDetails implements OnInit {
  // lstModules = ModuleTypes;
  lstModules: any[] = [];
  lstFinancialYears: string[] = [];
  sequence = {
    moduleName: '',
    separator: '/',
    financialYear: '',
    prefix: '',
    padding: 3,
    nextNo: 1,
    increment: 1,
    isActive: true
  };

  isDuplicate = false;
  sequenceList: any = [];

  isSuperAdmin: boolean = false;
  dealerCode: string = '';

  constructor(
    private toast: ToastService,
    private prefixService: PrefixService,
    private storageService: StorageService,
    private router: Router,
    private loader: LoaderService
  ) {
    this.isSuperAdmin = storageService.getRole().toLowerCase() === 'superadmin'

    if (!this.isSuperAdmin) {
      this.dealerCode = storageService.getDealerCode();
      this.lstModules = ModuleTypes.filter(x => x.isAdmin === false);
    } else {
      this.lstModules = ModuleTypes.filter(x => x.isAdmin === true);
    }
  }

  ngOnInit() {
    this.getSequenceList();
    this.lstFinancialYears = this.generateFinancialYears();
    this.sequence.financialYear = this.getCurrentFinancialYear();
  }

  getSequenceList() {
    this.loader.show();
    this.prefixService.get().subscribe({
      next: (res) => {
        this.sequenceList = res;
        this.loader.hide();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toast.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 })
      }
    })
  }

  // getDealers() {
  //   this.loader.show();
  //   this.dealerService.getDealers().subscribe({
  //     next: (response) => {
  //       this.lstDealers = response.data
  //         .sort((a, b) => a.compname.localeCompare(b.compname));

  //       this.loader.hide();
  //     },
  //     error: (error) => {
  //       this.loader.hide();
  //       console.error('Error fetching dealers:', error);
  //       this.toast.show('Something went wrong.', {
  //         classname: 'bg-danger text-light',
  //         delay: 5000
  //       });
  //     }
  //   });

  // }

  generateFinancialYears(): string[] {
    const years: string[] = [];
    const currentYear = new Date().getFullYear();

    for (let i = -5; i <= 5; i++) {
      const startYear = currentYear + i;
      const endYear = startYear + 1;

      years.push(
        `${startYear.toString().slice(-2)}-${endYear.toString().slice(-2)}`
      );
    }

    return years;
  }

  generatePreview() {
    const length = this.sequence.padding || 4;
    const masked = '#'.repeat(length);
    const dealerCode = this.dealerCode === '' ? '001' : this.dealerCode.slice(-3);

    return `${this.sequence.prefix || ''}${this.sequence.separator || ''}${dealerCode}${this.sequence.separator || ''}${this.sequence.financialYear || ''}${this.sequence.separator || ''}${masked}`;
  }

  previewCount() {
    const length = this.sequence.padding || 4;
    const masked = '#'.repeat(length);
    const value = `${this.sequence.prefix || ''}${this.sequence.separator || ''}${this.sequence.financialYear || ''}${this.sequence.separator || ''}${masked}`;
    return value.length;
  }

  // onSubmit(form: any) {

  //   if (form.invalid) return;

  //   const length = this.sequence.padding || 4;
  //   const masked = '#'.repeat(length);
  //   const numberSequence: any = {
  //     id: 0,
  //     sequenceCode: `${this.sequence.prefix || ''}${this.sequence.separator || ''}${'DealerCode'}${this.sequence.separator || ''}${this.sequence.financialYear || ''}${this.sequence.separator || ''}${masked}`,
  //     sequenceName: this.sequence.moduleName,
  //     format: `${this.sequence.prefix || ''}${this.sequence.separator || ''}${'DealerCode'}${this.sequence.separator || ''}${this.sequence.financialYear || ''}${this.sequence.separator || ''}${masked}`,
  //     nextNo: this.sequence.nextNo || 0,
  //     increment: 1,
  //     // dealerCode: this.sequence.dealerCode,
  //     year: this.sequence.financialYear,
  //     isActive: this.sequence.isActive,
  //     createdBy: this.storageServie.getUserId() || 0,
  //     createdDate: new Date()
  //   }

  //   this.loader.show();
  //   this.prefixService.saveSequenceForDealers(numberSequence).subscribe({
  //     next: (response) => {
  //       this.backToList();
  //       this.loader.hide();
  //       this.toast.show('Sequence saved successfully.', { classname: 'bg-success text-light', delay: 3000 });
  //     },
  //     error: (error) => {
  //       this.loader.hide();
  //       console.error('Error saving sequence:', error);
  //       this.toast.show('Failed to save sequence.', { classname: 'bg-danger text-light', delay: 5000 });
  //     }
  //   });
  // }

  onSubmit(form: any) {

    if (form.invalid) return;

    const length = this.sequence.padding || 4;
    const masked = '#'.repeat(length);
    const numberSequence: any = {
      id: 0,
      sequenceCode: `${this.sequence.prefix || ''}${this.sequence.separator || ''}${'DealerCode'}${this.sequence.separator || ''}${this.sequence.financialYear || ''}${this.sequence.separator || ''}${masked}`,
      sequenceName: this.sequence.moduleName,
      format: `${this.sequence.prefix || ''}${this.sequence.separator || ''}${'DealerCode'}${this.sequence.separator || ''}${this.sequence.financialYear || ''}${this.sequence.separator || ''}${masked}`,
      nextNo: this.sequence.nextNo || 0,
      increment: 1,
      dealerCode: this.dealerCode,
      year: this.sequence.financialYear,
      isActive: this.sequence.isActive,
      createdBy: this.storageService.getUserId() || 0,
      createdDate: new Date()
    }

    this.loader.show();

    if (this.isSuperAdmin) {
      this.prefixService.saveSequenceForDealers(numberSequence).subscribe({
        next: (response) => {
          this.backToList();
          this.loader.hide();
          this.toast.show('Sequence saved successfully.', { classname: 'bg-success text-light', delay: 3000 });
        },
        error: (error) => {
          this.loader.hide();
          console.error('Error saving sequence:', error);
          this.toast.show('Failed to save sequence.', { classname: 'bg-danger text-light', delay: 5000 });
        }
      });
    } else {
      this.prefixService.saveSequence(numberSequence).subscribe({
        next: (response) => {
          this.backToList();
          this.loader.hide();
          this.toast.show('Sequence saved successfully.', { classname: 'bg-success text-light', delay: 3000 });
        },
        error: (error) => {
          this.loader.hide();
          console.error('Error saving sequence:', error);
          this.toast.show('Failed to save sequence.', { classname: 'bg-danger text-light', delay: 5000 });
        }
      });
    }
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

  prefixInfo() {
    return `<p class="p-1 text-white text-start">
          Prefix is generated as:
          <br>
          <strong>${this.sequence.prefix || ''}</strong> = Prefix Text
          <br>
          <strong>${this.dealerCode ?? '001'}</strong> = Dealer Code (3 characters)
          <br>
          <strong>${this.sequence.financialYear || ''}</strong> = Financial Year
          <br>
          <strong>###</strong> = Number sequence with padding (3 characters)
        </p>`;
  }

  checkDuplicate() {
    if (!this.sequence.moduleName || !this.sequence.financialYear) {
      this.isDuplicate = false;
      return;
    }

    const exists = this.sequenceList.some(x =>
      x.sequenceName === this.sequence.moduleName &&
      x.year === this.sequence.financialYear
    );

    this.isDuplicate = exists;
  }

}
