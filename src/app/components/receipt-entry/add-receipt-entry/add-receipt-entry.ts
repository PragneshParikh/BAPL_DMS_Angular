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
import { thru } from 'lodash';
import { log } from 'console';
import { PrefixService } from '../../../core/services/prefix';

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
    customerType: 'b2c'
  };

  selectedFinancier: string = '';
  searchType: string = 'Mobile No';
  searchText: string = '';
  leadResult: LmsleadMaster | null = null;
  selectedProductCode: string = '';
  apiResponse!: ReceiptEntryEditModel;
  isEditMode: boolean = false;
  id: any;

  model: any;
  modalRef: any;
  filteredParties: LedgerMaster[] = [];
  receiptDate: string;
  selectedSaleType: string;
  selectedParty: string;
  isSearchMobileInvalid: boolean;
  constructor(private router: ActivatedRoute,
    private receiptEntryService: ReceiptEntryService,
    private storageService: StorageService,
    private itemService: ItemMasterService, private modalService: NgbModal,
    private navigation: Router,
    private loader: LoaderService,
    public toaster: ToastService,
    private prefixService: PrefixService
  ) {
    this.router.paramMap.subscribe(params => {
      this.id = params.get('id');
    });
  }

  async ngOnInit(): Promise<void> {
  this.loader.show();

  //  Get ID synchronously
  this.id = this.router.snapshot.paramMap.get('id');
  console.log("id",this.id);
  
  this.isEditMode = !!this.id;

  console.log(this.isEditMode);
  

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
          console.log(res);
          
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
            receiptType: res.receiptType,
            mobileNo: res.mobileNo,
            refNo: res.refNo,
            narration: res.narration,
            totalAmount: res.totalAmount,
            customerType: res.businessType
          };

          // apply filter
          //  CALL HERE ALSO
          this.mapEditDropdowns();
          this.onCustomerTypeChange();

          return resolve(true);
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

    this.receiptEntryService.getLedgerByType('Financier').subscribe({
      next: (res) => {
        this.financiers = res;

        this.mapEditDropdowns(); //  added
      }
    });
  }

  getParties(): Promise<any> {
    return new Promise((resolve) => {
      this.receiptEntryService.getLedgerByType('Party').subscribe({
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
    const dealerCode = this.storageService.getDealerCode();

    this.receiptEntryService.getLocationList(dealerCode).subscribe({
      next: (data: LocationName[]) => {
        this.locations = data;
        if (!this.isEditMode && this.locations.length > 0) {
          this.formData.location = this.locations[0].locname;
        }
        console.log('Fetched locations:', this.locations);
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
        console.log('Next receipt no:', data);
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

      // Open modal immediately
      this.openLeadSearchModal();
    } else {
      // Clear all lead-related fields
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

    this.loader.show();

    // Check duplicate receipt
    this.receiptEntryService.checkLeadExist(mobileNo, bookingId).subscribe({
      next: (exists: boolean) => {
        if (exists) {
          this.loader.hide();
          this.leadResult = null;

          this.toaster.show('Receipt already exists for this Mobile No / Booking ID!', {
            classname: 'bg-danger text-white',
            delay: 5000
          });

          return;
        }

        //  MAIN API CALL
        this.receiptEntryService.getLeadByMobileOrBooking(mobileNo, bookingIdNumber)
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
              if (res.isNew && res.ledgerId) {
                this.formData.partyName = res.lead?.name || '';
                this.toaster.show('Ledger created. Please complete details.', {
                  classname: 'bg-success text-white',
                  delay: 5000
                });

                this.modalService.dismissAll(); // close lead search modal

                const modalRef = this.modalService.open(CustomerLedger, {
                  size: 'lg',
                  backdrop: 'static'
                });

                modalRef.componentInstance.ledgerId = res.ledgerId;
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

    // Close the modal
    modal.close();
  }

  // onAddClick() {
  //   this.disableSave=true;
  //   this.loader.show();
  //   const payload: ReceiptEntryAddViewModel = {
  //     location: this.formData.location,
  //     receiptNo: this.formData.receiptNo || this.nextReceiptNo,
  //     saleType: this.formData.saleType,
  //     bookingId: this.formData.bookingId,
  //     partyName: this.formData.partyName,
  //     financier: this.formData.financier,
  //     productCode: this.formData?.productName || '',
  //     salesExecutive: this.formData.salesExecutive,
  //     receiptType: this.formData.receiptType,
  //     mobileNo: this.formData.mobileNo,
  //     billDate: this.formData.receiptDate,
  //     billNo: '',
  //     refNo: this.formData.refNo,
  //     narration: this.formData.narration,
  //     totalAmount: this.formData.totalAmount,
  //     businessType:this.formData.customerType
  //   };


  //   this.receiptEntryService.addReceiptEntry(payload).subscribe({
  //     next: (res) => {
  //       this.loader.hide();
  //       this.toaster.show('Receipt added Succesfully!', {
  //         classname: 'bg-success text-white',
  //         delay: 5000
  //       });
  //       this.resetForm();
  //       this.navigation.navigate(['/receipt-entry']);
  //     },
  //     error: (err) => {
  //       this.disableSave=false;
  //       console.error('API Error:', err);
  //       this.toaster.show('Failed to add receipt entry', {
  //         classname: 'bg-danger text-white',
  //         delay: 5000
  //       });
  //     }
  //   });
  // }

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

    if (!receiptForm.valid) {
      // Mark all fields as touched to show validation messages
      Object.keys(receiptForm.controls).forEach(field => {
        const control = receiptForm.controls[field];
        control.markAsTouched({ onlySelf: true });
      });
      return;
    }

    const payload: ReceiptEntryAddViewModel = {
      dealerCode:this.storageService.getDealerCode(),
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
      totalAmount: this.formData.totalAmount
    };
console.log(this.isEditMode,this.id);

    if (this.isEditMode && this.id) {

      console.log(payload);
      
      // Call Update API
      this.receiptEntryService.updateReceipt(this.id, payload).subscribe({
        next: (res) => {
          this.toaster.show('Receipt updated successfully!', {
            classname: 'bg-success text-white',
            delay: 5000
          });
          this.navigation.navigate(['/receipt-entry']);
        },
        error: (err) => {
          console.error('Update error:', err);
          this.toaster.show('Failed to update the receipt!', {
            classname: 'bg-danger text-white',
            delay: 5000
          });
        }
      });
    } else {
      //  Call Add API
      this.receiptEntryService.addReceiptEntry(payload).subscribe({
        next: (res) => {
          this.toaster.show('Receipt added successfully!', {
            classname: 'bg-success text-white',
            delay: 5000
          });
          this.resetForm();
          this.navigation.navigate(['/receipt-entry']);
        },
        error: (err) => {
          console.error('Add error:', err);
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

      this.receiptEntryService.getLedgerByType(type).subscribe({
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
  }).catch(() => {});
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
}
