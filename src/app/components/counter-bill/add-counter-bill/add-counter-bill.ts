import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { CashTypeOptions } from '../../../constant';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbDropdownModule, NgbModal, NgbModalModule, NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { PrefixService } from '../../../core/services/prefix';
import { StorageService } from '../../../core/services/storage';
import { LocationMasterService } from '../../../core/services/location-master-service';
import { LedgerMasterService } from '../../../core/services/ledger-master';
import { CustomerLedger } from '../../customer-ledger/customer-ledger';
import { LedgerMaster } from '../../../ViewModels/LedgerMasterViewModel';
import { StateService } from '../../../core/services/state';
import { ActivatedRoute, Router } from '@angular/router';
import { ItemMasterService } from '../../../core/services/item-master-service';
import { ToastService } from '../../../shared/toaster/toast-service';
import { ChassisSearchService } from '../../../core/services/chassis-search-service';
import Swal from 'sweetalert2';
import { CounterBillService } from '../../../core/services/counter-bill-service';
import { LoaderService } from '../../../core/services/loader';

@Component({
  selector: 'app-add-counter-bill',
  imports: [FormsModule, CommonModule, NgbPaginationModule, NgbTooltipModule,
    NgbModalModule, NgbDropdownModule],
  templateUrl: './add-counter-bill.html',
  styleUrl: './add-counter-bill.scss',
})
export class AddCounterBill implements OnInit {
  today = new Date().toISOString().split('T')[0];
  showTable: boolean = false;
  CashTypeOptions = CashTypeOptions;
  locationList: any;
  isEditMode: boolean = false;
  isExistingParty = false;
  chassisList: any[] = [];
  filteredChassis: any[] = [];
  showChassisDropdown = false;
  showDiscountPopup = false;

  discountModel = {
    partsDiscountType: 'Value',
    partsDiscount: 0,
    accessoriesDiscountType: 'Value',
    accessoriesDiscount: 0
  };
  model: any = {
    counterBillNo: '',
    conterBillDate: this.today,
    locationCode: null,
    billType: 'Cash',
    cashAccount: 'Cash',
    partyState: '',
    partyName: '',
    mobileNo: '',
    baseItemRate: 0,
    chassisNo: '',
    itemName: '',
    saleType: 'MRP',
    rackNo: null,
    binNo: null,
    qty: 1,
    igstPer: 1,
    igstAmount: 1,
    itemRate: 0,
    itemMrp: 0,
    itemTotalAmount: 0,
    discount: 0,
    discountType: 'Value',
    margin: 0,
    validDays: 0,
    validKms: 0,
    discAmount: 0,
    receiptAmount: 0,
    receivingMode: null,
    partsDiscount: 0,
    partsAmount: 0,
    netAmount: 0,
    remarks: ''
  };
  parties: LedgerMaster[] = [];
  globalParties: LedgerMaster[] = [];
  selectedCustomerId: any;
  showPartyDropdown: boolean;
  filteredParties: any[];
  stateList: any;
  filteredItems: any[];
  items: any[];
  itemSearch: any;
  showDropdown: boolean;
  filteredStates: any[];
  showStateDropdown: boolean;
  counterBillItems: any[] = [];
  editIndex: number;
  selectedItem: any;
  dealerCode: string;
  counterBillId: number;
  showDelete: boolean;
  isChassisCustomerOutsideDealer: boolean;
  userRole: string;
  editPermission: boolean;

  constructor(private prefixService: PrefixService, private storageService: StorageService,
    private locationMasterService: LocationMasterService, private ledgerService: LedgerMasterService,
    private modalService: NgbModal, private stateService: StateService, private router: Router, private itemService: ItemMasterService,
    private toaster: ToastService, private chassisService: ChassisSearchService, private counterBillService: CounterBillService,
    private route: ActivatedRoute, private loader: LoaderService

  ) { }
  @ViewChild('dealerContainer')
  dealerContainer!: ElementRef;
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {

    if (
      this.dealerContainer &&
      !this.dealerContainer.nativeElement.contains(event.target)
    ) {
      this.showDropdown = false;
    }
  }
  ngOnInit(): void {
    this.loader.show();
    this.userRole = this.storageService.getRole().toLowerCase();
    this.editPermission = this.userRole === 'superadmin';
    this.getNextCounterBillNo();
    this.getLocations();
    this.getParties();
    this.getStateList();
    
   // const id = this.route.snapshot.paramMap.get('id');
     const id = history.state?.counterBillId;
    if (id) {
      this.isEditMode = true;
      this.counterBillId = +id;
      this.loadCounterBill(this.counterBillId);
    } else {
      this.getNextCounterBillNo();
    }
    this.loader.hide();
  }

  async loadCounterBill(id: number): Promise<any> {
    await this.getStateList();
    this.loader.show();
    this.counterBillService.getCounterBillById(id).subscribe({
      next: (res: any) => {
        console.log(res);
        debugger
        const header = res.header;
        this.model.counterBillNo = header.billNo;
        this.model.conterBillDate = header.billDate?.split('T')[0];
        this.model.billType = header.billType;
        this.model.locationCode = header.locCode;
        this.model.cashAccount = header.cashCreditAcc;
        this.model.partyName = header.partyName;
        this.model.mobileNo = header.mobileNo;
        this.model.chassisNo = header.chassisNo;
        this.model.remarks = header.remarks;
        this.selectedCustomerId = header.customerLedgerId;

        const state = this.stateList?.find((x: any) => Number(x.stateId) === Number(header.partyState));
        this.model.partyState = state?.stateName || '';
        this.getItemsByLocation();
        this.counterBillItems = res.details.map((x: any) => {

          const igstPer = Number(x.igstper || 0);
          const cgstPer = Number(x.cgstper || 0);
          const sgstPer = Number(x.sgstper || 0);
          const gstPer = igstPer + cgstPer + sgstPer;
          const mrp = Number(x.mrp || 0);
          //const originalItemRate = mrp - ((mrp * gstPer) / 100);
          const itemRate = Number(x.rate || 0);
          const igstAmount = Number(x.igstamnt || 0);
          const cgstAmount = Number(x.cgstamnt || 0);
          const sgstAmount = Number(x.sgstamnt || 0);
          let discount = 0;
          const discountAmount = x.discType === '%' ? (itemRate * Number(x.discount || 0)) / 100 : Number(x.discount || 0);
          const discountedRate = itemRate - discountAmount;
          const recalculatedIgstAmount = discountedRate * igstPer / 100;
          const recalculatedCgstAmount = discountedRate * cgstPer / 100;
          const recalculatedSgstAmount = discountedRate * sgstPer / 100;
          const lineAmount = (discountedRate + recalculatedIgstAmount + recalculatedCgstAmount + recalculatedSgstAmount) * x.qty;
          const qty = Number(x.qty || 1);
          return {
            itemCode: x.partCode,
            itemName: x.partName,
            qty: qty,
            saleType: x.saleType,
            itemMrp: mrp,
            originalItemRate: itemRate,
            itemRate: itemRate,
            discount: Number(x.discount || 0),
            discountType: x.discType || 'Value',
            igstPer: igstPer,
            igstAmount: igstAmount,
            cgstPer: cgstPer,
            cgstAmount: cgstAmount,
            sgstPer: sgstPer,
            sgstAmount: sgstAmount,
            itemDiscount: Number(x.discount || 0),
            itemDiscountType: x.discType || 'Value',
            amount: Number(lineAmount.toFixed(2))

          };

        });

        this.showTable = this.counterBillItems.length > 0;
        this.calculateSummary();
        this.loader.hide();
      },

      error: (err) => {
        this.loader.hide();
        console.error(err);
      }
    });
  }
  getNextCounterBillNo() {
    const dealerCode = this.storageService.getDealerCode();
    this.prefixService.getPrefixByDealerByModule(dealerCode, 'counter-bill')
      .subscribe({
        next: (res) => {
          this.model.counterBillNo = res;
        },
        error: (err) => {
          console.error(err);
        }
      });
  }
  getLocations() {
    let dealerCode = '';
    const isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';
    if (!isSuperAdmin) {
      dealerCode = this.storageService.getDealerCode();
    }
    this.locationMasterService.getLocationDropdownByDealerCode(dealerCode).subscribe({
      next: (data) => {
        this.locationList = data.filter(p => p.locareaidno == 2);
        if (!this.isEditMode) {
          this.model.locationCode = this.locationList?.[0]?.loccode ?? null;
        }
      }
    });
  }


  openCustomerLedgerAdd() {
    const modalRef = this.modalService.open(CustomerLedger, {
      size: 'lg',
      backdrop: 'static'
    });
    modalRef.componentInstance.defaultLedgerType = 'Party';
    modalRef.result.then((newId) => {
      if (newId) {
        this.ledgerService.getLedgerByType('Party').subscribe({
          next: (res) => {
            this.parties = res;
            this.parties = [...this.parties];
            const added = this.parties.find(f => f.id === newId);
            if (added) {
              this.model.partyName = added.ledgerName;
            }
          }
        });
      }
    }).catch(() => { });
  }
  getParties() {
    this.getChassisList();
    // const dealerCode= this.storageService.getDealerCode();
    const isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';

    this.dealerCode = this.storageService.getDealerCode();

    this.ledgerService.getLedgerForSale(this.dealerCode, isSuperAdmin).subscribe({
      next: (res) => {
        console.log(res);

        this.parties = res.filter(p => (p.ledgerType?.toLowerCase() === 'dealer' && p.dealerCode !== this.dealerCode) || (p.ledgerType?.toLowerCase() === 'party') || (p.ledgerType.toLowerCase() === 'institunoial'));
        //this.parties = res.filter(p => p.ledgerType?.toLowerCase() === 'party');
        if (this.model.customerName && !this.selectedCustomerId) {
          const match = this.parties.find(p => p.ledgerName?.toLowerCase() === this.model.customerName?.toLowerCase());
          if (match) {
            this.selectedCustomerId = match.id;
          }
        }
      }
    });
  }

  getStateList() {
    this.stateService.get().subscribe(
      (res) => {
        this.stateList = res;
        this.filteredStates = [...res];
      }
    );
  }
  filterStates() {
    if (this.isExistingParty) {
      return;
    }
    const term = (this.model.partyState || '').toLowerCase();

    if (!term) {
      this.filteredStates = [...this.stateList];
      this.showStateDropdown = true;
      return;
    }
    this.filteredStates = this.stateList.filter((x: any) => x.stateName.toLowerCase().includes(term));
    this.showStateDropdown = this.filteredStates.length > 0;
  }

  selectState(state: any) {
    this.model.partyState = state.stateName;
    this.showStateDropdown = false;
  }

  selectParty(party: LedgerMaster) {
    this.model.partyName = party.ledgerName;

    const state = this.stateList.find((x: any) => Number(x.stateId) === Number(party.state));

    this.model.partyState = state?.stateName || '';
    this.model.mobileNo = party.mobileNumber;
    this.selectedCustomerId = party.id;
    this.isExistingParty = true;
    this.showPartyDropdown = false;

    this.getItemsByLocation();
  }
  getChassisList() {
    this.chassisService.getAllSoldChassis().subscribe(
      (res) => {
        this.chassisList = res;
      }
    );
  }
  filterChassis() {
    const term = (this.model.chassisNo || '').toLowerCase();
    if (!term) {
      this.filteredChassis = [];
      this.showChassisDropdown = false;
      return;
    }

    this.filteredChassis = this.chassisList.filter(x => x.chassisNo?.toLowerCase().includes(term));
    this.showChassisDropdown = true;
  }



  selectChassis(chassis: any) {
    this.model.chassisNo = chassis.chassisNo;
    this.showChassisDropdown = false;
    const party = this.parties.find(p => Number(p.id) === Number(chassis.custId));

    if (party) {
      this.isChassisCustomerOutsideDealer = false;
      this.selectedCustomerId = party.id;
      this.model.partyName = party.ledgerName;
      this.model.mobileNo = party.mobileNumber;
      const state = this.stateList.find((x: any) => Number(x.stateId) === Number(party.state));
      this.model.partyState = state?.stateName || '';
      this.isExistingParty = true;
    }
    else {

      this.isChassisCustomerOutsideDealer = true;
      this.selectedCustomerId = null;
      this.model.partyName = chassis.partyName;
      this.model.mobileNo = chassis.mobileNo;
      const state = this.stateList.find((x: any) => Number(x.stateId) === Number(chassis.partyState));
      this.model.partyState = state?.stateName || '';
      this.isExistingParty = false;
    }
    this.getItemsByLocation();
  }

  onPartySearch() {
    this.selectedCustomerId = null;
    this.isExistingParty = false;
    const term = this.model.partyName?.toLowerCase() || '';
    if (!term) {
      this.filteredParties = [];
      this.showPartyDropdown = false;
      return;
    }

    this.filteredParties = this.parties.filter(x => x.ledgerName?.toLowerCase().includes(term));
    this.showPartyDropdown = this.filteredParties.length > 0;
  }
  isCustomerValid(): boolean {
    if (!this.model.partyName) return false;
    return this.parties.some(p => p.ledgerName.toLowerCase() === this.model.partyName.toLowerCase());
  }
  navigateToListPage() {
    this.router.navigate(['/counter-bill']);
  }
  getItemsByLocation() {
    this.itemService
      .getItemsByLocation(this.model.locationCode, this.model.partyState)
      .subscribe((res: any[]) => {
        this.items = res;
        this.filteredItems = res;
      });
  }
  filterItems() {
    const search = this.itemSearch?.toLowerCase() || '';
    this.filteredItems = this.items.filter(x => x.itemName.toLowerCase().includes(search) || x.itemCode.toLowerCase().includes(search));
    this.showDropdown = true;
  }

  selectItem(item: any) {
    if (item.itemStock == 0) {
      this.toaster.show('Part not available in stock', {
        classname: 'bg-danger text-white',
        delay: 5000
      });
      return;
    }
    this.selectedItem = item;
    this.itemSearch = item.itemName + '-' + item.itemCode;
    this.showDropdown = false;
    this.model.itemCode = item.itemCode;
    this.model.itemMrp = Number(item.itemMrp || 0);
    this.model.stock = item.itemStock;
    this.model.igstPer = Number(item.igstPer || 0);
    this.model.cgstPer = Number(item.cgstPer || 0);
    this.model.sgstPer = Number(item.sgstPer || 0);
    const totalGstPer = this.model.igstPer + this.model.cgstPer + this.model.sgstPer;
    const gstAmount = (this.model.itemMrp * totalGstPer) / 100;
    this.model.baseItemRate = this.model.itemMrp - gstAmount;
    this.model.itemRate = this.model.baseItemRate;
    this.model.itemDiscount = 0;
    this.calculateAmounts();
  }

  onBillTypeChange(): void {
    if (this.model.billType === 'Credit') {
      this.model.cashAccount = 'Credit';
    } else {
      this.model.cashAccount = '';
    }
  }
  closePartyDropdown() {
    setTimeout(() => {
      this.showPartyDropdown = false;
    }, 300);
  }
  onStateChanged() {
    if (this.model.partyState) {
      this.getItemsByLocation();
    }
  }


  addItem() {

    let discountAmount = Number(this.model.itemDiscount) || 0;

    if (this.model.discountType === '%') {
      discountAmount =
        (Number(this.model.baseItemRate || 0) * discountAmount) / 100;
    }

    const itemData = {
      itemCode: this.selectedItem.itemCode,
      itemName: this.selectedItem.itemName,
      qty: this.model.qty,
      saleType: this.model.saleType,
      itemMrp: this.model.itemMrp,
      originalItemRate: this.model.baseItemRate,
      itemRate: this.model.itemRate,
      igstPer: this.model.igstPer,
      igstAmount: this.model.igstAmount,
      cgstPer: this.model.cgstPer,
      cgstAmount: this.model.cgstAmount,
      sgstPer: this.model.sgstPer,
      sgstAmount: this.model.sgstAmount,
      //discount: Number(discountAmount.toFixed(2)),
      discount: this.model.itemDiscount,
      discountApplied: this.model.itemDiscount,
      discountType: this.model.discountType,
      amount: this.model.itemTotalAmount,
      itemDiscount: this.model.itemDiscount,
      itemDiscountType: this.model.discountType
    };

    if (this.editIndex >= 0) {
      this.counterBillItems[this.editIndex] = itemData;
      this.editIndex = -1;
    } else {
      this.counterBillItems.push(itemData);
    }
    this.showTable = this.counterBillItems.length > 0;
    this.selectedItem = null;
    this.itemSearch = '';
    this.model.qty = 1;
    this.model.itemMrp = 0;
    this.model.itemRate = 0;
    this.model.itemDiscount = 0;
    this.model.discountType = 'Value';
    this.model.itemTotalAmount = 0;
    this.calculateSummary();
  }

  removeItem(index: number) {
    this.counterBillItems.splice(index, 1);

    if (this.counterBillItems.length === 0) {
      this.showTable = false;
    }
    this.calculateSummary();
  }

  editItem(index: number) {

    const item = this.counterBillItems[index];

    this.selectedItem = item;
    this.itemSearch = item.itemName;

    this.model.saleType = item.saleType;
    this.model.qty = item.qty;

    this.model.itemMrp = item.itemMrp;

    // IMPORTANT
    this.model.itemDiscount = item.itemDiscount;
    this.model.discountType = item.itemDiscountType;

    this.model.itemRate = item.itemRate;
    this.model.baseItemRate = item.originalItemRate;

    this.model.igstPer = item.igstPer;
    this.model.igstAmount = item.igstAmount;

    this.model.cgstPer = item.cgstPer;
    this.model.cgstAmount = item.cgstAmount;

    this.model.sgstPer = item.sgstPer;
    this.model.sgstAmount = item.sgstAmount;

    this.model.itemTotalAmount = item.amount;

    this.editIndex = index;
  }

  onMobileNoChange() {
    const party = this.parties.find((p: any) => p.mobileNumber?.trim() === this.model.mobileNo?.trim());
    if (party) {
      this.model.partyName = party.ledgerName;
      const state = this.stateList.find((x: any) => Number(x.stateId) === Number(party.state));
      this.model.partyState = state?.stateName || '';
      this.selectedCustomerId = party.id;
      this.isExistingParty = true;
      this.getItemsByLocation();
    }
    else {
      this.isExistingParty = false;
      this.selectedCustomerId = null;
    }
  }

  calculateAmounts() {

    const mrp = Number(this.model.itemMrp) || 0;
    const qty = Number(this.model.qty) || 1;

    const gstPer = (Number(this.model.igstPer) || 0) + (Number(this.model.cgstPer) || 0) + (Number(this.model.sgstPer) || 0);
    const gstOnMrp = (mrp * gstPer) / 100;
    const baseItemRate = mrp - gstOnMrp;
    this.model.baseItemRate = baseItemRate;
    const discount = Number(this.model.itemDiscount) || 0;
    if (discount === 0) {

      this.model.itemRate = baseItemRate;
      this.model.igstAmount = mrp * (this.model.igstPer || 0) / 100;
      this.model.cgstAmount = mrp * (this.model.cgstPer || 0) / 100;
      this.model.sgstAmount = mrp * (this.model.sgstPer || 0) / 100;
      this.model.itemTotalAmount = mrp * qty;
      return;
    }

    let discountedRate = baseItemRate;

    if (this.model.discountType === 'Value') {
      discountedRate = baseItemRate - discount;
    } else {
      discountedRate = baseItemRate - ((baseItemRate * discount) / 100);
    }

    this.model.itemRate = discountedRate;
    this.model.igstAmount = discountedRate * (this.model.igstPer || 0) / 100;
    this.model.cgstAmount = discountedRate * (this.model.cgstPer || 0) / 100;
    this.model.sgstAmount = discountedRate * (this.model.sgstPer || 0) / 100;
    const totalGst = this.model.igstAmount + this.model.cgstAmount + this.model.sgstAmount;
    this.model.itemTotalAmount = (discountedRate + totalGst) * qty;
  }

  calculateSummary() {
    this.model.partsAmount = Math.round(this.counterBillItems.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    ));
    this.model.partsDiscountAmount = this.counterBillItems.reduce((sum, item) => {

      if (item.discountType === '%') {
        return ((sum + ((Number(item.originalItemRate || 0) * Number(item.discount || 0)) / 100)) * item.qty);
      }

      return ((sum + Number(item.discount || 0) * item.qty));

    }, 0).toFixed(2);

    this.model.partsDiscount = this.counterBillItems.reduce(
      (sum, item) => sum + Number(item.discount || 0),
      0
    );

    const discAmount = Number(this.model.discAmount) || 0;

    this.model.netAmount = Math.round(this.model.partsAmount);
    // this.model.netAmount = Math.round(
    //   this.model.partsAmount - discAmount - this.model.partsDiscount
    // );

    this.model.receiptAmount = this.model.netAmount;
  }

  openDiscountPopup(): void {
    if (!this.counterBillItems || this.counterBillItems.length === 0) {

      Swal.fire({
        icon: 'warning',
        title: 'No Items',
        text: 'Please add Part items first.'
      });

      return;
    }

    this.showDiscountPopup = true;
  }

  closeDiscountPopup(): void {
    this.showDiscountPopup = false;
  }

  submitDiscount(): void {
    this.showDiscountPopup = false;

    this.counterBillItems.forEach(item => {
      this.applyDiscountToItem(item);
    });

    this.model.partsDiscount = this.discountModel.partsDiscount || 0;


    this.calculateTotals();

  }
  private applyDiscountToItem(item: any) {

    const originalRate = Number(item.originalItemRate || 0);

    let discountAmount = 0;

    if (this.discountModel.partsDiscountType === 'Value') {

      discountAmount = (this.discountModel.partsDiscount || 0);


    } else {

      discountAmount = originalRate * (this.discountModel.partsDiscount || 0) / 100;
    }

    const discountedRate = Math.max(0, originalRate - discountAmount);

    item.itemRate = Number(discountedRate.toFixed(2));

    item.igstAmount = Number((discountedRate * (item.igstPer || 0) / 100).toFixed(2));

    item.cgstAmount = Number((discountedRate * (item.cgstPer || 0) / 100).toFixed(2));

    item.sgstAmount = Number((discountedRate * (item.sgstPer || 0) / 100).toFixed(2));

    const totalTax = item.igstAmount + item.cgstAmount + item.sgstAmount;

    item.discount = this.discountModel.partsDiscount;
    item.discountType = this.discountModel.partsDiscountType;

    item.amount = Number(((discountedRate + totalTax) * (item.qty || 1)).toFixed(2));
  }
  calculateTotals() {
    this.model.partsDiscountAmount = this.counterBillItems.reduce((sum, item) => {

      if (item.discountType === '%') {
        return sum + ((Number(item.originalItemRate || 0) * Number(item.discount || 0)) / 100);
      }

      return sum + Number(item.discount || 0);

    }, 0).toFixed(2);
    this.model.partsAmount = this.counterBillItems.reduce((sum, item) => sum + Number(item.amount || 0), 0).toFixed(2);
    this.model.netAmount = this.model.partsAmount.toFixed(2);
    this.model.receiptAmount = this.model.netAmount.toFixed(2);;
    this.model.partsDiscount = this.counterBillItems.reduce((sum, item) => sum + Number(item.discount || 0), 0).toFixed(2);
  }

  calculateNetAmount() {

    const partsAmount = this.counterBillItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    this.model.partsAmount = partsAmount;
    this.model.netAmount = partsAmount - (this.model.partsDiscount || 0);
    this.model.partsDiscount = this.counterBillItems.reduce((sum, item) => sum + Number(item.discount || 0), 0);
  }

  getPartyStateId(): number | null {
    const state = this.stateList.find((x: any) => x.stateName === this.model.partyState);
    return state ? state.stateId : null;
  }

  save(): void {
    console.log(this.counterBillItems);

    this.loader.show();

    if (this.counterBillItems.length === 0) {
      this.loader.hide();
      this.toaster.show('Please add at least one item', {
        classname: 'bg-danger text-white',
        delay: 5000
      });
      return;
    }

    const payload = {
      header: {
        dealerCode: this.storageService.getDealerCode(),
        billNo: this.model.counterBillNo,
        billDate: this.model.conterBillDate,
        billType: this.model.billType,
        locCode: this.model.locationCode,
        cashCreditAcc: this.model.cashAccount,
        partyName: this.model.partyName,
        mobileNo: this.model.mobileNo,
        partyState: this.getPartyStateId(),
        chassisNo: this.model.chassisNo,
        billAmount: this.model.netAmount,
        remarks: this.model.remarks,
        customerLedgerId: this.isChassisCustomerOutsideDealer ? null : this.selectedCustomerId
      },

      details: this.counterBillItems.map(item => ({
        partCode: item.itemCode,
        saleType: item.saleType,
        qty: item.qty,
        rate: item.originalItemRate,
        discType: item.discountType,
        discount: item.discount,
        mrp: item.itemMrp,
        igstper: item.igstPer,
        igstamnt: item.igstAmount,
        cgstper: item.cgstPer,
        cgstamnt: item.cgstAmount,
        sgstper: item.sgstPer,
        sgstamnt: item.sgstAmount
      }))
    };

    const request = this.isEditMode ? this.counterBillService.updateCounterBill(this.counterBillId, payload)
      : this.counterBillService.saveCounterBill(payload);

    request.subscribe({
      next: (res) => {
        this.loader.hide();
        this.toaster.show(this.isEditMode ? 'Counter Bill Updated' : 'Counter Bill Created',
          {
            classname: 'bg-success text-white',
            delay: 5000
          }
        );

        this.navigateToListPage();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: this.isEditMode
            ? 'Failed to update Counter Bill'
            : 'Failed to save Counter Bill'
        });
      }
    });
  }

  printBill(): void {
    if (!this.counterBillId) {
      return;
    }
    this.router.navigate(['/print-counter-bill', this.counterBillId]);
  }

  isItemAlreadyAdded(itemCode: string): boolean {

    return this.counterBillItems.some(
      x => x.itemCode === itemCode
    );
  }

  deleteCounterBill(): void {

    Swal.fire({
      title: 'Delete Counter Bill?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    }).then((result) => {

      if (result.isConfirmed) {

        this.counterBillService
          .deleteCounterBill(this.counterBillId)
          .subscribe({

            next: () => {

              Swal.fire({
                icon: 'success',
                title: 'Deleted',
                text: 'Counter Bill deleted successfully.'
              });

              this.navigateToListPage();
            },

            error: (err) => {

              console.error(err);

              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to delete Counter Bill.'
              });
            }
          });
      }
    });
  }

  sanitizeMobile(event: Event): void {
    const input = event.target as HTMLInputElement;

    let value = input.value
      .replace(/\D/g, '').slice(0, 10);

    input.value = value;
    this.model.mobileNo = value;
  }
}
