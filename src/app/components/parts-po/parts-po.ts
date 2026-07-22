import { Component, ElementRef, OnInit } from '@angular/core';
import { LocationMasterService } from '../../core/services/location-master-service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { StorageService } from '../../core/services/storage';
import { ItemMasterService } from '../../core/services/item-master-service';
import { KitCreationService } from '../../core/services/kit-creation.service';
import { KitDetailService } from '../../core/services/kit-detail-service';
import { NgbDropdownModule, NgbModal, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { TRANSACTION_TYPES } from '../../constant';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import { JobCardService } from '../../core/services/job-card-service';
import Swal from 'sweetalert2';
import { PrefixService } from '../../core/services/prefix';
import { PurchaseService } from '../../core/services/purchase-service';
import { LedgerMasterService } from '../../core/services/ledger-master';
import _ from 'lodash';
import { JobSearch } from '../../dialogs/job-search/job-search';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-parts-po',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgbPaginationModule, NgSelectModule, NgbDropdownModule],
  templateUrl: './parts-po.html',
  styleUrl: './parts-po.scss',
})
export class PartsPo implements OnInit {
  locationList: any[] = [];
  jobId: number | null = null;

  itemList: any[] = [];
  kitList: any[] = [];
  purchaseDetails: any[] = [];
  pagedPurchaseDetails: any[] = [];
  page = 1;
  pageSize = 5;

  isSubmitted: boolean = false;
  isSaving: boolean = false;
  poNumber: string = '';
  transactionTypeList = TRANSACTION_TYPES;

  locationInvalid: boolean = false;
  transactionTypeInvalid: boolean = false;
  partNoInvalid: boolean = false;
  qtyInvalid: boolean = false;
  orderTypeInvalid: boolean = false;

  jobCardList: any[] = [];
  activeJobCards: any[] = [];

  currentItem = {
    id: 0,
    itemId: null,
    itemCode: null,
    itemDescription: '',

    qty: 0,
    rate: '',

    mrp: '',
    amount: '',
    taxableAmount: 0,

    sgstAmt: '',
    cgstAmt: '',
    igstAmt: '',

    cgst: '',
    sgst: '',
    igst: '',

    itemType: 1,
    currentStock: 0,

    status: '',
    createdBy: '',
    createdDate: new Date(),
    updatedBy: null,
    updatedDate: null,
    isEdit: false,
    minOrdQty: 0,
  };

  partsPOData: any = {
    poDate: new Date().toISOString(),
    selectedLocation: '',
    prefixNo: '',
    orderNo: '',
    subPoType: '',
    transactionType: 'B2C',
    isKit: false,
    partyName: '',
    poType: 'Spares',
    id: 0
  }

  dealerCode: string = '';
  isSuperAdmin: boolean = false;

  private tempIdCounter = -1;
  taxDetails: any[] = [];
  isEdit: boolean = false;
  ledgerList: any[] = [];
  previousPurchaseDetails: any[] = [];

  constructor(
    private locationService: LocationMasterService,
    private storageService: StorageService,
    private itemmasterService: ItemMasterService,
    private purchaseService: PurchaseService,
    private route: ActivatedRoute,
    private router: Router,
    private loader: LoaderService,
    public toaster: ToastService,
    private kitCreationService: KitCreationService,
    private kitDetailService: KitDetailService,
    private jobCardService: JobCardService,
    private prefixService: PrefixService,
    private ledgerService: LedgerMasterService,
    private modalService: NgbModal,
    private eRef: ElementRef) {

    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';

    if (!this.isSuperAdmin) {
      this.dealerCode = this.storageService.getDealerCode();
    }
  }

  async ngOnInit() {
    this.loadShowroomLocations();
    this.getItemList();
    this.loadKitList();
    this.loadJobCards();
    await this.getPartyName();

    this.route.params.subscribe(params => {

      const encPO = params['ponumber'];
      const decoded = atob(encPO);

      this.poNumber = decoded.split('|')[1];

      if (this.poNumber && this.poNumber !== '0') {
        this.isEdit = true;
        this.getDetailsByPONumber();
      } else {
        this.isEdit = false;
        // this.generateNewOrderNo();
      }

    });

  }

  generateNewOrderNo(dealerCode: string) {
    // this.orderNo = '1';
    this.loader.show();
    this.prefixService.getPrefixByDealerByModule(dealerCode, 'purchase_order').subscribe({
      next: (res: string) => {
        this.loader.hide();
        this.partsPOData.prefixNo = res;
        this.partsPOData.orderNo = res.split('/').pop();
      }, error: (err) => {
        this.loader.hide();
        console.error('Error fetching prefix:', err);
        this.toaster.show('Could not generate order number. Please check the console for more info.', { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  loadShowroomLocations() {
    this.loader.show();
    this.locationService.GetDealerPrimaryLocationByAreaId(2, 'W1', this.dealerCode).subscribe({
      next: (res: any) => {
        this.loader.hide();
        this.locationList = res;
        // if (this.locationList && this.locationList.length > 0) {
        //   this.partsPOData.selectedLocation = this.locationList[0].loccode;
        // }
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
      }
    })
  }

  getPartyName(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.loader.show();
      this.ledgerService.getCompanyLedgers().subscribe({
        next: (res: any) => {
          this.ledgerList = res || [];
          if (this.ledgerList.length > 0) {
            this.partsPOData.partyName = this.ledgerList[0].ledgerCode;
          }
          this.loader.hide();
          resolve(true);
        },
        error: (err) => {
          reject(false);
          this.loader.hide();
          console.error('Error loading ledgers:', err);
          this.toaster.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 })
        }
      });
    });
  }

  // onLocationChange() {
  //   this.locationInvalid = false;
  //   this.calculateRowTotals();
  // }

  onPoTypeChange() {
    this.orderTypeInvalid = false;
    if (this.partsPOData.subPoType !== 'SSOMSO') {
      this.partsPOData.isKit = false;
    }
  }

  onKitToggleChange() {
    this.resetCurrentItem();
  }

  loadJobCards() {
    const dealerCode = this.storageService.getDealerCode();
    this.jobCardService.getJobCardList(dealerCode).subscribe({
      next: (res: any) => {
        this.jobCardList = Array.isArray(res) ? res : (res?.data || []);
        // Filtering for 'Active' job cards. Usually, this means jobStatus is not 'Closed' or 'Invoiced'.
        // Based on common patterns in this repo, we'll keep those that are not closed.
        this.activeJobCards = this.jobCardList.filter((j: any) =>
          (j.jobStatus || '').toLowerCase() !== 'closed' &&
          (j.jobStatus || '').toLowerCase() !== 'invoiced'
        );
      },
      error: (err) => console.error('Error loading job cards:', err)
    });
  }

  // onJobNoChange() {
  //   // if (!this.vorDetails.jobNo) {
  //   //   this.resetVorDetails();
  //   //   return;
  //   // }

  //   // const job = this.activeJobCards.find(j =>
  //   //   (j.jobCardHeader?.jobNo || '').toString().trim() === this.vorDetails.jobNo.toString().trim()
  //   // );

  //   // if (job) {
  //   //   // this.vorDetails = {
  //   //   //   jobNo: job.jobCardHeader?.jobNo,
  //   //   //   chassisNo: job.jobCardCustomer?.chassisNo || '',
  //   //   //   registerNo: job.jobCardCustomer?.registerNo || '',
  //   //   //   engineNo: job.jobCardCustomer?.engineNo || '',
  //   //   //   jobType: job.jobtype || '',
  //   //   //   serviceHead: job.serviceHead || '',
  //   //   //   serviceType: job.serviceType || '',
  //   //   //   partyName: job.jobCardCustomer?.customerName || '',
  //   //   //   mobileNo: job.jobCardCustomer?.customerMobile || '',
  //   //   //   modelNo: job.jobCardCustomer?.modelName || ''
  //   //   // };
  //   // } else {
  //   //   // Keep JobNo but clear other fields if not found in active list
  //   //   // const currentNo = this.vorDetails.jobNo;
  //   //   // this.resetVorDetails();
  //   //   // this.vorDetails.jobNo = currentNo;
  //   // }
  // }

  // resetVorDetails() {
  //   this.vorDetails = {
  //     jobNo: '',
  //     chassisNo: '',
  //     registerNo: '',
  //     engineNo: '',
  //     jobType: '',
  //     serviceHead: '',
  //     serviceType: '',
  //     partyName: '',
  //     mobileNo: '',
  //     modelNo: ''
  //   };
  // }

  // getItemList() {
  //   this.loader.show();
  //   this.itemmasterService.fetchItemsByHsnTaxAndGroupId(1).subscribe({
  //     next: (res) => {
  //       this.loader.hide();
  //       this.itemList = res;
  //     },
  //     error: (err) => {
  //       this.loader.hide();
  //       console.error(err);
  //       this.toaster.show('Failed to load items. Please try again later.', { classname: 'bg-danger text-light' });
  //     }
  //   });
  // }
  getItemList() {
    this.loader.show();
    this.itemmasterService.fetchItemsByHsnTaxAndGroupId(1).subscribe({
      next: (res) => {
        this.loader.hide();
        this.itemList = res;
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show('Failed to load items. Please try again later.', { classname: 'bg-danger text-light' });
      }
    });
  }

  loadKitList() {
    // Calling 'paged' with a large pageSize to get all kits for the dropdown
    this.kitCreationService.getKitByPaged('', 0, 1000).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res?.data || []);
        // Only show active kits
        this.kitList = data.filter((k: any) => k.status === true);
      },
      error: (err) => console.error('Error loading kits:', err)
    });
  }

  onPartChange(itemId: any) {
    this.partNoInvalid = false;
    if (!this.currentItem.itemCode) {
      this.resetCurrentItem();
      return;
    }

    //#region IsKIT
    if (this.partsPOData.isKit) {
      const selectedKit = this.kitList.find(k => k.id === Number(this.currentItem.itemCode) || k.kitName === this.currentItem.itemCode);
      if (selectedKit) {
        this.currentItem.itemDescription = selectedKit.kitName || '';
        this.currentItem.qty = 1; // Default kit qty to 1

        this.loader.show();
        this.kitDetailService.getKitDetailsWithItemsByHeaderAndLocation(this.currentItem.itemCode, this.partsPOData.selectedLocation, this.partsPOData.partyName).subscribe({
          next: (res: any) => {
            this.loader.hide();
            const details = Array.isArray(res) ? res : (res?.data || []);
            let totalRate = 0;

            details.forEach((det: any) => {
              const qty = det.quantity || 0;
              let rate = det.item?.custprice || det.rate || 0;

              // Fallback to Item Master if rate is missing
              if (!rate || rate === 0) {
                const itemCode = det.item?.itemcode || det.itemcode || det.itemName;
                const masterItem = this.itemList.find(m =>
                  m.id === det.itemId ||
                  (m.itemcode || '').trim().toUpperCase() === (itemCode || '').trim().toUpperCase()
                );
                if (masterItem) {
                  rate = Number(masterItem.custprice || masterItem.custprice || 0);
                }
              }

              totalRate += (qty * rate);
            });

            this.currentItem.rate = totalRate.toFixed(2);
            this.calculateRowTotals();
          },
          error: (err) => {
            this.loader.hide();
            console.error('Error fetching kit details for rate calculation', err);
          }
        });
      }
      return;
    }
    //#endregion

    const selectedItem = this.itemList.find(item => item.itemcode === this.currentItem.itemCode);
    if (selectedItem) {
      // this.loader.show();
      // this.taxService.getTaxList(selectedItem.itemcode.toString(), this.partsPOData.selectedLocation, '').subscribe({
      //   next: (res) => {
      //     this.loader.hide();
      //     this.taxDetails = res;
      //     const totalGST = res.reduce(
      //       (sum, tax) => sum + Number(tax.taxRate || 0), 0
      //     );

      //     const taxDetails = this.calculateGST(Number(selectedItem.dlrprice), totalGST);

      //     this.currentItem.itemdesc = selectedItem.itemdesc;
      //     this.currentItem.itemId = selectedItem.id;
      //     this.currentItem.itemRate = Number(taxDetails.basePrice).toFixed(2);
      //     this.currentItem.currentStock = selectedItem.batchClosingQty;
      //   },
      //   error: (err) => {
      //     this.loader.hide();
      //     console.error(err);
      //     this.toaster.show('Failed to fetch tax details. Please try again later.', { classname: 'bg-danger text-light' });
      //   }
      // });

      const totalGST = Number(selectedItem.cgstPercentage) + Number(selectedItem.sgstPercentage) //+ Number(this.newItem.igst);
      const taxDetails = this.calculateGST(selectedItem.dlrprice, totalGST);

      this.currentItem.qty = selectedItem.minOrderQty || 1;
      this.currentItem.minOrdQty = selectedItem.minOrderQty || 1;
      this.currentItem.itemDescription = selectedItem.itemdesc;
      this.currentItem.itemCode = selectedItem.itemcode;
      this.currentItem.itemId = selectedItem.id;
      this.currentItem.rate = Number(taxDetails.basePrice).toFixed(2);

      this.currentItem.cgst = selectedItem.cgstPercentage;
      this.currentItem.sgst = selectedItem.sgstPercentage;
      this.currentItem.igst = selectedItem.igstPercentage;
    }

  }

  calculateRowTotals() {
    let qty = Number(this.currentItem.qty) || 0;
    let rate = Number(this.currentItem.rate) || 0;

    let taxableAmount = (qty * rate);
    this.currentItem.taxableAmount = taxableAmount > 0 ? taxableAmount : 0;

    this.currentItem.amount = this.currentItem.taxableAmount + this.currentItem.sgstAmt + this.currentItem.cgstAmt + this.currentItem.igstAmt;

    // Reset validation flags
    if (this.currentItem.qty > 0) this.qtyInvalid = false;
    if (this.partsPOData.transactionType) this.transactionTypeInvalid = false;
  }

  // addPurchaseItem() {
  //   this.locationInvalid = !this.partsPOData.selectedLocation;
  //   this.transactionTypeInvalid = !this.partsPOData.transactionType;
  //   this.orderTypeInvalid = !this.partsPOData.subPoType;

  //   this.partNoInvalid = !this.currentItem.itemCode;
  //   this.qtyInvalid = !this.currentItem.qty || this.currentItem.qty <= 0;

  //   if (this.locationInvalid || this.transactionTypeInvalid || this.orderTypeInvalid || this.partNoInvalid || this.qtyInvalid) {
  //     return;
  //   }

  //   if (this.partsPOData.isKit) {
  //     if (this.currentItem.qty > 1) {
  //       this.toaster.show('Only 1 kit can be purchased at a time.', { classname: 'bg-danger text-white', delay: 3000 });
  //       return;
  //     }

  //     // Fetch kit details and expand them
  //     this.loader.show();
  //     this.kitDetailService.getKitDetailsWithItemsByHeaderAndLocation(this.currentItem.itemCode, this.partsPOData.selectedLocation, this.partsPOData.partyName).subscribe({
  //       next: (res: any) => {
  //         this.loader.hide();
  //         const details = Array.isArray(res) ? res : (res?.data || []);

  //         if (details.length === 0) {
  //           this.toaster.show('No parts found in this kit.', { classname: 'bg-warning text-dark', delay: 3000 });
  //           return;
  //         }

  //         const kitItems: any[] = [];
  //         const zeroParts: string[] = [];

  //         details.forEach((det: any) => {

  //           const totalGST = det.taxDetails.reduce(
  //             (sum, tax) => sum + Number(tax.taxRate || 0), 0
  //           );

  //           const gstPrice = this.calculateGST(det.itemPrice, totalGST);
  //           const gstData = this.calculateGSTAmount(det.itemPrice, det.taxDetails);

  //           const sgstAmt = gstData.sgst * det.quantity;
  //           const cgstAmt = gstData.cgst * det.quantity;
  //           const igstAmt = gstData.igst * det.quantity;

  //           let amount = Number(gstPrice.basePrice) * Number(det.quantity);

  //           kitItems.push({
  //             partNo: det.itemCode,
  //             description: det.itemDescription,
  //             quantity: det.quantity,
  //             itemRate: gstPrice.basePrice,
  //             mrp: det.itemPrice * det.quantity,
  //             sgstAmt: sgstAmt,
  //             cgstAmt: cgstAmt,
  //             igstAmt: igstAmt,
  //             amount: amount,
  //             itemType: det.item?.itemtype || 1,
  //             fromKit: true
  //           });
  //         });

  //         // Block if any kit item has zero rate
  //         if (zeroParts.length > 0) {
  //           this.toaster.show(`Rate is 0 for: ${zeroParts.join(', ')}. Kit not added.`, { classname: 'bg-danger text-white', delay: 6000 });
  //           return;
  //         }

  //         kitItems.forEach(k => this.purchaseDetails.push(k));

  //         this.resetCurrentItem();
  //         this.loadPage();
  //       },
  //       error: (err) => {
  //         this.loader.hide();
  //         console.error('Error expanding kit:', err);
  //         this.toaster.show('Error loading kit details.', { classname: 'bg-danger text-white', delay: 3000 });
  //       }
  //     });

  //   } else {

  //     const _existingItem = this.pagedPurchaseDetails.filter(x => x.itemcode === this.currentItem.itemcode);

  //     if (this.currentItem.itemId <= 0) {
  //       this.toaster.show('Please select an item to add.', { classname: 'bg-warning text-white', delay: 5000 });
  //       return;
  //     }

  //     if (this.currentItem.quantity <= 0) {
  //       this.toaster.show('Please enter a valid quantity.', { classname: 'bg-warning text-white', delay: 5000 });
  //       return;
  //     }

  //     if (_existingItem.length > 0 && _existingItem[0].status !== 'Deleted' && !this.currentItem.isEdit) {
  //       this.toaster.show('Part already exists.', { classname: 'bg-warning text-white', delay: 5000 });
  //       return;
  //     }

  //     // Attempt to set a fallback description if still empty
  //     // if (!this.currentItem.itemdesc) {
  //     //   const fallbackModel = this.itemList.find(m => m.itemcode === this.currentItem.partNo);
  //     //   if (fallbackModel) {
  //     //     this.currentItem.itemdesc = fallbackModel.itemdesc || fallbackModel.itemname || fallbackModel.Itemname || fallbackModel.itemdesc || '';
  //     //   }
  //     // }

  //     // this.calculateRowTotals();

  //     // const newItem = { ...this.currentItem };

  //     let index = this.pagedPurchaseDetails.findIndex(x => x.itemcode === this.currentItem.itemcode && x.status !== 'Deleted');

  //     const totalGST = Number(this.currentItem.cgst) + Number(this.currentItem.sgst) //+ Number(this.currentItem.igst);

  //     const selectedItem = this.itemList.find(item => item.itemcode === this.currentItem.itemcode);

  //     const taxDetails = this.calculateGST(Number(selectedItem.dlrprice), totalGST);
  //     const totalGSTAmount = Number(taxDetails.gstAmount);

  //     const qty = Number(this.currentItem.quantity || 0);

  //     let sellerParty = this.ledgerList.find(l => l.ledgerCode === this.partsPOData.partyName);
  //     let buyerParty = this.locationList.find(l => l.locationCode === this.partsPOData.selectedLocation);

  //     if (sellerParty.stateName === buyerParty.stateName) {
  //       this.currentItem.cgstAmt = totalGST > 0
  //         ? (((Number(this.currentItem.cgst) / totalGST) * totalGSTAmount) * qty).toFixed(2)
  //         : '0.00';

  //       this.currentItem.sgstAmt = totalGST > 0
  //         ? (((Number(this.currentItem.sgst) / totalGST) * totalGSTAmount) * qty).toFixed(2)
  //         : '0.00';
  //     } else {
  //       this.currentItem.igstAmt = totalGST > 0
  //         ? (((Number(this.currentItem.igst) / totalGST) * totalGSTAmount) * qty).toFixed(2)
  //         : '0.00';
  //     }

  //     this.currentItem.amount = Number(Number(taxDetails.basePrice) * this.currentItem.quantity).toFixed(2);
  //     this.currentItem.mrp = Number(Number(taxDetails.finalPrice) * this.currentItem.quantity).toFixed(2);

  //     // const gstData = this.calculateGSTAmount(this.currentItem.itemRate, this.taxDetails);

  //     // const qty = Number(this.currentItem.quantity || 0);
  //     // const rate = Number(this.currentItem.itemRate || 0);      

  //     // this.currentItem.mrp = qty * rate + gstData.totalGST;
  //     // this.currentItem.amount = (Number(this.currentItem.itemRate) * (this.currentItem.quantity || 0)).toFixed(2);

  //     const itemToSave = {
  //       ...this.currentItem,

  //       // sgstAmt: gstData.sgst * this.currentItem.quantity,
  //       // cgstAmt: gstData.cgst * this.currentItem.quantity,
  //       // igstAmt: gstData.igst * this.currentItem.quantity,

  //       updatedBy: this.storageService.getUserId(),
  //       updatedDate: new Date()
  //     };

  //     if (index > -1) {
  //       itemToSave.status = 'Modified';
  //       this.pagedPurchaseDetails[index] = itemToSave;
  //     } else {
  //       itemToSave.status = 'Added';

  //       itemToSave.id = this.tempIdCounter--;

  //       itemToSave.createdBy = this.storageService.getUserId();
  //       itemToSave.createdDate = new Date();

  //       this.pagedPurchaseDetails = [...this.pagedPurchaseDetails, itemToSave];
  //     }

  //     // if (this.editingIndex !== null) {
  //     //   this.pagedPurchaseDetails[this.editingIndex] = newItem;
  //     //   this.editingIndex = null;
  //     // } else {
  //     //   this.pagedPurchaseDetails.push(newItem);
  //     // }

  //     this.resetCurrentItem();
  //     // this.loadPage();
  //   }
  // }

  addPurchaseItem() {
    this.locationInvalid = !this.partsPOData.selectedLocation;
    this.transactionTypeInvalid = !this.partsPOData.transactionType;
    this.orderTypeInvalid = !this.partsPOData.subPoType;
    this.partNoInvalid = !this.currentItem.itemCode;
    this.qtyInvalid = !this.currentItem.qty || this.currentItem.qty <= 0;

    if (this.locationInvalid || this.transactionTypeInvalid || this.orderTypeInvalid || this.partNoInvalid || this.qtyInvalid) {
      return;
    }

    if (this.currentItem.qty <= 0 || this.currentItem.qty === null || this.currentItem.qty === undefined) {
      this.toaster.show('Quantity must be greater than zero.', { classname: 'bg-warning text-white', delay: 5000 });
      return;
    }

    if (this.currentItem.minOrdQty && this.currentItem.minOrdQty > 0) {

      if (this.currentItem.qty < this.currentItem.minOrdQty) {
        this.toaster.show(`Quantity must be at least ${this.currentItem.minOrdQty}.`, { classname: 'bg-warning text-white', delay: 5000 }
        );
        return;
      }

      if (this.currentItem.qty % this.currentItem.minOrdQty !== 0) {
        this.toaster.show(`Quantity must be a multiple of ${this.currentItem.minOrdQty} (e.g., ${this.currentItem.minOrdQty}, ${this.currentItem.minOrdQty * 2}, ${this.currentItem.minOrdQty * 3}).`, { classname: 'bg-warning text-white', delay: 5000 });
        return;
      }
    }

    if (this.partsPOData.isKit) {
      if (this.currentItem.qty > 1) {
        this.toaster.show('Only 1 kit can be purchased at a time.', { classname: 'bg-danger text-white', delay: 3000 });
        return;
      }

      this.loader.show();
      this.kitDetailService.getKitDetailsWithItemsByHeaderAndLocation(
        this.currentItem.itemCode,
        this.partsPOData.selectedLocation,
        this.partsPOData.partyName
      ).subscribe({
        next: (res: any) => {
          this.loader.hide();
          const details = Array.isArray(res) ? res : (res?.data || []);

          if (details.length === 0) {
            this.toaster.show('No parts found in this kit.', { classname: 'bg-warning text-dark', delay: 3000 });
            return;
          }

          const kitItems: any[] = [];
          const zeroParts: string[] = [];

          details.forEach((det: any) => {
            if (!det.itemPrice || det.itemPrice <= 0) {
              zeroParts.push(det.itemCode || 'Unknown Part');
            }

            const totalGST = det.taxDetails?.reduce((sum: number, tax: any) => sum + Number(tax.taxRate || 0), 0) || 0;
            const gstPrice = this.calculateGST(det.itemPrice, totalGST);
            const gstData = this.calculateGSTAmount(det.itemPrice, det.taxDetails);

            const sgstAmt = gstData.sgst * det.quantity;
            const cgstAmt = gstData.cgst * det.quantity;
            const igstAmt = gstData.igst * det.quantity;
            const amount = Number(gstPrice.basePrice) * Number(det.quantity);

            kitItems.push({
              itemCode: det.itemCode,
              itemDescription: det.itemDescription,
              qty: det.quantity,
              rate: gstPrice.basePrice,
              mrp: det.itemPrice * det.quantity,
              sgstAmt: sgstAmt,
              cgstAmt: cgstAmt,
              igstAmt: igstAmt,
              amount: amount,
              itemType: det.item?.itemtype || 1,
              fromKit: true
            });
          });

          if (zeroParts.length > 0) {
            this.toaster.show(`Rate is 0 for: ${zeroParts.join(', ')}. Kit not added.`, { classname: 'bg-danger text-white', delay: 6000 });
            return;
          }

          kitItems.forEach(k => this.purchaseDetails.push(k));

          this.resetCurrentItem();
          this.loadPage();
        },
        error: (err) => {
          this.loader.hide();
          console.error('Error expanding kit:', err);
          this.toaster.show('Error loading kit details.', { classname: 'bg-danger text-white', delay: 3000 });
        }
      });
    }

    else {
      if (this.currentItem.itemId <= 0) {
        this.toaster.show('Please select an item to add.', { classname: 'bg-warning text-white', delay: 5000 });
        return;
      }

      const selectedItem = this.itemList.find(item => item.itemcode === this.currentItem.itemCode);
      if (!selectedItem) {
        this.toaster.show('Selected item details not found in inventory.', { classname: 'bg-danger text-white', delay: 5000 });
        return;
      }

      const existingIndex = this.purchaseDetails.findIndex(x => x.itemCode === this.currentItem.itemCode && x.status !== 'Deleted');
      if (existingIndex > -1 && !this.currentItem.isEdit) {
        this.toaster.show('Part already exists.', { classname: 'bg-warning text-white', delay: 5000 });
        return;
      }

      const totalGST = Number(this.currentItem.cgst || 0) + Number(this.currentItem.sgst || 0);
      const taxDetails = this.calculateGST(Number(selectedItem.dlrprice || 0), totalGST);
      const totalGSTAmount = Number(taxDetails.gstAmount || 0);
      const qty = Number(this.currentItem.qty || 0);

      const sellerParty = this.ledgerList.find(l => l.ledgerCode === this.partsPOData.partyName);
      const buyerParty = this.locationList.find(l => l.loccode === this.partsPOData.selectedLocation);

      this.currentItem.cgstAmt = '0.00';
      this.currentItem.sgstAmt = '0.00';
      this.currentItem.igstAmt = '0.00';

      if (sellerParty?.stateName && buyerParty?.state && sellerParty.stateName.trim().toLowerCase() === buyerParty.state.trim().toLowerCase()) {
        this.currentItem.cgstAmt = totalGST > 0 ? (((Number(this.currentItem.cgst) / totalGST) * totalGSTAmount) * qty).toFixed(2) : '0.00';
        this.currentItem.sgstAmt = totalGST > 0 ? (((Number(this.currentItem.sgst) / totalGST) * totalGSTAmount) * qty).toFixed(2) : '0.00';
      } else {
        const igstRate = Number(this.currentItem.igst || totalGST);
        this.currentItem.igstAmt = igstRate > 0 ? (((igstRate / (igstRate || 1)) * totalGSTAmount) * qty).toFixed(2) : '0.00';
      }

      this.currentItem.amount = (Number(taxDetails.basePrice || 0) * qty).toFixed(2);
      this.currentItem.mrp = (Number(taxDetails.finalPrice || 0) * qty).toFixed(2);

      const itemToSave = {
        ...this.currentItem,
        updatedBy: this.storageService.getUserId(),
        updatedDate: new Date()
      };

      if (existingIndex > -1) {
        itemToSave.status = 'Modified';
        this.purchaseDetails[existingIndex] = itemToSave;
      } else {
        itemToSave.status = 'Added';
        itemToSave.id = this.tempIdCounter--;
        itemToSave.createdBy = this.storageService.getUserId();
        itemToSave.createdDate = new Date();
        this.purchaseDetails.push(itemToSave);
      }

      this.resetCurrentItem();
      this.loadPage();
    }
  }

  resetCurrentItem() {
    this.currentItem = {
      id: 0,
      itemId: null,
      itemCode: null,
      itemDescription: '',
      qty: 0,
      rate: '',

      mrp: '',
      amount: '',
      taxableAmount: 0,

      sgstAmt: '',
      cgstAmt: '',
      igstAmt: '',

      cgst: '',
      sgst: '',
      igst: '',

      itemType: 1,
      currentStock: 0,

      status: '',
      createdBy: '',
      createdDate: new Date(),
      updatedBy: null,
      updatedDate: null,
      isEdit: false,
      minOrdQty: 0,
    };
    // this.editingIndex = null;
  }

  loadPage() {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagedPurchaseDetails = this.purchaseDetails.slice(start, end);
  }

  refreshPage() {
    this.loadPage();
  }

  editItem(index: number) {
    const actualIndex = (this.page - 1) * this.pageSize + index;
    const item = this.purchaseDetails[actualIndex];
    // this.editingIndex = actualIndex;
    this.currentItem = { ...item };
  }

  deleteItem(index: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        const actualIndex = (this.page - 1) * this.pageSize + index;
        this.purchaseDetails.splice(actualIndex, 1);
        this.loadPage();
      }
    });
  }

  // ── Grid totals (used by the Total row in the table) ──────────────────────
  get totalQty(): number {
    return this.pagedPurchaseDetails.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }

  get totalSgst(): number {
    return this.pagedPurchaseDetails.reduce((sum, item) => sum + (Number(item.sgstAmt) || 0), 0);
  }

  get totalCgst(): number {
    return this.pagedPurchaseDetails.reduce((sum, item) => sum + (Number(item.cgstAmt) || 0), 0);
  }

  get totalIgst(): number {
    return this.pagedPurchaseDetails.reduce((sum, item) => sum + (Number(item.igstAmt) || 0), 0);
  }

  get totalAmount(): number {
    return this.pagedPurchaseDetails.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }
  // ───────────────────────────────────────────────────────────────────────────

  onSave() {
    if (this.partsPOData.subPoType === "VOR" && !this.jobId) {
      this.toaster.show('Please select a Job Card for VOR orders.', { classname: 'bg-danger text-white', delay: 5000 });
      return;
    }

    if (this.isSaving) return;
    this.isSaving = true;
    this.loader.show();

    const matchedLocation = this.locationList.find(x => x.loccode === this.partsPOData.selectedLocation);
    let dealerCode = matchedLocation?.dealercode;

    const userId = this.storageService.getUserId();
    // PONumber is Prefix + OrderNo logic can be added later if needed. For now using orderNo.
    const poModel = {
      PONumber: this.partsPOData.prefixNo,
      PODate: this.partsPOData.poDate,
      POType: this.partsPOData.poType,
      subOrderType: this.partsPOData.subPoType,
      CustomerCode: dealerCode,
      TransactionType: this.partsPOData.transactionType,
      LocCode: this.partsPOData.selectedLocation,
      LedgerCode: this.partsPOData.partyName,
      IsAgainstKit: this.partsPOData.isKit,
      jobId: this.jobId,
      createdBy: userId,
      createdDate: new Date(),
      Items: this.partsPOData.isKit
        ? this.purchaseDetails.map((item: any) => ({
          ItemCode: item.itemCode,
          Qty: item.qty
        }))
        : this.pagedPurchaseDetails.map((item: any) => ({
          ItemCode: item.itemCode,
          Qty: item.qty
        }))
    };

    if (this.isEdit) {
      this.purchaseService.updatePO(poModel).subscribe({
        next: (res) => {
          this.loader.hide();
          this.isSaving = false;
          if (res.success) {
            this.toaster.show(res.message, { classname: 'bg-success text-white', delay: 5000 });
            this.redirectToPOList();
          } else {
            this.toaster.show(res.message, { classname: 'bg-danger text-white', delay: 5000 });
          }
        },
        error: (err) => {
          this.loader.hide();
          this.isSaving = false;
          this.toaster.show('Error saving Parts PO.', { classname: 'bg-danger text-white', delay: 5000 });
        }
      });
    } else {
      this.purchaseService.createPurchaseOrder(poModel).subscribe({
        next: (res) => {
          this.loader.hide();
          this.isSaving = false;
          if (res.success) {
            this.toaster.show(res.message, { classname: 'bg-success text-white', delay: 5000 });
            this.redirectToPOList();
          } else {
            this.toaster.show(res.message, { classname: 'bg-danger text-white', delay: 5000 });
          }
        },
        error: (err) => {
          this.loader.hide();
          this.isSaving = false;
          this.toaster.show('Error saving Parts PO.', { classname: 'bg-danger text-white', delay: 5000 });
        }
      });
    }
  }

  onSubmitToERP() {
    this.loader.show();
    const _erpObject = {
      soHeader: {
        CustomerCode: this.partsPOData.customerCode || '',
        ConsigneeCode: this.partsPOData.selectedLocation,
        TestCertificate: '',
        RefNo: this.partsPOData.prefixNo,
        // ordrtype: this.partsPOData.poType,
        ordrtype: 'SP',
        pordr_type: this.partsPOData.subPoType === 'SSOMSO' ? 'SSO' : this.partsPOData.subPoType,
        Amount: this.totalAmount.toFixed(2),
        pordrdate: this.partsPOData.poDate,
        transType: this.partsPOData.transactionType,
        FameIIFlag: '',
      },
      soLine: this.pagedPurchaseDetails.map((item) => ({
        ItemName: item.itemCode,
        modlname: item.itemCode,
        descriptions: item.itemDescription,
        Unit: 'NOS',
        Qty: item.qty,
        itemmodelname: item.itemCode,
        colridno: 0,
        colrcode: '',
        dmspordridno: '1111',
        poid: 1111
      }))
    };

    this.purchaseService.sendToERP(_erpObject).subscribe({
      next: (res: any) => {
        this.loader.hide();

        this.isSubmitted = res.Succeed; // Disable button after success

        // const match = res?.ConfirmMessage?.match(/SO No\.\s*([A-Za-z0-9/-]+)/);
        // const salesOrderNo = match ? match[1] : '';
        if (res.Succeed) {
          const salesOrderNo = res.ReturnValue.SOId;
          this.updatePOStatus(this.partsPOData.prefixNo, res.Succeed, salesOrderNo, this.partsPOData.selectedLocation);
          this.toaster.show('Submit to ERP successful!', { classname: 'bg-success text-white', delay: 5000 });
        } else {
          this.toaster.show('Submit to ERP failed!', { classname: 'bg-warning text-white', delay: 5000 });
        }
      },
      error: (err) => {
        this.loader.hide();
        console.error('Error submitting to ERP:', err);
        this.toaster.show('An error occurred while submitting to ERP: ' + (err.error?.message || err.message), { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  calculateGST(finalPrice: number, totalGST: number = 0) {

    const ratio = (100 + totalGST) / 100;

    const basePrice = finalPrice / ratio;

    const gstAmount = finalPrice - basePrice;

    return {
      basePrice: basePrice.toFixed(2),
      gstAmount: gstAmount.toFixed(2),
      finalPrice: finalPrice.toFixed(2),
      totalGST: totalGST.toFixed(2)
    };
  }

  calculateGSTAmount(amount: number, taxDetails: any) {

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    for (const tax of taxDetails) {

      const rate = Number(tax.taxRate || 0);
      const taxAmount = (amount * rate) / 100;

      if (tax.taxCode?.includes('CGST')) {
        cgst += taxAmount;
      }
      else if (tax.taxCode?.includes('SGST')) {
        sgst += taxAmount;
      }
      else if (tax.taxCode?.includes('IGST')) {
        igst += taxAmount;
      }
    }

    const totalGST = cgst + sgst + igst;

    return {
      cgst: +cgst.toFixed(2),
      sgst: +sgst.toFixed(2),
      igst: +igst.toFixed(2),
      totalGST: +totalGST.toFixed(2),
      grandTotal: +(Number(amount) + totalGST).toFixed(2)
    };
  }

  getDetailsByPONumber() {
    this.loader.show();
    this.purchaseService.getPOByNumber(this.poNumber).subscribe({
      next: (res) => {
        this.loader.hide();
        this.partsPOData = {
          id: res.id,
          poDate: res.poDate,
          selectedLocation: res.locCode,
          prefixNo: res.poNumber,
          orderNo: res.poNumber.split('/').pop(),
          subPoType: res.subOrderType,
          transactionType: res.transactionType,
          isKit: res.isAgainstKit,
          partyName: res.ledgerCode,
          poType: 'Spares',
          customerCode: res.customerCode
        }

        this.isSubmitted = res.isSubmitted;

        const mappedData = res.items.map((item: any) => {

          const totalGST = item.taxes.reduce(
            (sum, tax) => sum + Number(tax.taxRate || 0), 0
          );

          const gstPrice = this.calculateGST(item.rate, totalGST);
          const gstData = this.calculateGSTAmount(item.rate, item.taxes);

          return {
            id: item.lineNumber,
            itemCode: item.itemCode,
            itemDescription: item.itemDescription,
            qty: item.qty,
            rate: gstPrice.basePrice,
            mrp: item.rate,
            amount: Number(gstPrice.basePrice) * Number(item.qty),
            sgstAmt: gstData.sgst * item.qty,
            cgstAmt: gstData.cgst * item.qty,
            igstAmt: gstData.igst * item.qty,
            rawSgstRate: 0,
            rawCgstRate: 0,
            rawIgstRate: 0,
            itemType: 1,
            currentStock: 0
          };
        });

        if (res.isAgainstKit) {
          this.purchaseDetails = _.cloneDeep(mappedData);
          this.loadPage();
        } else {
          this.pagedPurchaseDetails = mappedData;
        }
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  updatePOStatus(orderNo: string, isSubmitted: boolean, saleOrderNo: string, consigneeCode: string) {
    this.purchaseService.updatePOStatus(orderNo, isSubmitted, saleOrderNo, consigneeCode).subscribe({
      next: (updateRes) => {
        this.redirectToPOList();
      },
      error: (updateErr) => {
        console.error('Error updating PO status after ERP submission:', updateErr);
      }
    });
  }

  redirectToPOList() {
    this.router.navigate(['/parts-po-list']);
  }

  openJobSearchDialog() {
    const modalRef = this.modalService.open(JobSearch, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.result.then(
      (result) => {
        if (result && result.isAccepted) {
          this.jobId = result.jobDetail.id;
        }
      },
      (reason) => {
      }
    );
  }

  customSearchFn(term: string, item: any): boolean {
    term = term.toLowerCase();

    return item.itemcode?.toLowerCase().includes(term) ||
      item.itemdesc?.toLowerCase().includes(term);
  }

  onLocationChange(event: any) {
    if (event) {
      const dealerCode = this.locationList.filter(x => x.loccode === event.target.value)[0].dealercode;
      this.generateNewOrderNo(dealerCode);
    }
    // Refresh calculations for the current item if a model is already selected
    // if (this.currentItem.modelNo) {
    //   this.calculateRowTotals();
    // }
  }

  getPreviousPurchaseDetails(event: any) {
    const dealerCode = this.locationList.filter(x => x.loccode === this.partsPOData.selectedLocation)[0].dealercode;
    this.purchaseService.getItemDetailsByItemCode(this.currentItem.itemCode, dealerCode).subscribe({
      next: (res) => {
        if (res) {
          this.previousPurchaseDetails = res;
        }
      },
      error: (err) => {
        console.error('Error fetching previous part:', err);
      }
    });
  }

}