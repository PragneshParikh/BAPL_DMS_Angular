import { Component, OnInit } from '@angular/core';
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
import { Router } from '@angular/router';
import { ItemMasterService } from '../../../core/services/item-master-service';
import { log } from 'console';

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
  model: any = {
    counterBillNo: '',
    conterBillDate: this.today,
    locationCode: null,
    billType: 'Cash',
    cashAccount: '',
    partyState: '',
    partyName: '',
    chassisNo: '',
    itemName: '',
    saleType: 'On MRP',
    rackNo: null,
    binNo: null,
    qty: 0,
    rate: 0,
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
  selectedCustomerId: any;
  showPartyDropdown: boolean;
  filteredParties: any[];
  stateList: any;
  filteredItems: any[];
  items: any[];
  itemSearch: any;
  showDropdown: boolean;


  /**
   *
   */
  constructor(private prefixService: PrefixService, private storageService: StorageService,
    private locationMasterService: LocationMasterService, private ledgerService: LedgerMasterService,
    private modalService: NgbModal,private stateService:StateService,private router:Router,private itemService:ItemMasterService
  ) { }
  ngOnInit(): void {
    this.getNextCounterBillNo();
    this.getLocations();
    this.getParties();
    this.getStateList();
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
    const dealerCode = this.storageService.getDealerCode();
    this.locationMasterService.getLocationList(dealerCode).subscribe({
      next: (data) => {
        this.locationList = data.filter(p=>p.locareadidNo ==2);

        console.log(data);
        
        if (!this.isEditMode) {
          this.model.locationCode = this.locationList[0].locCode;
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
    this.ledgerService.getLedgerByType('Party').subscribe({
      next: (res) => {
        this.parties = res.filter(p => p.ledgerType?.toLowerCase() === 'party');
        if (this.model.customerName && !this.selectedCustomerId) {
          const match = this.parties.find(p => p.ledgerName?.toLowerCase() === this.model.customerName?.toLowerCase());
          if (match) {
            this.selectedCustomerId = match.id;
          }
        }
      }
    });
  }

  getStateList(){
    this.stateService.get().subscribe(
      (res)=>{
       this.stateList=res;
        
      }
    );
  }
  selectParty(party: LedgerMaster) {
    console.log(party);
    
    this.model.partyName = party.ledgerName;
    const state = this.stateList.find(
    s => s.stateId == party.state
  );

  this.model.partyState = state ? state.stateName : '';
    this.selectedCustomerId = party.id;
    this.showPartyDropdown = false;
    this.getItemsByLocation();
  }
  onPartySearch() {
    this.selectedCustomerId = null;
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
  navigateToListPage()
  {
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

  this.filteredItems = this.items.filter(
    x =>
      x.itemName.toLowerCase().includes(search) ||
      x.itemCode.toLowerCase().includes(search)
  );

  this.showDropdown = true;
}
selectedItem: any;

selectItem(item: any) {
  this.selectedItem = item;
  this.itemSearch = item.itemName;
  this.showDropdown = false;

  console.log(item);

  // Example
  this.model.itemCode = item.itemCode;
  this.model.rate = item.itemRate;
  this.model.stock = item.itemStock;
  this.model.igstPer = item.igstPer;
  this.model.cgstPer = item.cgstPer;
  this.model.sgstPer = item.sgstPer;
}
}
