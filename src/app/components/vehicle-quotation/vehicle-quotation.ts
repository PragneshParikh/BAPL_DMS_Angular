import { Component, OnInit, OnChanges, SimpleChanges, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { VehicleQuotationService } from '../../core/services/vehicle-quotationservice';
import { DealerService } from '../../core/services/dealer-service';
import { ColorMasterService } from '../../core/services/color-master.service';
import { StateService } from '../../core/services/state';
import { CityService } from '../../core/services/city';
import { ItemMasterService } from '../../core/services/item-master-service';
import { OemmodelMasterService } from '../../core/services/oemmodel-master-service';
import { LedgerMasterService } from '../../core/services/ledger-master';


@Component({
  selector: 'app-vehicle-quotation',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './vehicle-quotation.html',
  styleUrls: ['./vehicle-quotation.scss']
})
export class VehicleQuotation implements OnInit, OnChanges {

  @Input() quotationId?: number;
  @Input() isModal: boolean = false;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  quotationData: any = {};
  isEditMode: boolean = false;

  dealers: any[] = [];
  models: any[] = [];
  filteredVariants: any[] = [];
  colors: any[] = [];

  states: any[] = [];
  cities: any[] = [];
  filteredCities: any[] = [];
  financeCompanies: any[] = [];

  colorLocked: boolean = false;
  private lastFetchedItem: any = null;

  private masterDataLoaded = false;

  errors: {
    quotationDate?: string;
    validTillDate?: string;
    dealerId?: string;
    customerName?: string;
    mobileNo?: string;
    emailId?: string;
    stateId?: string;
    cityId?: string;
    modelId?: string;
    variantId?: string;
    exShowroomPrice?: string;
    exchangeAmount?: string;
    financeCompanyId?: string;
    loanAmount?: string;
    downPayment?: string;
  } = {};

  private readonly emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(
    private quotationService: VehicleQuotationService,
    private router: Router,
    private route: ActivatedRoute,
    private dealerService: DealerService,
    private colorService: ColorMasterService,
    private itemService: ItemMasterService,
    private stateService: StateService,
    private cityService: CityService,
    private oemModelService: OemmodelMasterService,
    private LedgerService: LedgerMasterService
  ) { }

  ngOnInit(): void {
    forkJoin({
      dealers: this.dealerService.getDealerDropdown(null),
      colors: this.colorService.getColor(),
      models: this.oemModelService.getAllOEMModels(),
      states: this.stateService.get(),
      cities: this.cityService.getAllWithState(),
      financeCompanies: this.LedgerService.getLedgerByType('Financier')
    }).subscribe({
      next: (result) => {
        this.dealers = this.toArray(result.dealers);
        this.colors = this.toArray(result.colors);
        this.models = this.toArray(result.models);
        this.states = this.toArray(result.states);
        this.cities = this.toArray(result.cities);

        this.financeCompanies = this.toArray(result.financeCompanies);

        this.masterDataLoaded = true;

        if (!this.isModal) {
          const id = Number(this.route.snapshot.paramMap.get('id'));
          this.loadRecordOrDefaults(id);
        } else {
          this.loadRecordOrDefaults(Number(this.quotationId));
        }
      },
      error: (err) => {
        console.error('Master data load error', err);
        this.dealers = [];
        this.colors = [];
        this.models = [];
        this.states = [];
        this.cities = [];
        this.financeCompanies = [];
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.isModal) return;
    if (!this.masterDataLoaded) return;
    if (!changes['quotationId']) return;

    this.loadRecordOrDefaults(Number(this.quotationId));
  }

  private loadRecordOrDefaults(id: number): void {
    if (id) {
      this.isEditMode = true;
      this.loadQuotationForEdit(id);
    } else {
      this.isEditMode = false;
      this.setDefaultsForNewQuotation();
    }
  }

  private setDefaultsForNewQuotation(): void {
    this.quotationData = {};
    this.quotationData.quotationDate = this.formatDate(new Date());
    this.quotationData.dealerId = '';
    this.quotationData.hypothecationAmount = 0;
    this.quotationData.plateAmount = 0;
    this.quotationData.handlingCharges = 0;
    this.quotationData.validTillDate = '';
    this.quotationData.totalAmount = 0;
    this.quotationData.stateId = '';
    this.quotationData.cityId = '';
    this.quotationData.modelId = '';
    this.quotationData.variantId = '';
    this.quotationData.colorId = '';
    this.quotationData.financeCompanyId = '';
    this.quotationData.customerGSTNo = '';
    this.quotationData.customerPanNo = '';
    this.quotationData.oldCompanyName = '';
    this.quotationData.oldModelName = '';
    this.colorLocked = false;
    this.lastFetchedItem = null;
    this.generateQuotationNo();
  }

  private toArray(response: any): any[] {
    if (Array.isArray(response)) {
      return response;
    }
    if (response && Array.isArray(response.data)) {
      return response.data;
    }
    if (response && Array.isArray(response.Data)) {
      return response.Data;
    }
    if (response && Array.isArray(response.items)) {
      return response.items;
    }
    return [];
  }

  loadQuotationForEdit(id: number): void {

    this.quotationService.getQuotationById(id).subscribe({
      next: (response: any) => {

        this.quotationData = { ...response };

        this.isEditMode = true;

        this.quotationData.id = response.vehicleQuotationId;
        this.quotationData.vehicleQuotationId = response.vehicleQuotationId;

        this.quotationData.dealerId =
          response.dealerId != null ? String(response.dealerId) : '';

        this.quotationData.modelId =
          response.modelId != null ? String(response.modelId) : '';

        this.quotationData.variantId =
          response.variantId != null ? String(response.variantId) : '';

        this.quotationData.colorId =
          response.colorId != null ? String(response.colorId) : '';

        this.quotationData.financeCompanyId =
          response.financeCompanyId != null ? String(response.financeCompanyId) : '';

        this.quotationData.stateId =
          response.stateId != null ? String(response.stateId) : '';

        this.quotationData.cityId =
          response.cityId != null ? String(response.cityId) : '';

        this.quotationData.quotationDate =
          this.formatDate(response.quotationDate);

        this.quotationData.validTillDate =
          this.formatDate(response.validTillDate ?? response.validTill);

        this.quotationData.customerGSTNo = response.customerGSTNo ?? '';
        this.quotationData.customerPanNo = response.customerPanNo ?? '';
        this.quotationData.oldCompanyName = response.oldCompanyName ?? '';
        this.quotationData.oldModelName = response.oldModelName ?? '';

        // Populate city list for selected state
        this.onStateChange(true);

        // Restore selected city after filtering
        setTimeout(() => {

          this.quotationData.cityId =
            response.cityId != null
              ? String(response.cityId)
              : '';

        });

        if (this.quotationData.modelId) {
          this.onModelChange(true);
        }

        this.calculateTotal();
      },
      error: err => console.error(err)
    });

  }

  formatDate(value: any): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  onDealerChange(): void {
    this.recalculateTax();
  }

  trackById(index: number, item: any): any {
    return item.id ?? item.modelId ?? item.itemId ?? item.colorId ?? item.financeCompanyId;
  }

  onModelChange(preserveVariant: boolean = false): void {
    const selectedModelId = this.quotationData.modelId;

    if (!selectedModelId) {
      this.filteredVariants = [];
      if (!preserveVariant) {
        this.quotationData.variantId = '';
        this.resetColor();
      }
      return;
    }

    this.itemService.getItemsByOEMModel(Number(selectedModelId)).subscribe({
      next: (response: any) => {
        this.filteredVariants = this.toArray(response);

        if (!preserveVariant) {
          this.quotationData.variantId = '';
          this.resetColor();
        } else if (this.quotationData.variantId) {
          const selectedVariant = this.filteredVariants.find(
            v => String(v.id ?? v.itemId) === String(this.quotationData.variantId)
          );
          this.applyVariantColor(selectedVariant);
          this.applyBasePricing(selectedVariant);
          this.fetchGstRates(selectedVariant);
        }
      },
      error: (error) => {
        console.error('Variant load error', error);
        this.filteredVariants = [];
      }
    });
  }

  onVariantChange(variantId: any): void {
    this.quotationData.variantId = variantId;
    this.resetColor();

    if (!variantId) return;

    const selectedVariant = this.filteredVariants.find(
      v => String(v.id ?? v.itemId) === String(variantId)
    );

    this.applyVariantColor(selectedVariant);
    this.applyBasePricing(selectedVariant);
    this.fetchGstRates(selectedVariant);
  }

  private resetColor(): void {
    this.quotationData.colorId = '';
    this.colorLocked = false;
    this.lastFetchedItem = null;
    this.quotationData.exShowroomPrice = 0;
    this.quotationData.taxAmount = 0;
    this.quotationData.sgstAmount = 0;
    this.quotationData.cgstAmount = 0;
    this.quotationData.igstAmount = 0;
    this.quotationData.fame2Amount = 0;
    this.quotationData.custPrice = 0;
    this.calculateTotal();
  }

  private applyVariantColor(selectedVariant: any): void {
    const colorCode =
      selectedVariant?.colorcode ?? selectedVariant?.colorCode ?? selectedVariant?.Colorcode;

    if (!colorCode) {
      this.quotationData.colorId = '';
      this.colorLocked = false;
      return;
    }

    const matchedColor = this.colors.find(c =>
      String(c.colorcode ?? c.colorCode ?? c.Colorcode ?? '').toUpperCase()
      === String(colorCode).toUpperCase()
    );

    if (matchedColor) {
      this.quotationData.colorId = String(matchedColor.id ?? matchedColor.colorId ?? matchedColor.rrgcoloridno);
      this.colorLocked = true;
    } else {
      console.warn('No ColorMaster match for Colorcode:', colorCode);
      this.quotationData.colorId = '';
      this.colorLocked = false;
    }
  }

  private applyBasePricing(selectedVariant: any): void {
    const d = this.quotationData;

    const custPrice = Number(selectedVariant?.custprice ?? selectedVariant?.Custprice) || 0;
    const fame2Amount = Number(selectedVariant?.fame2amount ?? selectedVariant?.Fame2amount) || 0;

    d.custPrice = custPrice;
    d.fame2Amount = fame2Amount;
    d.taxAmount = 0;
    d.sgstAmount = 0;
    d.cgstAmount = 0;
    d.igstAmount = 0;

    d.exShowroomPrice = Math.round((custPrice - fame2Amount) * 100) / 100;
    this.calculateTotal();
  }

  private fetchGstRates(selectedVariant: any): void {
    const itemCode = selectedVariant?.itemcode ?? selectedVariant?.itemCode;
    if (!itemCode) return;

    this.itemService.getPurchaseDetailsWithHsnTaxByModelNo(itemCode).subscribe({
      next: (item: any) => {
        if (!item) return;
        this.lastFetchedItem = item;
        this.applyGstToPrice(item);
      },
      error: (err) => {
        console.error('GST rate fetch error', err);
      }
    });
  }

  private applyGstToPrice(item: any): void {

    const d = this.quotationData;

    const custPrice = Number(d.custPrice) || 0;
    const fame2Amount = Number(d.fame2Amount) || 0;

    const dealer = this.dealers.find(
      x => String(x.id) === String(d.dealerId)
    );

    const dealerStateId = dealer?.stateId;
    const customerStateId = d.stateId;

    const interState =
      dealerStateId &&
      customerStateId &&
      String(dealerStateId) !== String(customerStateId);

    const sgstRate = Number(item.sgst ?? 0);
    const cgstRate = Number(item.cgst ?? 0);

    let igstRate = Number(item.igst ?? 0);

    if (interState && igstRate === 0) {
      igstRate = sgstRate + cgstRate;
    }

    const round2 = (v: number) => Math.round(v * 100) / 100;

    if (interState) {
      d.sgstAmount = 0;
      d.cgstAmount = 0;
      d.igstAmount = round2(custPrice * igstRate / 100);
    } else {
      d.sgstAmount = round2(custPrice * sgstRate / 100);
      d.cgstAmount = round2(custPrice * cgstRate / 100);
      d.igstAmount = 0;
    }

    d.taxAmount = round2(
      d.sgstAmount +
      d.cgstAmount +
      d.igstAmount
    );

    d.exShowroomPrice = round2(
      custPrice + d.taxAmount - fame2Amount
    );

    this.calculateTotal();
  }

  recalculateTax(): void {
    if (this.lastFetchedItem) {
      this.applyGstToPrice(this.lastFetchedItem);
    }
  }

  onStateChange(isEdit: boolean = false): void {

    this.filteredCities = this.cities.filter(x =>
      Number(x.stateId) === Number(this.quotationData.stateId)
    );

    if (!isEdit) {
      this.quotationData.cityId = '';
    }

    this.recalculateTax();
  }

  onlyDigits(event: any, field: 'mobileNo', maxLen: number): void {
    let value = String(event.target.value || '').replace(/\D/g, '');
    if (value.length > maxLen) {
      value = value.slice(0, maxLen);
    }
    this.quotationData[field] = value;
    event.target.value = value;
  }

  calculateTotal(): void {
    const d = this.quotationData;
    const num = (v: any) => Number(v) || 0;

    const total =
      num(d.exShowroomPrice) +
      num(d.rtoCharges) +
      num(d.insuranceAmount) +
      num(d.accessoriesAmount) +
      num(d.extendedWarrantyAmount) +
      num(d.amcAmount) +
      num(d.otherCharges) +
      num(d.hypothecationAmount) +
      num(d.plateAmount) +
      num(d.handlingCharges) -
      num(d.discountAmount) -
      num(d.exchangeAmount);

    this.quotationData.totalAmount = total < 0 ? 0 : total;
  }

  // =====================================
  // VALIDATION
  // Finance section is fully optional with no cross-field enforcement.
  // Status field has been removed entirely — no default, no validation,
  // no submission payload.
  // =====================================
  validateForm(): boolean {
    this.errors = {};
    let valid = true;
    const d = this.quotationData;

    if (!d.quotationDate) {
      this.errors.quotationDate = 'Quotation date is required.';
      valid = false;
    }

    if (!d.validTillDate) {
      this.errors.validTillDate = 'Valid Till Date is required.';
      valid = false;
    }

    if (!d.dealerId) {
      this.errors.dealerId = 'Dealer is required.';
      valid = false;
    }

    if (!d.customerName?.trim()) {
      this.errors.customerName = 'Customer name is required.';
      valid = false;
    }

    if (!d.stateId) {
      this.errors.stateId = 'State is required.';
      valid = false;
    }

    if (!d.cityId) {
      this.errors.cityId = 'City is required.';
      valid = false;
    }

    const mobile = String(d.mobileNo ?? '').trim();
    if (!mobile) {
      this.errors.mobileNo = 'Mobile number is required.';
      valid = false;
    } else if (!/^\d{10}$/.test(mobile)) {
      this.errors.mobileNo = 'Mobile number must be exactly 10 digits.';
      valid = false;
    }

    const email = String(d.emailId ?? '').trim();
    if (email && !this.emailPattern.test(email)) {
      this.errors.emailId = 'Enter a valid email address.';
      valid = false;
    }

    if (!d.modelId) {
      this.errors.modelId = 'Model is required.';
      valid = false;
    }

    if (!d.variantId) {
      this.errors.variantId = 'Variant is required.';
      valid = false;
    }

    const price = String(d.exShowroomPrice ?? '').trim();
    if (!price || Number(price) <= 0) {
      this.errors.exShowroomPrice = 'Ex-showroom price is required.';
      valid = false;
    }

    // Exchange: only enforced if the user entered something
    if (d.exchangeAmount !== undefined && d.exchangeAmount !== null && d.exchangeAmount !== '') {
      if (Number(d.exchangeAmount) <= 0) {
        this.errors.exchangeAmount = 'Exchange amount must be greater than 0.';
        valid = false;
      }
    }

    return valid;
  }

  onSubmit(form: any): void {

    if (!this.validateForm()) {
      console.warn('Validation failed:', this.errors);
      alert('Please fix the highlighted fields before saving.');
      return;
    }

    this.calculateTotal();

    const quotationId =
      this.quotationData.vehicleQuotationId ||
      this.quotationData.id ||
      this.quotationId ||
      0;

    const quotationObj = {

      id: quotationId,

      quotationNo: this.quotationData.quotationNo,
      quotationDate: this.quotationData.quotationDate,

      dealerId: this.quotationData.dealerId
        ? Number(this.quotationData.dealerId)
        : null,

      customerName: this.quotationData.customerName,
      mobileNo: this.quotationData.mobileNo,
      emailId: this.quotationData.emailId,
      address: this.quotationData.address,
      customerGSTNo: this.quotationData.customerGSTNo || null,
      customerPanNo: this.quotationData.customerPanNo || null,

      stateId: this.quotationData.stateId
        ? Number(this.quotationData.stateId)
        : null,

      cityId: this.quotationData.cityId
        ? Number(this.quotationData.cityId)
        : null,

      modelId: this.quotationData.modelId
        ? Number(this.quotationData.modelId)
        : null,

      variantId: this.quotationData.variantId
        ? Number(this.quotationData.variantId)
        : null,

      colorId: this.quotationData.colorId
        ? Number(this.quotationData.colorId)
        : null,

      custPrice: Number(this.quotationData.custPrice) || 0,
      fame2Amount: Number(this.quotationData.fame2Amount) || 0,
      sgstAmount: Number(this.quotationData.sgstAmount) || 0,
      cgstAmount: Number(this.quotationData.cgstAmount) || 0,
      igstAmount: Number(this.quotationData.igstAmount) || 0,

      exShowroomPrice: Number(this.quotationData.exShowroomPrice) || 0,
      rtoCharges: Number(this.quotationData.rtoCharges) || 0,
      insuranceAmount: Number(this.quotationData.insuranceAmount) || 0,
      accessoriesAmount: Number(this.quotationData.accessoriesAmount) || 0,
      extendedWarrantyAmount: Number(this.quotationData.extendedWarrantyAmount) || 0,
      amcAmount: Number(this.quotationData.amcAmount) || 0,
      otherCharges: Number(this.quotationData.otherCharges) || 0,
      discountAmount: Number(this.quotationData.discountAmount) || 0,
      taxAmount: Number(this.quotationData.taxAmount) || 0,
      totalAmount: Number(this.quotationData.totalAmount) || 0,

      isExchange: Number(this.quotationData.exchangeAmount) > 0,
      exchangeAmount: Number(this.quotationData.exchangeAmount) || 0,
      oldCompanyName: this.quotationData.oldCompanyName || null,
      oldModelName: this.quotationData.oldModelName || null,

      isFinance: !!(
        this.quotationData.financeCompanyId ||
        this.quotationData.loanAmount ||
        this.quotationData.downPayment
      ),

      financeCompanyId: this.quotationData.financeCompanyId
        ? Number(this.quotationData.financeCompanyId)
        : null,

      loanAmount: Number(this.quotationData.loanAmount) || 0,
      downPayment: Number(this.quotationData.downPayment) || 0,

      remarks: this.quotationData.remarks,

      hypothecationAmount: Number(this.quotationData.hypothecationAmount) || 0,
      plateAmount: Number(this.quotationData.plateAmount) || 0,
      handlingCharges: Number(this.quotationData.handlingCharges) || 0,

      validTillDate: this.quotationData.validTillDate
    };

    if (quotationId > 0) {

      this.quotationService.updateQuotation(quotationId, quotationObj).subscribe({

        next: (res) => {
          alert('Quotation Updated Successfully');

          if (this.isModal) {
            this.saved.emit();
          } else {
            this.backToList();
          }
        },

        error: (err) => {
          console.error('Update Error', err);
          alert(
            'Update Failed : ' +
            (err.error?.message || err.message)
          );
        }

      });

    } else {

      this.quotationService.saveQuotation(quotationObj).subscribe({

        next: (res) => {
          alert('Quotation Saved Successfully');

          if (this.isModal) {
            this.saved.emit();
          } else {
            this.backToList();
          }
        },

        error: (err) => {
          console.error('Save Error', err);
          alert(
            'Save Failed : ' +
            (err.error?.message || err.message)
          );
        }

      });

    }

  }

  backToList(): void {
    if (this.isModal) {
      this.closed.emit();
    } else {
      this.router.navigate(['/vehicle-quotation']);
    }
  }

  generateQuotationNo(): void {
    this.quotationService.generateQuotationNo().subscribe({
      next: (quotationNo: string) => {
        this.quotationData.quotationNo = quotationNo;
      },
      error: (error) => {
        console.error('Quotation number generation error', error);
        this.quotationData.quotationNo = '';
      }
    });
  }
}