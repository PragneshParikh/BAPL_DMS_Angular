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
  today = new Date().toISOString().split('T')[0];;
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
    receiptDate: this.today,
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
  // customerType: string = 'b2c'; // default
  filteredParties: LedgerMaster[] = [];
  // receiptDate: string;
  selectedSaleType: string;
  // bookingId: string;
  // mobileNo: string;
  constructor(private router: ActivatedRoute,
    private receiptEntryService: ReceiptEntryService,
    private storageService: StorageService,
    private itemService: ItemMasterService, private modalService: NgbModal,
    private navigation: Router,
    private loader: LoaderService,
    public toaster: ToastService,
  ) {
    this.router.paramMap.subscribe(params => {
      this.id = params.get('id');
    });
  }

  async ngOnInit(): Promise<void> {
    this.loader.show();
    await this.getParties();
    await this.loadProducts();

    //this.receiptDate = 
    this.fetchLocations();
    this.getFinanciers();


    this.router.paramMap.subscribe(async params => {
      this.id = params.get('id');

      if (this.id) {
        this.isEditMode = true;
        await this.loadReceiptById(this.id);
      }
    });
    this.loader.hide();
  }


  loadReceiptById(id: number): Promise<any> {
    return new Promise((resolve) => {
      this.receiptEntryService.getReceiptById(id).subscribe({
        next: (res: ReceiptEntryEditModel) => {
          console.log('API response for receipt by ID:', res);

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
          this.onCustomerTypeChange();
          // ✅ CALL HERE ALSO
          this.mapEditDropdowns();

          return resolve(true);
        }
      });
    });

  }

  mapEditDropdowns() {
    if (!this.apiResponse) return;

    // ✅ Party
    if (this.apiResponse.saleType === 'Against Lead') {
      this.formData.partyName = this.apiResponse.partyName || '';
    } else if (this.parties.length) {

      let partyInfo = this.parties.find(p => p.ledgerCode === this.apiResponse.partyName)?.ledgerName || '';

      if (partyInfo === '')
        partyInfo = this.parties.find(p => p.ledgerName === this.apiResponse.partyName)?.ledgerName || '';

      this.formData.partyName = partyInfo;
    }


    // ✅ Financier
    if (this.financiers.length) {
      this.selectedFinancier =
        this.financiers.find(f => f.ledgerCode === this.apiResponse.financier)?.ledgerName || '';
    }

    // ✅ Product
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
          // this.mapEditDropdowns(); // ✅ added
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
    console.log('Selected product code:', selectedCode);
    this.selectedProduct = this.products.find(p => p.itemcode === this.formData.productName) || null;
    console.log('Selected product:', this.selectedProduct);
  }
  getFinanciers() {

    this.receiptEntryService.getLedgerByType('Financier').subscribe({
      next: (res) => {
        this.financiers = res;

        this.mapEditDropdowns(); // ✅ added
      }
    });
  }

  getParties(): Promise<any> {
    return new Promise((resolve) => {
      this.receiptEntryService.getLedgerByType('Party').subscribe({
        next: (res) => {
          this.parties = res;
          this.onCustomerTypeChange();

          // ✅ Fix mapping for edit mode
          if (this.apiResponse) {

            if (this.apiResponse.saleType === 'Receipt') {
              const match = this.parties.find(
                p => p.ledgerCode?.trim() === this.apiResponse.partyName?.trim()
              );

              if (match) {
                this.formData.partyName = match.ledgerCode; // ✅ IMPORTANT
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
    this.receiptEntryService.getNextReceiptNo().subscribe({
      next: (data) => {
        this.nextReceiptNo = data;

        console.log('data', data);
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
      this.formData.customerType = 'b2b';
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


  // searchLead() {
  //   let mobileNo: string | null = null;
  //   let bookingId: string | null = null;

  //      if (this.searchType === 'Mobile No') {
  //     mobileNo = this.searchText.trim();

  //     if (!mobileNo) {
  //        this.toaster.show('Please enter mobile number!', {
  //           classname: 'bg-warning text-white',
  //           delay: 5000
  //         });
  //       return;
  //     }

  //   } else if (this.searchType === 'Booking Id') {
  //     const id = Number(this.searchText);

  //     if (isNaN(id)) {
  //       this.toaster.show('Please enter booking id!', {
  //           classname: 'bg-warning text-white',
  //           delay: 5000
  //         });
  //       return;
  //     }

  //     bookingId = id.toString(); // ✅ convert to string for API
  //   }

  //   //  Check if already exists in Receipt Entry
  //   this.loader.show();
  //   // this.receiptEntryService.checkLeadExist(mobileNo, bookingId).subscribe({
  //   //   next: (exists: boolean) => {
  //   //     if (exists) {
  //   //       this.loader.hide();
  //   //        this.toaster.show('Receipt already exists for this Mobile No / Booking ID!', {
  //   //         classname: 'bg-danger text-white',
  //   //         delay: 5000
  //   //       });
  //   //       return;
  //   //     }

  //   //     //call API to add 

  //   //     const bookingIdNumber = bookingId ? Number(bookingId) : null;

  //   //     this.receiptEntryService.getLeadByMobileOrBooking(mobileNo, bookingIdNumber).subscribe({
  //   //       next: (res) => {
  //   //         console.log('Lead search result:', res);
  //   //         this.loader.hide();
  //   //         this.leadResult = res;

  //   //         if (!res) {
  //   //           this.loader.hide();
  //   //             this.toaster.show('No record found for the given Mobile No / Booking ID!', {
  //   //         classname: 'bg-success text-white',
  //   //         delay: 5000
  //   //       });
  //   //         }
  //   //       },
  //   //       error: (err) => {
  //   //         this.loader.hide();
  //   //          this.toaster.show('Record not found', {
  //   //         classname: 'bg-warning text-white',
  //   //         delay: 5000
  //   //       });
  //   //       }
  //   //     });

  //   //   },
  //   //   error: (err) => {
  //   //      this.toaster.show(err, {
  //   //         classname: 'bg-danger text-white',
  //   //         delay: 5000
  //   //       });
  //   //     console.error(err);
  //   //   }
  //   // });
  // this.receiptEntryService.getLeadByMobileOrBooking(mobileNo, bookingIdNumber)
  // .subscribe({
  //   next: (res) => {
  //     console.log('Lead search result:', res);

  //     this.loader.hide();

  //     // ✅ set lead data properly
  //     this.leadResult = res.lead;

  //     // ❌ if no lead
  //     if (!res.lead) {
  //       this.toaster.show('No record found for the given Mobile No / Booking ID!', {
  //         classname: 'bg-warning text-white',
  //         delay: 5000
  //       });
  //       return;
  //     }

  //     // ✅ NEW LEDGER CREATED → REDIRECT
  //     if (res.isNew && res.ledgerId) {
  //       this.toaster.show('Ledger created. Please complete details.', {
  //         classname: 'bg-info text-white',
  //         delay: 5000
  //       });

  //       this.modalService.dismissAll();

  //       this.navigation.navigate(['/customer-ledger', res.ledgerId]); // 🔥 MAIN GOAL
  //     }
  //   },
  //   error: () => {
  //     this.loader.hide();
  //     this.toaster.show('Record not found', {
  //       classname: 'bg-danger text-white',
  //       delay: 5000
  //     });
  //   }
  // });

  // }

  // searchLead() {
  //   let mobileNo: string | null = null;
  //   let bookingId: string | null = null;

  //   // ✅ Input handling
  //   if (this.searchType === 'Mobile No') {
  //     mobileNo = this.searchText.trim();

  //     if (!mobileNo) {
  //       this.toaster.show('Please enter mobile number!', {
  //         classname: 'bg-warning text-white',
  //         delay: 5000
  //       });
  //       return;
  //     }

  //   } else if (this.searchType === 'Booking Id') {
  //     const id = Number(this.searchText);

  //     if (isNaN(id)) {
  //       this.toaster.show('Please enter booking id!', {
  //         classname: 'bg-warning text-white',
  //         delay: 5000
  //       });
  //       return;
  //     }

  //     bookingId = id.toString();
  //   }

  //   // ✅ Convert bookingId to number
  //   const bookingIdNumber = bookingId ? Number(bookingId) : null;

  //   this.loader.show();

  //   // ✅ OPTIONAL (recommended): Check duplicate receipt
  //   this.receiptEntryService.checkLeadExist(mobileNo, bookingId).subscribe({
  //     next: (exists: boolean) => {

  //       if (exists) {
  //         this.loader.hide();

  //         this.leadResult = null; // ❌ hide collapsible UI

  //         this.toaster.show('Receipt already exists for this Mobile No / Booking ID!', {
  //           classname: 'bg-danger text-white',
  //           delay: 5000
  //         });

  //         return; // 🔴 STOP
  //       }

  //       // ✅ MAIN API CALL
  //       this.receiptEntryService.getLeadByMobileOrBooking(mobileNo, bookingIdNumber)
  //         .subscribe({
  //           next: (res) => {
  //             console.log('Lead search result:', res);

  //             this.loader.hide();

  //             // ✅ assign lead properly
  //             this.leadResult = res?.lead || null;

  //             if (!res?.lead) {
  //               this.toaster.show('No record found for the given Mobile No / Booking ID!', {
  //                 classname: 'bg-warning text-white',
  //                 delay: 5000
  //               });
  //               return;
  //             }

  //             // ✅ REDIRECT if ledger created
  //             if (res.isNew && res.ledgerId) {
  //               this.toaster.show('Ledger created. Please complete details.', {
  //                 classname: 'bg-success text-white',
  //                 delay: 5000
  //               });

  //               this.modalService.dismissAll();

  //               if (res.isNew && res.ledgerId) {

  //                 this.toaster.show('Ledger created. Please complete details.', {
  //                   classname: 'bg-success text-white',
  //                   delay: 5000
  //                 });

  //                 this.modalService.dismissAll(); // close lead modal

  //                 const modalRef = this.modalService.open(CustomerLedger, {
  //                   size: 'lg',
  //                   backdrop: 'static'
  //                 });

  //                 modalRef.componentInstance.ledgerId = res.ledgerId; // ✅ PASS ID
  //               }
  //             }
  //           },
  //           error: () => {
  //             this.loader.hide();
  //             this.toaster.show('Record not found', {
  //               classname: 'bg-danger text-white',
  //               delay: 5000
  //             });
  //           }
  //         });
  //     },

  //     error: (err) => {
  //       this.loader.hide();
  //       console.error(err);
  //       this.toaster.show('Something went wrong', {
  //         classname: 'bg-danger text-white',
  //         delay: 5000
  //       });
  //     }
  //   });
  // }

  searchLead() {
    let mobileNo: string | null = null;
    let bookingId: string | null = null;

    // ✅ Input handling
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

    // ✅ Check duplicate receipt
    this.receiptEntryService.checkLeadExist(mobileNo, bookingId).subscribe({
      next: (exists: boolean) => {
        console.log(exists);

        if (exists) {
          console.log(exists);
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
              console.log('Lead search result:', res);

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

  onAddClick() {
    this.loader.show();
    const payload: ReceiptEntryAddViewModel = {
      location: this.formData.location,
      receiptNo: this.formData.receiptNo || this.nextReceiptNo,
      saleType: this.formData.saleType,
      bookingId: this.formData.bookingId,
      partyName: this.formData.partyName,
      financier: this.formData.financier,
      productCode: this.formData?.productName || '',
      salesExecutive: this.formData.salesExecutive,
      receiptType: this.formData.receiptType,
      mobileNo: this.formData.mobileNo,
      billDate: this.formData.receiptDate,
      billNo: '',
      refNo: this.formData.refNo,
      narration: this.formData.narration,
      totalAmount: this.formData.totalAmount
    };


    this.receiptEntryService.addReceiptEntry(payload).subscribe({
      next: (res) => {
        this.loader.hide();
        this.toaster.show('Receipt added Succesfully!', {
          classname: 'bg-success text-white',
          delay: 5000
        });
        this.resetForm();
        this.navigation.navigate(['/receipt-entry']);
      },
      error: (err) => {
        console.error('API Error:', err);
        this.toaster.show('Failed to add receipt entry', {
          classname: 'bg-danger text-white',
          delay: 5000
        });
      }
    });
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

    if (!receiptForm.valid) {
      // Mark all fields as touched to show validation messages
      Object.keys(receiptForm.controls).forEach(field => {
        const control = receiptForm.controls[field];
        control.markAsTouched({ onlySelf: true });
      });
      return;
    }

    const payload: ReceiptEntryAddViewModel = {
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
      billDate: this.formData.billDate,
      billNo: '',
      refNo: this.formData.refNo,
      narration: this.formData.narration,
      businessType: this.formData.customerType,
      totalAmount: this.formData.totalAmount
    };

    console.log('Payload:', payload);

    if (this.isEditMode && this.id) {
      // ✅ Call Update API
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
      // ✅ Call Add API
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

  openCustomerLedgerAdd() {
    const modalRef = this.modalService.open(CustomerLedger, {
      size: 'lg',
      backdrop: 'static'
    });

    modalRef.componentInstance.defaultLedgerType = 'Financier';

    modalRef.result.then((newId) => {
      if (newId) {

        console.log(newId);

        // ✅ IMPORTANT: subscribe and act AFTER data comes
        this.receiptEntryService.getLedgerByType('Financier').subscribe({
          next: (res) => {
            this.financiers = res;

            // ✅ Force change detection via new reference
            this.financiers = [...this.financiers];

            // ✅ OPTIONAL: auto-select newly added
            const added = this.financiers.find(f => f.id === newId);
            if (added) {
              console.log('Newly added financier:', added);
              this.formData.financier = added.ledgerName;
              this.selectedFinancier = added.ledgerName;
            }
          }
        });
      }
    }).catch(() => { });
  }
}
