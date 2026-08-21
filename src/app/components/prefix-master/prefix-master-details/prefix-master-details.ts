import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LoaderService } from '../../../core/services/loader';
import { ToastService } from '../../../shared/toaster/toast-service';
import { PrefixService } from '../../../core/services/prefix';
import { StorageService } from '../../../core/services/storage';
import { ActivatedRoute, Router } from '@angular/router';
import { ModuleTypes, BillingTypeOptions } from '../../../constant';

@Component({
  selector: 'app-prefix-master-details',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './prefix-master-details.html',
  styleUrl: './prefix-master-details.scss',
})
export class PrefixMasterDetails implements OnInit {
  lstModules = ModuleTypes;
  lstBillingTypes = BillingTypeOptions;   // ADDED — reuse existing constant instead of hardcoding
  lstFinancialYears: string[] = [];

  sequence = {
    moduleName: '',
    separator: '/',
    financialYear: '',
    prefix: '',
    padding: 3,
    nextNo: 1,
    increment: 1,
    isActive: true,
    billingType: null as number | null
  };

  isDuplicate = false;
  sequenceList: any = [];

  isSuperAdmin: boolean = false;
  dealerCode: string = '';
  isEditMode = false;
  editId: number = 0;

  // FIXED — correct name value confirmed from constant.ts's ModuleTypes array
  readonly VEHICLE_SALE_BILL_MODULE = 'sale_bill';

  get isVehicleSaleBillModule(): boolean {
    return this.sequence.moduleName === this.VEHICLE_SALE_BILL_MODULE;
  }

  constructor(
    private toast: ToastService,
    private prefixService: PrefixService,
    private storageService: StorageService,
    private router: Router,
    private route: ActivatedRoute,
    private loader: LoaderService
  ) {
    this.isSuperAdmin = storageService.getRole().toLowerCase() === 'superadmin';
    this.dealerCode = storageService.getDealerCode();

    // if (!this.isSuperAdmin) {
    //   this.lstModules = ModuleTypes.filter(x => x.isAdmin === false);
    // }
    // else {
    //   this.lstModules = ModuleTypes.filter(x => x.isAdmin === true);
    // }
  }

  ngOnInit() {
    this.getSequenceList();
    this.lstFinancialYears = this.generateFinancialYears();
    this.sequence.financialYear = this.getCurrentFinancialYear();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && Number(idParam) > 0) {
      this.isEditMode = true;
      this.editId = Number(idParam);
      this.loadForEdit(this.editId);
    }
  }

  loadForEdit(id: number) {
    this.loader.show();
    this.prefixService.getById(id).subscribe({
      next: (res: any) => {
        this.loader.hide();

        // Extract prefix text back out of the stored sequenceCode
        // (format: PREFIX/DEALER/YEAR/#####)
        const parts = (res.sequenceCode || '').split(this.sequence.separator);

        this.sequence = {
          moduleName: res.sequenceName,
          separator: this.sequence.separator,
          financialYear: res.year,
          prefix: parts[0] || '',
          padding: (res.sequenceCode.match(/#/g) || []).length || 3,
          nextNo: res.nextNo,
          increment: res.increment,
          isActive: res.isActive,
          billingType: res.billingType ?? null
        };
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toast.show('Failed to load sequence for editing.', { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
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
      years.push(`${startYear.toString().slice(-2)}-${endYear.toString().slice(-2)}`);
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

    const module = this.lstModules.filter(x => x.name === this.sequence.moduleName);

    if (module && module[0].isAdmin) return;

    if (form.invalid) return;
    if (this.isDuplicate) return;

    if (this.isVehicleSaleBillModule && !this.sequence.billingType) {
      this.toast.show('Please select a Billing Type.', { classname: 'bg-warning text-white', delay: 4000 });
      return;
    }

    const length = this.sequence.padding || 4;
    const masked = '#'.repeat(length);
    const numberSequence: any = {
      id: this.isEditMode ? this.editId : 0,
      sequenceCode: `${this.sequence.prefix || ''}${this.sequence.separator || ''}${'DealerCode'}${this.sequence.separator || ''}${this.sequence.financialYear || ''}${this.sequence.separator || ''}${masked}`,
      sequenceName: this.sequence.moduleName,
      format: `${this.sequence.prefix || ''}${this.sequence.separator || ''}${'DealerCode'}${this.sequence.separator || ''}${this.sequence.financialYear || ''}${this.sequence.separator || ''}${masked}`,
      nextNo: this.sequence.nextNo || 0,
      increment: 1,
      dealerCode: this.dealerCode,
      year: this.sequence.financialYear,
      isActive: this.sequence.isActive,
      billingType: this.isVehicleSaleBillModule ? this.sequence.billingType : null,
      createdBy: this.storageService.getUserId() || 0,
      createdDate: new Date()
    }

    this.loader.show();

    if (this.isEditMode) {
      this.prefixService.updatePrefix(this.editId, numberSequence).subscribe({
        next: () => {
          this.loader.hide();
          this.toast.show('Sequence updated successfully.', { classname: 'bg-success text-light', delay: 3000 });
          this.backToList();
        },
        error: (error) => {
          this.loader.hide();
          console.error(error);
          this.toast.show('Failed to update sequence.', { classname: 'bg-danger text-light', delay: 5000 });
        }
      });
    } else if (this.isSuperAdmin) {
      this.prefixService.saveSequenceForDealers(numberSequence).subscribe({
        next: () => {
          this.loader.hide();
          this.toast.show('Sequence saved successfully.', { classname: 'bg-success text-light', delay: 3000 });
          this.backToList();
        },
        error: (error) => {
          this.loader.hide();
          console.error(error);
          this.toast.show('Failed to save sequence.', { classname: 'bg-danger text-light', delay: 5000 });
        }
      });
    } else {
      this.prefixService.saveSequence(numberSequence).subscribe({
        next: () => {
          this.loader.hide();
          this.toast.show('Sequence saved successfully.', { classname: 'bg-success text-light', delay: 3000 });
          this.backToList();
        },
        error: (error) => {
          this.loader.hide();
          console.error(error);
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
    const month = today.getMonth() + 1;
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

  /**
   * FIXED — now includes Prefix text in the duplicate check (was only
   * checking Module + Financial Year before), and calls the real backend
   * check via CheckDuplicate() rather than relying only on the client-side
   * sequenceList snapshot, so Save reliably disables the moment a genuine
   * duplicate (same Module + Year + Prefix, still active) exists.
   */
  checkDuplicate() {
    if (!this.sequence.moduleName || !this.sequence.financialYear || !this.sequence.prefix) {
      this.isDuplicate = false;
      return;
    }

    if (this.isVehicleSaleBillModule && !this.sequence.billingType) {
      this.isDuplicate = false;
      return;
    }

    this.prefixService.checkDuplicate(
      this.dealerCode,
      this.sequence.moduleName,
      this.sequence.financialYear,
      this.sequence.prefix,
      this.isVehicleSaleBillModule ? this.sequence.billingType! : undefined,
      this.isEditMode ? this.editId : undefined
    ).subscribe({
      next: (isDup: boolean) => {
        this.isDuplicate = isDup;
      },
      error: (err) => {
        console.error(err);
        // fall back to client-side snapshot check if the API call fails
        this.isDuplicate = this.sequenceList.some((x: any) =>
          x.sequenceName === this.sequence.moduleName &&
          x.year === this.sequence.financialYear &&
          x.dealerCode === this.dealerCode &&
          x.sequenceCode?.includes(this.sequence.prefix) &&
          (this.isVehicleSaleBillModule ? x.billingType === this.sequence.billingType : true) &&
          (!this.isEditMode || x.id !== this.editId)
        );
      }
    });
  }

  isAdminModule() {
    const module = this.lstModules.filter(x => x.name === this.sequence.moduleName);

    if (module && module.length > 0 && module[0].isAdmin) {
      return true;
    }

    return false;
  }

}
