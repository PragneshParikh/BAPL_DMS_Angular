// src\app\components\receipt-entry\add-receipt-entry\add-receipt-entry.ts
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { ReceiptEntryService } from '../../../core/services/receipt-entry-service';
import { LocationName, ReceiptEntryAddViewModel, ReceiptEntryEditModel } from '../../../ViewModels/ReceiptEntryModel';
import { StorageService } from '../../../core/services/storage';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbHighlight, NgbModal, NgbPaginationModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { FlatpickrModule } from 'angularx-flatpickr';
import { NgSelectModule } from '@ng-select/ng-select';
import { LedgerMaster } from '../../../ViewModels/LedgerMasterViewModel';
import { ItemMasterService } from '../../../core/services/item-master-service';
import { LmsleadMaster } from '../../../ViewModels/LmsleadMaster';
import { LoaderService } from '../../../core/services/loader';
import { ToastService } from '../../../shared/toaster/toast-service';
import { CustomerLedger } from '../../customer-ledger/customer-ledger';
import { TRANSACTION_TYPES } from '../../../constant';
import { PrefixService } from '../../../core/services/prefix';
import { LocationMasterService } from '../../../core/services/location-master-service';
import { LMSLeadService } from '../../../core/services/lmslead-service';
import { LedgerMasterService } from '../../../core/services/ledger-master';
import { MenuAccessService } from '../../../core/services/menu-access.service';
@Component({
  selector: 'app-add-receipt-entry',
  templateUrl: './add-receipt-entry.html',
  styleUrl: './add-receipt-entry.scss',
  imports: [CommonModule,
    FormsModule,
    NgbHighlight,
    NgbPaginationModule,
    FlatpickrModule,
    RouterOutlet,
    NgSelectModule,
    NgbTooltip
  ],
})
export class AddReceiptEntry implements OnInit {
  readonly SUBMENU_ID = 19;
  canCreate = false;
  canEdit = false;
  customerTypes = TRANSACTION_TYPES;
  today = new Date().toISOString().split('T')[0];
  disableSave: boolean;
  @ViewChild('ReceiptEntryModal') ReceiptEntryModal!: TemplateRef<any>;
  selectedLead: LmsleadMaster | null = null;
  locations: LocationName[] = [];
  nextReceiptNo: string = '';
  financiers: LedgerMaster[] = [];
  parties: LedgerMaster[] = [];
  products: any[] = [];
  selectedProduct: any;
  editingRowIndex: number | null = null;
  isRowEditMode: boolean = false;
  formData: any = {
    location: null,
    receiptNo: null,
    receiptDate: null,
    saleType: 'Receipt',
    bookingId: null,
    partyName: "",
    financier: "",
    productName: "",
    salesExecutive: "",
    receiptType: "",
    mobileNo: null,
    refNo: null,
    narration: null,
    totalAmount: 0.00,
    customerType: 'b2c',
    receiptEntryDetail: ''
  };

  selectedFinancier: string = '';
  searchType: string = 'Mobile No';
  searchText: string = '';
  leadResult: LmsleadMaster | null = null;
  selectedProductCode: string = '';
  apiResponse!: ReceiptEntryEditModel;
  isEditMode: boolean = false;
  id: any;
  receiptDetails: any[] = [];

  receiptRow = {
    receiptType: '',
    amount: 0,
    refNo: '',
    instType: '',
    instNo: '',
    lineDate: this.today,
    bankName: ''
  };
  model: any;
  modalRef: any;
  filteredParties: LedgerMaster[] = [];
  receiptDate: string;
  selectedSaleType: string;
  selectedParty: string;
  isSearchMobileInvalid: boolean;
  showPartyDropdown: boolean;
  constructor(
    private router: ActivatedRoute,
    private receiptEntryService: ReceiptEntryService,
    private lmsService: LMSLeadService,
    private locationService: LocationMasterService,
    private storageService: StorageService,
    private itemService: ItemMasterService,
    private modalService: NgbModal,
    private navigation: Router,
    private loader: LoaderService,
    public toaster: ToastService,
    public prefixService: PrefixService,
    public ledgerService: LedgerMasterService,
    private menuAccess: MenuAccessService
  ) {
    this.canCreate = this.menuAccess.canCreate(this.SUBMENU_ID);
    this.canEdit = this.menuAccess.canEdit(this.SUBMENU_ID);
  }

  async ngOnInit(): Promise<void> {
    this.loader.show();
    this.id = this.router.snapshot.paramMap.get('id');
    this.isEditMode = !!this.id;
    await this.getParties();
    await this.loadProducts();
    this.fetchLocations();
    this.getFinanciers();
    if (this.isEditMode) {
      await this.loadReceiptById(this.id);
    } else {
      this.formData.receiptDate = this.today;
    }
    this.loader.hide();
  }




  loadReceiptById(id: number): Promise<any> {
    return new Promise((resolve) => {
      this.receiptEntryService.getReceiptById(id).subscribe({
        next: (res: ReceiptEntryEditModel) => {

          this.apiResponse = res;
          this.formData = {
            location: res.location,
            receiptNo: res.receiptNo,
            receiptDate: res.receiptDate ? res.receiptDate.split('T')[0] : '',
            saleType: res.saleType,
            bookingId: res.bookingId,
            partyName: res.partyName,
            financier: res.financier,
            productName: res.productCode,
            salesExecutive: res.salesExecutive,
            mobileNo: res.mobileNo,
            refNo: res.refNo,
            narration: res.narration,
            totalAmount: res.totalAmount,
            customerType: res.businessType
          };

          this.receiptDetails = res.receiptEntryDetail ? [...res.receiptEntryDetail] : [];
          this.mapEditDropdowns();
          this.onCustomerTypeChange();

          resolve(true);
        },
        error: (err) => {
          console.error(err);
          resolve(false);
        }
      });
    });
  }

  mapEditDropdowns() {
    if (!this.apiResponse) return;

    // Party
    if (this.apiResponse.saleType === 'Against Lead') {
      this.formData.partyName = this.apiResponse.partyName || '';
    } else if (this.parties.length) {

      let partyInfo = this.parties.find(p => p.ledgerCode === this.apiResponse.partyName)?.ledgerName || '';

      if (partyInfo === '')
        partyInfo = this.parties.find(p => p.ledgerName === this.apiResponse.partyName)?.ledgerName || '';

      this.formData.partyName = partyInfo;
    }


    // Financier
    if (this.financiers.length) {
      this.selectedFinancier =
        this.financiers.find(f => f.ledgerCode === this.apiResponse.financier)?.ledgerName || '';
    }

    // Product
    if (this.products.length && this.apiResponse.productCode) {
      this.selectedProductCode = this.apiResponse.productName;

      this.selectedProduct =
        this.products.find(p => p.itemcode === this.apiResponse.productCode) || null;
    }
  }


  loadProducts(grpId?: number, search?: string): Promise<any> {
    return new Promise((resolve) => {
      this.itemService.getItems(grpId ?? 6, search ?? '').subscribe(
        (res) => {
          this.products = res;
          resolve(res);
          // this.mapEditDropdowns(); // added
        },
        (err) => {
          resolve(true);
          console.error('Error fetching products', err);
        }
      );
    });
  }

  onProductChange(event: Event) {
    const selectedCode = (event.target as HTMLSelectElement).value;
    this.selectedProduct = this.products.find(p => p.itemcode === this.formData.productName) || null;
  }
  getFinanciers() {

    this.ledgerService.getLedgerByType('Financier').subscribe({
      next: (res) => {
        this.financiers = res;

        this.mapEditDropdowns(); //  added
      }
    });
  }

  getParties(): Promise<any> {
    return new Promise((resolve) => {
      this.ledgerService.getLedgerByType('Receipt').subscribe({
        next: (res) => {

          this.parties = res;
          this.onCustomerTypeChange();

          //  Fix mapping for edit mode
          if (this.apiResponse) {

            if (this.apiResponse.saleType === 'Receipt') {
              const match = this.parties.find(
                p => p.ledgerCode?.trim() === this.apiResponse.partyName?.trim()
              );

              if (match) {
                this.formData.partyName = match.ledgerCode; // IMPORTANT
              }
            } else {
              // Against Lead
              this.formData.partyName = this.apiResponse.partyName;
            }
          }
          resolve(true);
        }
      });
    });
  }

  fetchLocations(): void {
    this.getNextReceiptNo();
    let dealerCode =null;
    const isSuoerAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';
    if(!isSuoerAdmin)
    {

      dealerCode=this.storageService.getDealerCode();
    }

    this.locationService.getLocationList(dealerCode).subscribe({
      next: (data: any[]) => {
        this.locations = data.filter(p => p.locareadidNo == 1);

        if (!this.isEditMode && this.locations.length > 0) {
          this.formData.location = this.locations[0].locname;
        }
      },
      error: (err) => {
        console.error('Error fetching locations', err);
      }
    });
  }
  getNextReceiptNo() {

    const dealerCode = this.storageService.getDealerCode();
    this.prefixService.getPrefixByDealerByModule(dealerCode, 'receipt_entry').subscribe({
      next: (data) => {
        this.nextReceiptNo = data;
      }
    });
  }

  get receiptNo() {
    return this.isEditMode ? this.formData.receiptNo : this.nextReceiptNo;
  }

  set receiptNo(value: string) {
    if (this.isEditMode) {
      this.formData.receiptNo = value;
    } else {
      this.nextReceiptNo = value;
    }
  }

  onSaleTypeChange() {
    if (this.formData.saleType === 'Against Lead') {
      if (!this.isEditMode) {
        this.formData.customerType = 'b2c';
      }
      this.onCustomerTypeChange(); // Filter parties

      this.openLeadSearchModal();
    } else {
      this.formData.customerType = 'b2c';
      this.formData.partyName = '';
      this.formData.bookingId = '';
      this.leadResult = null;
    }
  }


  openLeadSearchModal() {
    this.modalService.open(this.ReceiptEntryModal, { size: 'lg', backdrop: 'static' });
  }


  searchLead() {
    if (this.searchType === 'Mobile No' && this.isSearchMobileInvalid) {
      return;
    }
    let mobileNo: string | null = null;
    let bookingId: string | null = null;

    // Input handling
    if (this.searchType === 'Mobile No') {
      mobileNo = this.searchText.trim();

      if (!mobileNo) {
        this.toaster.show('Please enter mobile number!', {
          classname: 'bg-warning text-white',
          delay: 5000
        });
        return;
      }

    } else if (this.searchType === 'Booking Id') {
      const id = Number(this.searchText);

      if (isNaN(id)) {
        this.toaster.show('Please enter booking id!', {
          classname: 'bg-warning text-white',
          delay: 5000
        });
        return;
      }

      bookingId = id.toString();
    }

    const bookingIdNumber = bookingId ? Number(bookingId) : null;
    const dealerCode = this.storageService.getDealerCode();
    this.loader.show();
    // Check duplicate receipt
    this.receiptEntryService.checkReceiptExist(mobileNo, bookingId, this.formData.saleType, dealerCode).subscribe({
      next: (exists: boolean) => {
        if (exists) {
          this.loader.hide();
          this.leadResult = null;
          this.disableSave = true;
          this.toaster.show('Receipt already exists for this Mobile No / Booking ID!', {
            classname: 'bg-danger text-white',
            delay: 5000
          });

          return;
        }

        //  MAIN API CALL
        this.lmsService.getLeadByMobileOrBooking(mobileNo, bookingIdNumber)
          .subscribe({
            next: (res) => {

              this.loader.hide();

              this.leadResult = res?.lead || null;

              if (!res?.lead) {
                this.toaster.show('No record found for the given Mobile No / Booking ID!', {
                  classname: 'bg-warning text-white',
                  delay: 5000
                });
                return;
              }

              //OPEN CUSTOMER LEDGER IF NEW
              if (res.isNew) {
                this.formData.partyName = res.lead?.name || '';
                this.formData.mobileNo = res.lead?.mobile || res.lead?.mobileNumber || '';
                this.toaster.show('Please complete Ledger', {
                  classname: 'bg-success text-white',
                  delay: 5000
                });

                this.modalService.dismissAll(); // close lead search modal

                const modalRef = this.modalService.open(CustomerLedger, {
                  size: 'lg',
                  backdrop: 'static'
                });

                modalRef.componentInstance.defaultLedgerType = 'Party';
                modalRef.componentInstance.leadData = res.lead;
              }
            },
            error: () => {
              this.loader.hide();

              this.toaster.show('Record not found', {
                classname: 'bg-danger text-white',
                delay: 5000
              });
            }
          });
      },

      error: (err) => {
        this.loader.hide();
        console.error(err);

        this.toaster.show('Something went wrong', {
          classname: 'bg-danger text-white',
          delay: 5000
        });
      }
    });
  }


  approveLead(modal: any) {
    if (!this.leadResult) {
      this.toaster.show('No lead selected to approve!', {
        classname: 'bg-warning text-white',
        delay: 5000
      }); return;
    }
    this.formData.bookingId = this.leadResult.leadid?.toString() || '';
    this.formData.partyName = this.leadResult.name || '';
    this.formData.mobileNo = this.leadResult.mobile || '';
    this.formData.email = this.leadResult.email || '';
    this.formData.pinCode = this.leadResult.pincode ?? null;
    this.model = this.leadResult.model || '';
    modal.close();

    // Open Customer Ledger
    const modalRef = this.modalService.open(CustomerLedger, {
      size: 'lg',
      backdrop: 'static'
    });

    modalRef.componentInstance.defaultLedgerType = 'Party';
    modalRef.componentInstance.leadData = this.leadResult;
    modalRef.componentInstance.fromReceiptEntry = true;

    modalRef.result.then((ledgerId) => {
      if (ledgerId) {
        this.getParties();
      }
    }).catch(() => { });

  }



  resetForm() {
    this.formData.selectedLocation = '';
    this.selectedSaleType = 'Receipt';
    this.formData.bookingId = '';
    this.formData.partyName = '';
    this.formData.selectedFinancier = '';
    this.formData.selectedSalesExecutive = '';
    this.formData.selectedProduct = "";
    this.formData.selectedReceiptType = '';
    this.formData.refNo = '';
    this.formData.totalAmount = 0.00;
    this.formData.narration = '';
    this.formData.mobileNo = '';
    this.formData.receiptDate = this.today;
  }

  onCustomerTypeChange() {

    if (this.formData.customerType === 'b2b') {
      this.filteredParties = this.parties.filter(
        p => p.ledgerType === 'Institutional'
      );
    } else {
      this.filteredParties = this.parties.filter(
        p => p.ledgerType !== 'Institutional'
      );
    }

  }



  onSubmit(receiptForm: any) {
    this.disableSave = true;
    this.loader.show();
    if (!receiptForm.valid) {
      Object.keys(receiptForm.controls).forEach(field => {
        receiptForm.controls[field].markAsTouched({ onlySelf: true });
      });
      this.loader.hide();
      return;
    }

    const payload: ReceiptEntryAddViewModel = {
      dealerCode: this.storageService.getDealerCode(),
      location: this.formData.location,
      receiptNo: this.formData.receiptNo || this.nextReceiptNo,
      saleType: this.formData.saleType,
      bookingId: this.formData.bookingId,
      partyName: this.formData.partyName,
      financier: this.formData.financier,
      productCode: this.formData.productName || '',
      salesExecutive: this.formData.salesExecutive,
      receiptType: this.formData.receiptType,
      mobileNo: this.formData.mobileNo,
      billDate: this.formData.receiptDate,
      billNo: '',
      refNo: this.formData.refNo,
      narration: this.formData.narration,
      businessType: this.formData.customerType,
      totalAmount: this.getReceiptTotal(),

      receiptEntryDetail: this.receiptDetails.map((x, index) => ({
        lineItemNo: index + 1,
        amount: Number(x.amount),
        receiptType: x.receiptType,
        lineDate: x.instDate
      }))
    };
    if (this.isEditMode && this.id) {
      this.disableSave = false;
      this.loader.hide();
      this.receiptEntryService.updateReceipt(this.id, payload).subscribe({
        next: () => {
          this.toaster.show('Receipt updated successfully!', {
            classname: 'bg-success text-white',
            delay: 5000
          });
          this.navigation.navigate(['/receipt-entry']);
        },
        error: (err) => {
          this.loader.hide();
          this.disableSave = false;
          console.error(err);
          this.toaster.show('Failed to update the receipt!', {
            classname: 'bg-danger text-white',
            delay: 5000
          });
        }
      });
    } else {
      this.receiptEntryService.addReceiptEntry(payload).subscribe({
        next: (res) => {
          this.loader.hide();
          this.toaster.show('Receipt added successfully!', {
            classname: 'bg-success text-white',
            delay: 5000
          });
          this.resetForm();
          this.navigation.navigate(['/receipt-entry']);
        },
        error: (err) => {
          this.loader.hide();
          console.error(err);
          this.toaster.show('Failed to add receipt!', {
            classname: 'bg-danger text-white',
            delay: 5000
          });
        }
      });
    }

  }

  onCancel() {
    this.navigation.navigate(['/receipt-entry']);

  }

  backToList() {
    this.navigation.navigate(['/receipt-entry']);
  }

  openCustomerLedgerAdd(type: string) {

    const modalRef = this.modalService.open(CustomerLedger, {
      size: 'lg',
      backdrop: 'static'
    });

    modalRef.componentInstance.defaultLedgerType = type;
    modalRef.componentInstance.fromReceiptEntry = true;


    modalRef.result.then((newId) => {
      if (newId) {

        this.ledgerService.getLedgerByType(type).subscribe({
          next: (res) => {

            if (type === 'Financier') {
              this.financiers = [...res];
            } else {
              this.parties = [...res];
            }

            // Auto select newly added
            const added = res.find((x: any) => x.id === newId);

            if (added) {
              if (type === 'Financier') {
                this.formData.financier = added.ledgerName;
                this.selectedFinancier = added.ledgerName;
              } else {
                this.formData.partyName = added.ledgerName;
                this.selectedParty = added.ledgerName;
              }
            }
          }
        });
      }
    }).catch(() => { });
  }
  sanitizeMobile(event: any) {
    let value = event.target.value;

    value = value.replace(/[^0-9]/g, '');

    value = value.slice(0, 10);

    event.target.value = value;
    this.formData.mobileNumber = value;
  }
  onSearchInput(event: any) {
    if (this.searchType === 'Mobile No') {
      this.sanitizeMobile(event); // reuse existing function

      // validate AFTER sanitize
      const value = event.target.value;
      this.isSearchMobileInvalid = value.length !== 10;
      this.searchText = value;
    } else {
      this.searchText = event.target.value;
      this.isSearchMobileInvalid = false;
    }
  }

  filterPartyList() {

    const search = (this.formData.partyName || '').toLowerCase();

    this.filteredParties = this.parties.filter((x: any) =>
      x.ledgerName.toLowerCase().includes(search)
    );

    this.showPartyDropdown = true;
  }

  selectParty(party: any) {
    this.formData.partyName = party.ledgerName;
    this.formData.mobileNo = party.mobileNumber;
    this.formData.partyCode = party.ledgerCode;
    this.formData.partyState = party.stateName;
    this.showPartyDropdown = false;
    this.checkNo(this.formData.mobileNo);

  }


  isPartyValid(): boolean {
    return this.parties.some(
      (x: any) => x.ledgerName?.toLowerCase() === this.formData.partyName?.toLowerCase());
  }

  deleteReceiptRow(index: number) {
    this.receiptDetails.splice(index, 1);
  }
  getReceiptTotal(): number {
    return this.receiptDetails.reduce((sum, x) => sum + Number(x.amount || 0), 0);
  }

  addReceiptRow() {

    const row = {
      receiptType: this.receiptRow.receiptType,
      amount: this.receiptRow.amount,
      instType: this.receiptRow.instType,
      instNo: this.receiptRow.instNo,
      lineDate: this.receiptRow.lineDate,
      bankName: this.receiptRow.bankName,
      refNo: this.receiptRow.refNo
    };

    // UPDATE MODE
    if (this.isRowEditMode && this.editingRowIndex !== null) {
      this.receiptDetails[this.editingRowIndex] = row;

      this.isRowEditMode = false;
      this.editingRowIndex = null;
    }
    // ADD MODE
    else {
      this.receiptDetails.push(row);
    }

    this.resetReceiptRow();
  }
  editReceiptRow(index: number) {
    const row = this.receiptDetails[index];

    this.receiptRow = {
      ...row,
      lineDate: row.lineDate
        ? row.lineDate.split('T')[0]
        : this.today
    };

    this.isRowEditMode = true;
    this.editingRowIndex = index;
  }
  resetReceiptRow() {
    this.receiptRow = {
      receiptType: '',
      amount: 0,
      refNo: '',
      instType: '',
      instNo: '',
      lineDate: this.today,
      bankName: ''
    };
  }
  checkNo(mobileNo: string) {
    const dealerCode = this.storageService.getDealerCode();
    this.receiptEntryService.checkReceiptExist(mobileNo, null, this.formData.saleType, dealerCode).subscribe({
      next: (exists: boolean) => {

        if (exists) {
          this.loader.hide();
          this.leadResult = null;

          this.toaster.show(
            'Receipt already exists for this Mobile No / Booking ID!',
            {
              classname: 'bg-danger text-white',
              delay: 5000
            }
          );

          return;
        }

      },
      error: (err) => {
        this.loader.hide();
        console.error(err);

        this.toaster.show('Something went wrong', {
          classname: 'bg-danger text-white',
          delay: 5000
        });
      }
    });
  }

}