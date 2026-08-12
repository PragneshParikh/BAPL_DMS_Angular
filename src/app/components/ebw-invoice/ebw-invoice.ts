//BAPL_DMS_Angular\src\app\components\ebw-invoice\ebw-invoice.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LocationMasterService } from '../../core/services/location-master-service';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import { StorageService } from '../../core/services/storage';
import { ExtendedBatteryWarrantyService } from '../../core/services/extended-battery-warranty';
import { ChassisSearchService } from '../../core/services/chassis-search-service';
import { EbwInvoiceService } from '../../core/services/ebw-invoice-service';
import { EbwReportService } from '../../core/services/ebw-report-service';
import { PartsInwardService } from '../../core/services/partsinwardservice';

@Component({
  selector: 'app-ebw-invoice',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ebw-invoice.html',
  styleUrl: './ebw-invoice.scss',
})
export class EBWInvoice implements OnInit {
  dealerCode: string = '';
  dealerState: string = '';

  invoiceId: number | null = null;
  isEditMode: boolean = false;

  formData: any = {
    date: new Date().toISOString().split('T')[0],
    prefixNo: '',
    billNo: '',
    locationCode: '',
    billType: 'Cash',
    cashAccountId: 0,
    schemeId: null,
    chassisNo: '',
    party: '',
    partyMobile: '',
    partyAddress: '',
    partyCity: '',
    partyPincode: '',
    partyState: '',
    soldByDealerCode: '',
    serialNo: '',
    remarks: '',
  };

  cashAccounts = [
    { id: 0, name: '--Select--' },
    { id: 130, name: 'Bank Transfer' },
    { id: 85, name: 'Cash' },
    { id: 86, name: 'Cheque' },
    { id: 84, name: 'UPI Payment' },
  ];

  locationList: any[] = [];
  schemeList: any[] = [];
  chassisList: string[] = [];
  serialNoList: string[] = [];

  chassisSearchTerm: string = '';
  serialSearchTerm: string = '';
  showChassisDropdown = false;
  showSerialDropdown = false;

  chassisSaleDate: Date | null = null;
  validityExpiryDate: Date | null = null;
  isChassisExpired: boolean = false;
  daysRemaining: number | null = null;

  showGlobalSearchPopup: boolean = false;
  globalChassisSearchTerm: string = '';
  globalSaleData: any = null;
  globalSearchNotFound: boolean = false;

  // ===== Item entry — matches add-counter-bill.ts's `model` item fields exactly =====
  itemObj: any = {
    itemName: '',
    itemCode: '',
    itemDesc: '',
    hsnCode: '',
    inStock: 0,
    qty: 1,
    itemMrp: 0,          // read-only, anchor value fetched from PartsInward
    baseItemRate: 0,      // = mrp - (mrp * gst% / 100), read-only, same as counter-bill's model.baseItemRate
    itemRate: 0,          // post-discount rate, read-only, shown to user
    igstPer: 0,
    igstAmount: 0,
    cgstPer: 0,
    cgstAmount: 0,
    sgstPer: 0,
    sgstAmount: 0,
    itemDiscount: 0,      // EDITABLE — triggers recalc live, same as counter-bill
    discountType: 'Value', // EDITABLE
    itemTotalAmount: 0,
  };

  editIndex: number = -1;
  itemsList: any[] = [];

  showDiscountPopup: boolean = false;
  discountModel = {
    partsDiscountType: 'Value',
    partsDiscount: 0,
  };

  constructor(
    private locationMasterService: LocationMasterService,
    private extendedBatteryWarrantyService: ExtendedBatteryWarrantyService,
    private chassisSearchService: ChassisSearchService,
    private ebwInvoiceService: EbwInvoiceService,
    private ebwReportService: EbwReportService,
    private partInwardService: PartsInwardService,
    private loader: LoaderService,
    private toast: ToastService,
    private storageService: StorageService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.dealerCode = this.storageService.getDealerCode();
  }

  ngOnInit(): void {
    this.getLocationList();
    this.getSchemeList();

    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      this.isEditMode = true;
      this.invoiceId = Number(idParam);
      this.loadInvoiceForEdit(this.invoiceId);
    } else {
      this.getNextPrefixNo();
    }
  }

  getLocationList() {
    this.loader.show();
    this.locationMasterService.getLocationByDealerCodeAndAreaId(this.dealerCode, 2).subscribe({
      next: (res: any) => {
        this.locationList = res;
        this.loader.hide();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toast.show('Something went wrong.', { classname: 'bg-danger text-white', delay: 5000 });
      },
    });
  }

  getSchemeList() {
    this.loader.show();
    this.extendedBatteryWarrantyService.getByPaged('', 0, 1000).subscribe({
      next: (res: any) => {
        this.schemeList = (res.data || []).filter((s: any) => s.isActive === true);
        this.loader.hide();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toast.show('Something went wrong.', { classname: 'bg-danger text-white', delay: 5000 });
      },
    });
  }

  getNextPrefixNo() {
    this.ebwInvoiceService.getNextPrefixNo(this.dealerCode).subscribe({
      next: (res: any) => {
        this.formData.prefixNo = res.prefixNo;
        this.formData.billNo = res.nextNo;
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  loadInvoiceForEdit(id: number) {
    this.loader.show();
    this.ebwInvoiceService.getById(id).subscribe({
      next: (res: any) => {
        this.loader.hide();

        this.formData = {
          date: res.invoiceDate,
          prefixNo: res.prefixNo,
          billNo: res.billNo,
          locationCode: res.locationCode,
          billType: res.billType,
          cashAccountId: res.cashAccountId,
          schemeId: res.schemeId,
          chassisNo: res.chassisNo,
          party: res.partyName,
          partyMobile: res.partyMobile,
          partyAddress: res.partyAddress,
          partyCity: res.partyCity,
          partyPincode: res.partyPincode,
          partyState: res.partyState,
          soldByDealerCode: res.soldByDealerCode,
          serialNo: res.serialNo,
          remarks: res.remarks,
        };

        this.chassisSearchTerm = res.chassisNo || '';
        this.serialSearchTerm = res.serialNo || '';
        this.chassisSaleDate = res.chassisSaleDate ? new Date(res.chassisSaleDate) : null;
        this.validityExpiryDate = res.validityExpiryDate ? new Date(res.validityExpiryDate) : null;

        if (this.chassisSaleDate && this.validityExpiryDate) {
          const today = new Date();
          const msRemaining = this.validityExpiryDate.getTime() - today.getTime();
          this.daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
          this.isChassisExpired = this.daysRemaining < 0;
        }

        const scheme = this.schemeList.find((s) => s.id === res.schemeId);
        const itemCode = scheme?.partCode || scheme?.batteryPartCode || '';
        if (itemCode) {
          this.loadSerialsForItemCode(itemCode);
        }

        this.itemsList = (res.ebwInvoiceDetails || []).map((d: any) => ({
          itemCode: d.itemCode,
          itemName: d.itemName,
          itemDesc: d.description,
          hsnCode: d.hsnCode,
          qty: d.qty,
          itemMrp: d.itemMrp,
          originalItemRate: d.baseItemRate,
          itemRate: d.itemRate,
          igstPer: d.igstPer,
          igstAmount: d.igstAmount,
          cgstPer: d.cgstPer,
          cgstAmount: d.cgstAmount,
          sgstPer: d.sgstPer,
          sgstAmount: d.sgstAmount,
          discount: d.discount,
          discountType: d.discountType,
          amount: d.amount,
        }));
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toast.show('Failed to load invoice.', { classname: 'bg-danger text-white', delay: 5000 });
      },
    });
  }

  get selectedScheme(): any {
    return this.schemeList.find((s) => s.id === this.formData.schemeId) || null;
  }

  onSchemeChange() {
    this.formData.chassisNo = '';
    this.formData.party = '';
    this.formData.partyMobile = '';
    this.formData.partyAddress = '';
    this.formData.partyCity = '';
    this.formData.partyPincode = '';
    this.formData.partyState = '';
    this.formData.soldByDealerCode = '';
    this.formData.serialNo = '';
    this.chassisSearchTerm = '';
    this.serialSearchTerm = '';
    this.chassisList = [];
    this.serialNoList = [];
    this.itemsList = [];
    this.resetValidityState();
    this.resetItemEntry();

    if (!this.formData.schemeId) return;

    const scheme = this.selectedScheme;

    if (scheme) {
      const itemCode = scheme.partCode || scheme.batteryPartCode || '';
      if (itemCode) {
        this.loadSerialsForItemCode(itemCode);
      }
    }

    this.loader.show();
    this.chassisSearchService.getAllSoldChassis().subscribe({
      next: (res: any) => {
        this.chassisList = (res || []).map((c: any) => c.chassisNo || c.chasisNo || c);
        this.loader.hide();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toast.show('Something went wrong loading chassis list.', { classname: 'bg-danger text-white', delay: 5000 });
      },
    });
  }

  loadSerialsForItemCode(itemCode: string) {
    this.ebwReportService.getSerialsByItemCode(itemCode, this.invoiceId || undefined).subscribe({
      next: (res: any) => {
        this.serialNoList = res.data || [];
      },
      error: (err) => {
        console.error(err);
        this.serialNoList = [];
      },
    });
  }

  get filteredChassisList(): string[] {
    if (!this.chassisSearchTerm) return this.chassisList;
    const term = this.chassisSearchTerm.toUpperCase();
    return this.chassisList.filter((c) => c.toUpperCase().includes(term));
  }

  onChassisInputFocus() {
    this.showChassisDropdown = true;
  }

  selectChassis(chassisNo: string) {
    this.formData.chassisNo = chassisNo;
    this.chassisSearchTerm = chassisNo;
    this.showChassisDropdown = false;
    this.resetValidityState();

    this.loadChassisSaleDetails(chassisNo);
  }

  loadChassisSaleDetails(chassisNo: string) {
    this.loader.show();

    this.chassisSearchService.getChassisDetails(chassisNo).subscribe({
      next: (res: any) => {
        this.loader.hide();
        this.applySaleDetails(res);
      },
      error: (err) => {
        this.loader.hide();
        this.formData.party = '';
        this.formData.partyState = '';
        this.chassisSaleDate = null;
        console.error(err);
        this.toast.show('Could not find sale details for this chassis. Click + to search globally.', {
          classname: 'bg-warning text-white',
          delay: 6000,
        });
      },
    });
  }

  deleteInvoice() {
    if (!this.invoiceId) return;

    const confirmed = window.confirm('Are you sure you want to delete this Extended Warranty Invoice? This action cannot be undone.');
    if (!confirmed) return;

    this.loader.show();
    this.ebwInvoiceService.delete(this.invoiceId).subscribe({
      next: () => {
        this.loader.hide();
        this.toast.show('Invoice deleted successfully.', { classname: 'bg-success text-white', delay: 5000 });
        this.goToList();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toast.show('Failed to delete invoice.', { classname: 'bg-danger text-white', delay: 5000 });
      },
    });
  }

  private applySaleDetails(res: any) {
    this.formData.party = res?.customerName2 || res?.customerName || '';
    this.formData.partyMobile = res?.mobileNo || '';
    this.formData.partyAddress = res?.address || '';
    this.formData.partyCity = res?.cityName || '';
    this.formData.partyPincode = res?.pincode || '';
    this.formData.partyState = res?.stateName || '';
    this.formData.soldByDealerCode = res?.dealerCode || '';

    const saleDateRaw = res?.saleDate2 || res?.saleDate || null;

    if (saleDateRaw) {
      this.chassisSaleDate = new Date(saleDateRaw);
      this.checkPurchaseValidity();
    } else {
      this.chassisSaleDate = null;
    }
  }

  openGlobalChassisSearch() {
    this.showGlobalSearchPopup = true;
    this.globalChassisSearchTerm = this.chassisSearchTerm || '';
    this.globalSaleData = null;
    this.globalSearchNotFound = false;
  }

  searchGlobalChassis() {
    if (!this.globalChassisSearchTerm) {
      this.toast.show('Enter a Chassis No to search.', { classname: 'bg-warning text-white', delay: 4000 });
      return;
    }

    this.loader.show();
    this.globalSaleData = null;
    this.globalSearchNotFound = false;

    this.chassisSearchService.getGlobalChassisDetails(this.globalChassisSearchTerm).subscribe({
      next: (res: any) => {
        this.loader.hide();
        this.globalSaleData = res;
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.globalSearchNotFound = true;
      },
    });
  }

  applyGlobalChassisResult() {
    if (!this.globalSaleData) return;

    this.formData.chassisNo = this.globalChassisSearchTerm;
    this.chassisSearchTerm = this.globalChassisSearchTerm;
    this.formData.party = this.globalSaleData.customerName || '';
    this.formData.partyMobile = this.globalSaleData.mobileNo || '';
    this.formData.partyAddress = this.globalSaleData.address || '';
    this.formData.partyCity = this.globalSaleData.cityName || '';
    this.formData.partyPincode = this.globalSaleData.pincode || '';
    this.formData.partyState = this.globalSaleData.stateName || '';
    this.formData.soldByDealerCode = this.globalSaleData.dealerCode || '';

    if (this.globalSaleData.saleDate) {
      this.chassisSaleDate = new Date(this.globalSaleData.saleDate);
      this.checkPurchaseValidity();
    }

    this.closeGlobalSearchPopup();
  }

  closeGlobalSearchPopup() {
    this.showGlobalSearchPopup = false;
    this.globalChassisSearchTerm = '';
    this.globalSaleData = null;
    this.globalSearchNotFound = false;
  }

  checkPurchaseValidity() {
    const scheme = this.selectedScheme;

    if (!scheme || !this.chassisSaleDate) {
      this.resetValidityState();
      return;
    }

    const today = new Date();
    const schemeToDate = scheme.toDate ? new Date(scheme.toDate) : null;

    if (schemeToDate && today > schemeToDate) {
      this.isChassisExpired = true;
      this.validityExpiryDate = schemeToDate;
      this.daysRemaining = null;
      this.toast.show(
        `This scheme expired on ${schemeToDate.toLocaleDateString('en-GB')} and is no longer available.`,
        { classname: 'bg-danger text-white', delay: 7000 }
      );
      this.formData.chassisNo = '';
      this.formData.serialNo = '';
      return;
    }

    const validityDays = Number(scheme.purchaseValidity || 0);
    if (validityDays <= 0) {
      this.isChassisExpired = false;
      this.validityExpiryDate = null;
      this.daysRemaining = null;
      return;
    }

    const expiry = new Date(this.chassisSaleDate);
    expiry.setDate(expiry.getDate() + validityDays);

    this.validityExpiryDate = expiry;

    const msRemaining = expiry.getTime() - today.getTime();
    this.daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

    this.isChassisExpired = this.daysRemaining < 0;

    if (this.isChassisExpired) {
      this.toast.show(
        `EBW purchase validity expired on ${expiry.toLocaleDateString('en-GB')}. This chassis is not eligible for this scheme.`,
        { classname: 'bg-danger text-white', delay: 7000 }
      );
      this.formData.chassisNo = '';
      this.formData.serialNo = '';
    }
  }

  resetValidityState() {
    this.chassisSaleDate = null;
    this.validityExpiryDate = null;
    this.isChassisExpired = false;
    this.daysRemaining = null;
  }

  get filteredSerialList(): string[] {
    if (!this.serialSearchTerm) return this.serialNoList;
    const term = this.serialSearchTerm.toUpperCase();
    return this.serialNoList.filter((s) => s.toUpperCase().includes(term));
  }

  onSerialInputChange() {
    this.serialSearchTerm = this.formData.serialNo;
    this.showSerialDropdown = true;
  }

  onSerialInputFocus() {
    if (this.isChassisExpired) return;
    this.showSerialDropdown = true;
  }

  onSerialInputBlur() {
    setTimeout(() => { this.showSerialDropdown = false; }, 200);
  }

  selectSerial(serialNo: string) {
    if (this.isChassisExpired) return;
    this.formData.serialNo = serialNo;
    this.serialSearchTerm = serialNo;
    this.showSerialDropdown = false;

    this.loadItemDetailsBySerial(serialNo);
  }

  /**
   * Fetches item details for the selected serial and populates itemObj —
   * matches counter-bill's selectItem() role: sets MRP/GST%, then calls
   * calculateAmounts() to derive baseItemRate/itemRate immediately.
   * Unlike counter-bill (manual part search), this is auto-triggered by
   * Serial No selection since the part is fixed by the scheme.
   */
  loadItemDetailsBySerial(serialNo: string) {
    this.loader.show();

    this.ebwReportService.getDispatchBySerialNo(serialNo).subscribe({
      next: (res: any) => {
        const dispatch = res?.data;

        if (!dispatch || !dispatch.itemcode) {
          this.loader.hide();
          this.toast.show('No dispatch record found for this serial no.', {
            classname: 'bg-warning text-white',
            delay: 5000,
          });
          return;
        }

        this.partInwardService.getLatestByPartNo(dispatch.itemcode).subscribe({
          next: (inward: any) => {
            this.loader.hide();

            if (!inward) {
              this.toast.show('No PartsInward record found for this part.', {
                classname: 'bg-warning text-white',
                delay: 5000,
              });
              return;
            }

            const scheme = this.selectedScheme;

            this.itemObj = {
              itemName: inward.partNo || '',
              itemCode: inward.partNo || '',
              itemDesc: scheme?.schemeName || '',
              hsnCode: inward.itemHsncode || '',
              inStock: 0,
              qty: Number(inward.itemQty) || 1,
              itemMrp: Number(inward.itemMrp) || 0,
              igstPer: Number(inward.igst) || 0,
              cgstPer: Number(inward.cgst) || 0,
              sgstPer: Number(inward.sgst) || 0,
              itemDiscount: 0,
              discountType: 'Value',
              baseItemRate: 0,
              itemRate: 0,
              igstAmount: 0,
              cgstAmount: 0,
              sgstAmount: 0,
              itemTotalAmount: 0,
            };

            this.calculateAmounts();
          },
          error: (err) => {
            this.loader.hide();
            console.error(err);
            this.toast.show('Something went wrong fetching part details.', {
              classname: 'bg-danger text-white',
              delay: 5000,
            });
          },
        });
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toast.show('Something went wrong fetching dispatch details.', {
          classname: 'bg-danger text-white',
          delay: 5000,
        });
      },
    });
  }

  setBillType(type: 'Cash' | 'Credit') {
    this.formData.billType = type;
  }

  isInterstateTransaction(): boolean {
    const partyState = (this.formData.partyState || '').trim().toUpperCase();
    const dealerState = (this.dealerState || '').trim().toUpperCase();

    if (!partyState || !dealerState) {
      return false;
    }

    return partyState !== dealerState;
  }

  /**
   * EXACT match to add-counter-bill.ts's calculateAmounts():
   * gstPer = igstPer + cgstPer + sgstPer (state-aware here: igst OR cgst+sgst)
   * baseItemRate = mrp - (mrp * gstPer / 100)
   * discount === 0  → itemRate = baseItemRate; GST computed off MRP; total = mrp * qty
   * else            → discountedRate computed off baseItemRate; GST off discountedRate;
   *                    total = (discountedRate + totalGst) * qty
   * This is purely a "live preview" calc on itemObj — it does NOT touch
   * itemsList. Pushing into itemsList only happens via addItem()/updateItem(),
   * exactly like counter-bill's addItem().
   */
  calculateAmounts() {
    const mrp = Number(this.itemObj.itemMrp) || 0;
    const qty = Number(this.itemObj.qty) || 1;

    const igstPer = Number(this.itemObj.igstPer) || 0;
    const cgstPer = Number(this.itemObj.cgstPer) || 0;
    const sgstPer = Number(this.itemObj.sgstPer) || 0;

    const isOutOfState = this.isInterstateTransaction();
    const gstPer = isOutOfState ? igstPer : (cgstPer + sgstPer);

    const gstOnMrp = (mrp * gstPer) / 100;
    const baseItemRate = mrp - gstOnMrp;
    this.itemObj.baseItemRate = baseItemRate;

    const discount = Number(this.itemObj.itemDiscount) || 0;

    if (discount === 0) {
      this.itemObj.itemRate = baseItemRate;

      if (isOutOfState) {
        this.itemObj.igstAmount = (mrp * igstPer) / 100;
        this.itemObj.cgstAmount = 0;
        this.itemObj.sgstAmount = 0;
      } else {
        this.itemObj.igstAmount = 0;
        this.itemObj.cgstAmount = (mrp * cgstPer) / 100;
        this.itemObj.sgstAmount = (mrp * sgstPer) / 100;
      }

      this.itemObj.itemTotalAmount = mrp * qty;
      return;
    }

    let discountedRate = baseItemRate;

    if (this.itemObj.discountType === 'Value') {
      discountedRate = baseItemRate - discount;
    } else {
      discountedRate = baseItemRate - (baseItemRate * discount) / 100;
    }

    this.itemObj.itemRate = discountedRate;

    if (isOutOfState) {
      this.itemObj.igstAmount = (discountedRate * igstPer) / 100;
      this.itemObj.cgstAmount = 0;
      this.itemObj.sgstAmount = 0;
    } else {
      this.itemObj.igstAmount = 0;
      this.itemObj.cgstAmount = (discountedRate * cgstPer) / 100;
      this.itemObj.sgstAmount = (discountedRate * sgstPer) / 100;
    }

    const totalGst = this.itemObj.igstAmount + this.itemObj.cgstAmount + this.itemObj.sgstAmount;
    this.itemObj.itemTotalAmount = (discountedRate + totalGst) * qty;
  }

  /** Matches counter-bill's addItem() exactly — push new or replace at editIndex */
  addItem() {
    if (!this.itemObj.itemName || this.itemObj.qty <= 0) {
      this.toast.show('Enter item name and quantity.', { classname: 'bg-warning text-white', delay: 5000 });
      return;
    }

    const itemData = {
      itemCode: this.itemObj.itemCode,
      itemName: this.itemObj.itemName,
      itemDesc: this.itemObj.itemDesc,
      hsnCode: this.itemObj.hsnCode,
      qty: this.itemObj.qty,
      itemMrp: this.itemObj.itemMrp,
      originalItemRate: this.itemObj.baseItemRate,
      itemRate: this.itemObj.itemRate,
      igstPer: this.itemObj.igstPer,
      igstAmount: this.itemObj.igstAmount,
      cgstPer: this.itemObj.cgstPer,
      cgstAmount: this.itemObj.cgstAmount,
      sgstPer: this.itemObj.sgstPer,
      sgstAmount: this.itemObj.sgstAmount,
      discount: this.itemObj.itemDiscount,
      discountType: this.itemObj.discountType,
      amount: this.itemObj.itemTotalAmount,
    };

    if (this.editIndex >= 0) {
      this.itemsList[this.editIndex] = itemData;
      this.editIndex = -1;
    } else {
      this.itemsList.push(itemData);
    }

    this.resetItemEntry();
    this.calculateSummary();
  }

  /** Matches counter-bill's editItem() exactly — reload row into itemObj for editing */
  editItem(index: number) {
    const item = this.itemsList[index];

    this.itemObj = {
      itemName: item.itemName,
      itemCode: item.itemCode,
      itemDesc: item.itemDesc,
      hsnCode: item.hsnCode,
      inStock: 0,
      qty: item.qty,
      itemMrp: item.itemMrp,
      baseItemRate: item.originalItemRate,
      itemRate: item.itemRate,
      igstPer: item.igstPer,
      igstAmount: item.igstAmount,
      cgstPer: item.cgstPer,
      cgstAmount: item.cgstAmount,
      sgstPer: item.sgstPer,
      sgstAmount: item.sgstAmount,
      itemDiscount: item.discount,
      discountType: item.discountType,
      itemTotalAmount: item.amount,
    };

    this.editIndex = index;
  }

  /** Matches counter-bill's removeItem() exactly */
  removeItem(index: number) {
    this.itemsList.splice(index, 1);
    this.calculateSummary();
  }

  resetItemEntry() {
    this.itemObj = {
      itemName: '',
      itemCode: '',
      itemDesc: '',
      hsnCode: '',
      inStock: 0,
      qty: 1,
      itemMrp: 0,
      baseItemRate: 0,
      itemRate: 0,
      igstPer: 0,
      igstAmount: 0,
      cgstPer: 0,
      cgstAmount: 0,
      sgstPer: 0,
      sgstAmount: 0,
      itemDiscount: 0,
      discountType: 'Value',
      itemTotalAmount: 0,
    };
  }

  get totalQty() {
    return this.itemsList.reduce((sum, i) => sum + Number(i.qty || 0), 0);
  }

  get totalSgst() {
    return this.itemsList.reduce((sum, i) => sum + Number(i.sgstAmount || 0), 0);
  }

  get totalCgst() {
    return this.itemsList.reduce((sum, i) => sum + Number(i.cgstAmount || 0), 0);
  }

  get totalIgst() {
    return this.itemsList.reduce((sum, i) => sum + Number(i.igstAmount || 0), 0);
  }

  get partsAmount() {
    return this.itemsList.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  }

  netAmount: number = 0;
  partsDiscount: number = 0;

  /** Matches counter-bill's calculateSummary() exactly */
  calculateSummary() {
    this.netAmount = Math.round(this.partsAmount * 100) / 100;
    this.partsDiscount = this.itemsList.reduce((sum, item) => sum + Number(item.discount || 0), 0);
  }

  /** Matches counter-bill's openDiscountPopup() — apply a global discount to every item line at once */
  openDiscountPopup(): void {
    if (!this.itemsList || this.itemsList.length === 0) {
      this.toast.show('Please add item(s) first.', { classname: 'bg-warning text-white', delay: 4000 });
      return;
    }
    this.showDiscountPopup = true;
  }

  closeDiscountPopup(): void {
    this.showDiscountPopup = false;
  }

  /** Matches counter-bill's submitDiscount()/applyDiscountToItem() exactly, state-aware for GST */
  submitDiscount(): void {
    this.showDiscountPopup = false;

    const isOutOfState = this.isInterstateTransaction();

    this.itemsList.forEach((item) => {
      const originalRate = Number(item.originalItemRate || 0);
      let discountAmount = 0;

      if (this.discountModel.partsDiscountType === 'Value') {
        discountAmount = this.discountModel.partsDiscount || 0;
      } else {
        discountAmount = (originalRate * (this.discountModel.partsDiscount || 0)) / 100;
      }

      const discountedRate = Math.max(0, originalRate - discountAmount);
      item.itemRate = Number(discountedRate.toFixed(3));

      if (isOutOfState) {
        item.igstAmount = Number(((discountedRate * (item.igstPer || 0)) / 100).toFixed(3));
        item.cgstAmount = 0;
        item.sgstAmount = 0;
      } else {
        item.igstAmount = 0;
        item.cgstAmount = Number(((discountedRate * (item.cgstPer || 0)) / 100).toFixed(3));
        item.sgstAmount = Number(((discountedRate * (item.sgstPer || 0)) / 100).toFixed(3));
      }

      const totalTax = item.igstAmount + item.cgstAmount + item.sgstAmount;

      item.discount = this.discountModel.partsDiscount;
      item.discountType = this.discountModel.partsDiscountType;
      item.amount = Number(((discountedRate + totalTax) * (item.qty || 1)).toFixed(3));
    });

    this.calculateSummary();
  }

  onSave() {
    if (!this.formData.locationCode || !this.formData.schemeId || !this.formData.chassisNo) {
      this.toast.show('Please fill Location, Scheme and Chassis No.', { classname: 'bg-warning text-white', delay: 5000 });
      return;
    }

    if (this.isChassisExpired) {
      this.toast.show('Cannot save — EBW purchase validity has expired for this chassis.', {
        classname: 'bg-danger text-white',
        delay: 5000,
      });
      return;
    }

    if (!this.formData.serialNo) {
      this.toast.show('Please enter or select a Serial No.', { classname: 'bg-warning text-white', delay: 5000 });
      return;
    }

    if (this.itemsList.length === 0) {
      this.toast.show('Add at least one item before saving.', { classname: 'bg-warning text-white', delay: 5000 });
      return;
    }

    const scheme = this.selectedScheme;

    const payload = {
      id: this.invoiceId || 0,
      dealerCode: this.dealerCode,
      invoiceDate: this.formData.date,
      prefixNo: this.formData.prefixNo,
      billNo: this.formData.billNo ? Number(this.formData.billNo) : null,
      locationCode: this.formData.locationCode,
      billType: this.formData.billType,
      cashAccountId: this.formData.cashAccountId,
      schemeId: this.formData.schemeId,
      schemeName: scheme?.schemeName || '',
      chassisNo: this.formData.chassisNo,
      soldByDealerCode: this.formData.soldByDealerCode,
      chassisSaleDate: this.chassisSaleDate,
      validityExpiryDate: this.validityExpiryDate,
      partyName: this.formData.party,
      partyMobile: this.formData.partyMobile,
      partyAddress: this.formData.partyAddress,
      partyCity: this.formData.partyCity,
      partyPincode: this.formData.partyPincode,
      partyState: this.formData.partyState,
      dealerState: this.dealerState,
      isInterstate: this.isInterstateTransaction(),
      serialNo: this.formData.serialNo,
      itemCode: this.itemsList[0]?.itemCode || '',
      partsAmount: this.partsAmount,
      netAmount: this.netAmount,
      remarks: this.formData.remarks,
      items: this.itemsList.map((i) => ({
        itemCode: i.itemCode,
        itemName: i.itemName,
        description: i.itemDesc,
        hsnCode: i.hsnCode,
        qty: i.qty,
        itemMrp: i.itemMrp,
        baseItemRate: i.originalItemRate,
        itemRate: i.itemRate,
        discount: i.discount,
        discountType: i.discountType,
        igstPer: i.igstPer,
        igstAmount: i.igstAmount,
        cgstPer: i.cgstPer,
        cgstAmount: i.cgstAmount,
        sgstPer: i.sgstPer,
        sgstAmount: i.sgstAmount,
        amount: i.amount,
      })),
    };

    this.loader.show();
    this.ebwInvoiceService.save(payload).subscribe({
      next: () => {
        this.loader.hide();
        this.toast.show('EBW Invoice saved successfully.', { classname: 'bg-success text-white', delay: 5000 });
        this.goToList();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toast.show('Something went wrong while saving.', { classname: 'bg-danger text-white', delay: 5000 });
      },
    });
  }

  backToList() {
    this.goToList();
  }

  goToList() {
    this.router.navigate(['/ebw-invoice-list']);
  }
}