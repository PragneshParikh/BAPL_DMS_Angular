import { Component, OnInit } from '@angular/core';
import { LocationMasterService } from '../../core/services/location-master-service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { StorageService } from '../../core/services/storage';
import { ItemMasterService } from '../../core/services/item-master-service';
import { KitCreationService } from '../../core/services/kit-creation.service';
import { KitDetailService } from '../../core/services/kit-detail-service';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { TRANSACTION_TYPES } from '../../constant';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import { JobCardService } from '../../core/services/job-card-service';
import Swal from 'sweetalert2';
import { PrefixService } from '../../core/services/prefix';
import { TaxService } from '../../core/services/tax';
import { PurchaseService } from '../../core/services/purchase-service';
import { LedgerMaster } from '../../core/services/ledger-master';

@Component({
  selector: 'app-parts-po',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgbPaginationModule],
  templateUrl: './parts-po.html',
  styleUrl: './parts-po.scss',
})
export class PartsPo implements OnInit {
  locationList: any[] = [];
  // selectedLocation: string = '';

  itemList: any[] = [];
  kitList: any[] = [];
  purchaseDetails: any[] = [];
  pagedPurchaseDetails: any[] = [];
  page = 1;
  pageSize = 5;

  // Purchase Info fields (Prefix and OrderNo are UI-only for now)
  // prefixNo: string = '';
  // orderNo: string = '';
  // poDate: string = new Date().toISOString();
  // remarks: string = '';
  // poType: string = 'Spares';
  // subPoType: string = '';
  isSubmitted: boolean = false;
  isSaving: boolean = false;
  // partyName: string = 'BGAUSS AUTO PRIVATE LIMITED';
  // isGst: boolean = true;
  // isKit: boolean = false;
  poNumber: string = '';
  // totalAmt: number = 0;
  // editingIndex: number | null = null;
  transactionTypeList = TRANSACTION_TYPES;
  // selectedTransactionType: string = '';

  locationInvalid: boolean = false;
  transactionTypeInvalid: boolean = false;
  partNoInvalid: boolean = false;
  qtyInvalid: boolean = false;
  orderTypeInvalid: boolean = false;

  jobCardList: any[] = [];
  activeJobCards: any[] = [];
  vorDetails: any = {
    jobNo: '',
    chassisNo: '',
    registerNo: '',
    engineNo: '',
    jobType: '',
    serviceHead: '',
    serviceType: '',
    partyName: '',
    mobileNo: '',
    modelNo: ''
  };

  currentItem: any = {
    id: 0,
    partNo: '',
    description: '',
    quantity: 0,
    rate: 0,
    mrp: 0,
    amount: 0,
    taxableAmount: 0,
    sgstAmt: 0,
    cgstAmt: 0,
    igstAmt: 0,
    rawSgstRate: 0,
    rawCgstRate: 0,
    rawIgstRate: 0,
    itemType: 1,
    currentStock: 0
  };

  partsPOData: any = {
    poDate: new Date().toISOString(),
    selectedLocation: '',
    prefixNo: '',
    orderNo: '',
    subPoType: 'VOR',
    transactionType: 'B2C',
    isKit: false,
    partyName: '',
    poType: 'Spares'
  }

  dealerCode: string = '';
  private tempIdCounter = -1;
  taxDetails: any[] = [];
  isEdit: boolean = false;
  ledgerList: any[] = [];

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
    private taxService: TaxService,
    private ledgerService: LedgerMaster
  ) {
    this.dealerCode = this.storageService.getDealerCode();
  }

  async ngOnInit() {
    this.loadShowroomLocations();
    this.getItemList();
    this.loadKitList();
    this.loadJobCards();
    await this.getPartyName();

    // this.route.params.subscribe(params => {

    //   const encodedPo = params['ponumber'];

    //   this.poNumber = encodedPo ? atob(encodedPo) : '0';

    //   if (this.poNumber !== '0') {
    //     this.isEdit = true;
    //     this.getDetailsByPONumber();
    //   } else {
    //     this.isEdit = false;
    //     this.generateNewOrderNo();
    //   }
    // });

    this.route.params.subscribe(params => {

      const encPO = params['ponumber'];
      const decoded = atob(encPO);

      this.poNumber = decoded.split('|')[1];

      if (this.poNumber && this.poNumber !== '0') {
        this.isEdit = true;
        this.getDetailsByPONumber();
      } else {
        this.isEdit = false;
        this.generateNewOrderNo();
      }

    });

  }

  generateNewOrderNo() {
    // this.orderNo = '1';
    this.loader.show();
    this.prefixService.getPrefixByDealerByModule(this.dealerCode, 'purchase_order').subscribe({
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

  // loadShowroomLocations() {
  //   const dealerCode = this.storageService.getDealerCode();
  //   this.locationService.getAllLocationMaster().subscribe({
  //     next: (allLocs: any[]) => {
  //       const fullLocationMap = Array.isArray(allLocs) ? allLocs : [];
  //       this.locationService.getLocationByDealerCode(dealerCode).subscribe({
  //         next: (res: any) => {
  //           const dealerLocs = Array.isArray(res) ? res : [];
  //           this.locationList = dealerLocs.map(loc => {
  //             const matchedLoc = fullLocationMap.find(m =>
  //               (m.locname || '').trim().toLowerCase() === (loc.locname || '').trim().toLowerCase()
  //             );
  //             return {
  //               ...loc,
  //               state: matchedLoc?.state || matchedLoc?.State || loc.state || loc.State || ''
  //             };
  //           });
  //           if (this.locationList.length > 0 && !this.selectedLocation) {
  //             this.selectedLocation = this.locationList[0].locname;
  //           }
  //         }
  //       });
  //     }
  //   });
  // }
  loadShowroomLocations() {
    this.loader.show();
    this.locationService.getLocationByDealerCodeAndAreaId(this.dealerCode, 2).subscribe({
      next: (res: any) => {
        this.locationList = res;
        if (this.locationList && this.locationList.length > 0) {
          this.partsPOData.selectedLocation = this.locationList[0].loccode;
        }
      },
      error: (err) => {
        this.loader.hide();
        console.log(err);
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

  onLocationChange() {
    this.locationInvalid = false;
    this.calculateRowTotals();
  }

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

  onJobNoChange() {
    if (!this.vorDetails.jobNo) {
      this.resetVorDetails();
      return;
    }

    const job = this.activeJobCards.find(j =>
      (j.jobCardHeader?.jobNo || '').toString().trim() === this.vorDetails.jobNo.toString().trim()
    );

    if (job) {
      this.vorDetails = {
        jobNo: job.jobCardHeader?.jobNo,
        chassisNo: job.jobCardCustomer?.chassisNo || '',
        registerNo: job.jobCardCustomer?.registerNo || '',
        engineNo: job.jobCardCustomer?.engineNo || '',
        jobType: job.jobtype || '',
        serviceHead: job.serviceHead || '',
        serviceType: job.serviceType || '',
        partyName: job.jobCardCustomer?.customerName || '',
        mobileNo: job.jobCardCustomer?.customerMobile || '',
        modelNo: job.jobCardCustomer?.modelName || ''
      };
    } else {
      // Keep JobNo but clear other fields if not found in active list
      const currentNo = this.vorDetails.jobNo;
      this.resetVorDetails();
      this.vorDetails.jobNo = currentNo;
    }
  }

  resetVorDetails() {
    this.vorDetails = {
      jobNo: '',
      chassisNo: '',
      registerNo: '',
      engineNo: '',
      jobType: '',
      serviceHead: '',
      serviceType: '',
      partyName: '',
      mobileNo: '',
      modelNo: ''
    };
  }

  // loadItemMasterList() {
  //   // For Parts, grpidno is 1, itemType is 2
  //   this.itemService.getItems(1, '', 2).subscribe({
  //     next: (res: any[]) => {
  //       this.modelList = Array.isArray(res) ? res : [];
  //     },
  //     error: (err) => console.error('Error loading item master:', err)
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

  onModelChange() {
    this.partNoInvalid = false;
    if (!this.currentItem.partNo) {
      this.resetCurrentItem();
      return;
    }

    if (this.partsPOData.isKit) {
      const selectedKit = this.kitList.find(k => k.id === Number(this.currentItem.partNo) || k.kitName === this.currentItem.partNo);
      if (selectedKit) {
        this.currentItem.itemdesc = selectedKit.kitName || '';
        this.currentItem.quantity = 1; // Default kit qty to 1

        this.loader.show();
        this.kitDetailService.getKitDetailsByKitHeaderId(this.currentItem.partNo).subscribe({
          next: (res: any) => {
            this.loader.hide();
            const details = Array.isArray(res) ? res : (res?.data || []);
            let totalRate = 0;

            details.forEach((det: any) => {
              const qty = det.quantity || 0;
              let rate = det.item?.ipurrate || det.rate || 0;

              // Fallback to Item Master if rate is missing
              if (!rate || rate === 0) {
                const itemCode = det.item?.itemcode || det.itemcode || det.itemName;
                const masterItem = this.itemList.find(m =>
                  m.id === det.itemId ||
                  (m.itemcode || '').trim().toUpperCase() === (itemCode || '').trim().toUpperCase()
                );
                if (masterItem) {
                  rate = Number(masterItem.ipurrate || masterItem.Ipurrate || 0);
                }
              }

              totalRate += (qty * rate);
            });

            this.currentItem.rate = totalRate;
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

    // this.itemmasterService.getPurchaseDetailsWithHsnTaxByModelNo(this.currentItem.partNo).subscribe({
    //   next: (res: any) => {
    //     this.loader.hide();
    //     if (res) {
    //       const getVal = (obj: any, ...keys: string[]) => {
    //         for (const key of keys) {
    //           if (obj[key] !== undefined && obj[key] !== null) return obj[key];
    //         }
    //         return 0;
    //       };

    //       this.currentItem.description = res.itemdesc || res.itemDesc || res.Itemdesc || res.Itemname || '';
    //       this.currentItem.rawSgstRate = getVal(res, 'Sgst', 'sgst', 'SGST');
    //       this.currentItem.rawCgstRate = getVal(res, 'Cgst', 'cgst', 'CGST');
    //       this.currentItem.rawIgstRate = getVal(res, 'Igst', 'igst', 'IGST');
    //       this.currentItem.rate = getVal(res, 'Ipurrate', 'ipurrate', 'IPURRATE', 'rate');
    //       this.currentItem.mrp = 0;
    //       this.currentItem.itemType = res.itemtype || res.itemType || 1;

    //       // ── Fallback: if HSN lookup returned 0 rates, use rates stored
    //       //    directly on the ItemMaster record (already in modelList) ─────────
    //       const allZero = !this.currentItem.rawSgstRate &&
    //         !this.currentItem.rawCgstRate &&
    //         !this.currentItem.rawIgstRate;
    //       if (allZero) {
    //         const masterItem = this.modelList.find(m =>
    //           (m.itemcode || '').trim().toUpperCase() === (this.currentItem.partNo || '').trim().toUpperCase()
    //         );
    //         if (masterItem) {
    //           this.currentItem.rawSgstRate = Number(masterItem.sgst ?? masterItem.Sgst ?? 0);
    //           this.currentItem.rawCgstRate = Number(masterItem.cgst ?? masterItem.Cgst ?? 0);
    //           this.currentItem.rawIgstRate = Number(masterItem.igst ?? masterItem.Igst ?? 0);
    //         }
    //       }
    //       // ─────────────────────────────────────────────────────────────────────

    //       this.calculateRowTotals();
    //     }
    //   },
    //   error: (err) => {
    //     this.loader.hide();
    //     // On API error, still try to load from modelList
    //     const masterItem = this.modelList.find(m =>
    //       (m.itemcode || '').trim().toUpperCase() === (this.currentItem.partNo || '').trim().toUpperCase()
    //     );
    //     if (masterItem) {
    //       this.currentItem.description = masterItem.itemdesc || masterItem.itemname || '';
    //       this.currentItem.rawSgstRate = Number(masterItem.sgst ?? masterItem.Sgst ?? 0);
    //       this.currentItem.rawCgstRate = Number(masterItem.cgst ?? masterItem.Cgst ?? 0);
    //       this.currentItem.rawIgstRate = Number(masterItem.igst ?? masterItem.Igst ?? 0);
    //       this.currentItem.rate = Number(masterItem.ipurrate ?? masterItem.Ipurrate ?? 0);
    //       this.calculateRowTotals();
    //     }
    //   }
    // });
    const selectedItem = this.itemList.find(item => item.itemcode === this.currentItem.partNo);
    if (selectedItem) {
      this.loader.show();
      this.taxService.getTaxList(selectedItem.itemcode.toString(), this.partsPOData.selectedLocation, '').subscribe({
        next: (res) => {
          this.loader.hide();
          this.taxDetails = res;
          const totalGST = res.reduce(
            (sum, tax) => sum + Number(tax.taxRate || 0), 0
          );

          const taxDetails = this.calculateGST(Number(selectedItem.dlrprice), totalGST);

          this.currentItem.itemdesc = selectedItem.itemdesc;
          this.currentItem.itemname = selectedItem.itemname;
          this.currentItem.itemId = selectedItem.id;
          this.currentItem.itemRate = Number(taxDetails.basePrice).toFixed(2);
          this.currentItem.currentStock = selectedItem.batchClosingQty;
        },
        error: (err) => {
          this.loader.hide();
          console.error(err);
          this.toaster.show('Failed to fetch tax details. Please try again later.', { classname: 'bg-danger text-light' });
        }
      });
    }

  }

  // onBlurQuantity(args: any) {
  //   let value = Number(args.target.value);
  //   if (value > 0) {
  //     const _item = this.itemList.find(x => x.id === Number(this.currentItem.itemId));

  //     // if (_item.batchClosingQty < value) {
  //     //   this.toaster.show(`Stock limit exceeded. Please reduce the quantity.`, { classname: 'bg-warning text-white', delay: 5000 });
  //     //   return;
  //     // }

  //     // let rate = _item ? _item.custprice : 0;
  //     // this.newItem.mrp = Number((rate || 0) * (this.currentItem.quantity || 0)).toFixed(2);
  //     // this.newItem.amount = (Number(this.currentItem.itemRate) * (this.currentItem.quantity || 0)).toFixed(2);
  //   }
  // }

  calculateRowTotals() {
    let qty = Number(this.currentItem.quantity) || 0;
    let rate = Number(this.currentItem.rate) || 0;

    let taxableAmount = (qty * rate);
    this.currentItem.taxableAmount = taxableAmount > 0 ? taxableAmount : 0;

    // const dealerLoc = this.locationList.find(l =>
    //   ((l.locname || '').trim().toLowerCase()) ===
    //   ((this.selectedLocation || '').trim().toLowerCase())
    // ) || (this.locationList.length > 0 ? this.locationList[0] : null);

    // const locState = (dealerLoc?.state || dealerLoc?.State || '').trim();

    // const rawSgstRate = Number(this.currentItem.rawSgstRate) || 0;
    // const rawCgstRate = Number(this.currentItem.rawCgstRate) || 0;
    // const rawIgstRate = Number(this.currentItem.rawIgstRate) || 0;

    // Determine interstate/local — mirrors vehicle-po logic exactly
    // let isInterstate = locState ? locState.toLowerCase() !== 'maharashtra' : false;

    // if (this.selectedTransactionType === 'I') {
    //   isInterstate = true;
    // } else if (this.selectedTransactionType === 'L') {
    //   isInterstate = false;
    // } else if (rawIgstRate > 0 && (rawSgstRate === 0 && rawCgstRate === 0)) {
    //   // Only IGST available on the item — treat as interstate
    //   isInterstate = true;
    // }

    // if (isInterstate) {
    //   this.currentItem.sgstAmt = 0;
    //   this.currentItem.cgstAmt = 0;
    //   this.currentItem.igstAmt = (this.currentItem.taxableAmount * rawIgstRate) / 100;

    //   // Fallback: if IGST rate is 0 but we have local rates, use their sum as IGST
    //   if (this.currentItem.igstAmt === 0 && (rawSgstRate + rawCgstRate) > 0) {
    //     this.currentItem.igstAmt = (this.currentItem.taxableAmount * (rawSgstRate + rawCgstRate)) / 100;
    //   }
    // } else {
    //   this.currentItem.sgstAmt = (this.currentItem.taxableAmount * rawSgstRate) / 100;
    //   this.currentItem.cgstAmt = (this.currentItem.taxableAmount * rawCgstRate) / 100;
    //   this.currentItem.igstAmt = 0;

    //   // Fallback: if only IGST rate is defined, split it equally as SGST+CGST
    //   if (this.currentItem.sgstAmt === 0 && this.currentItem.cgstAmt === 0 && rawIgstRate > 0) {
    //     const halfIgst = rawIgstRate / 2;
    //     this.currentItem.sgstAmt = (this.currentItem.taxableAmount * halfIgst) / 100;
    //     this.currentItem.cgstAmt = (this.currentItem.taxableAmount * halfIgst) / 100;
    //   }
    // }

    this.currentItem.amount = this.currentItem.taxableAmount + this.currentItem.sgstAmt + this.currentItem.cgstAmt + this.currentItem.igstAmt;

    // Reset validation flags
    if (this.currentItem.quantity > 0) this.qtyInvalid = false;
    if (this.partsPOData.transactionType) this.transactionTypeInvalid = false;
  }

  addPurchaseItem() {
    this.locationInvalid = !this.partsPOData.selectedLocation;
    this.transactionTypeInvalid = !this.partsPOData.transactionType;
    this.orderTypeInvalid = !this.partsPOData.subPoType;

    this.partNoInvalid = !this.currentItem.partNo;
    this.qtyInvalid = !this.currentItem.quantity || this.currentItem.quantity <= 0;

    if (this.locationInvalid || this.transactionTypeInvalid || this.orderTypeInvalid || this.partNoInvalid || this.qtyInvalid) {
      return;
    }

    if (this.partsPOData.isKit) {
      if (this.currentItem.quantity > 1) {
        this.toaster.show('Only 1 kit can be purchased at a time.', { classname: 'bg-danger text-white', delay: 3000 });
        return;
      }

      // Fetch kit details and expand them
      this.loader.show();
      this.kitDetailService.getKitDetailsByKitHeaderId(this.currentItem.partNo).subscribe({
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
            const rawSgst = det.item?.sgst || 0;
            const rawCgst = det.item?.cgst || 0;
            const rawIgst = det.item?.igst || 0;
            const qty = det.quantity || 0;

            let rate = det.item?.ipurrate || det.rate || 0;
            // Fallback to Item Master if rate is missing
            if (!rate || rate === 0) {
              const itemCode = det.item?.itemcode || det.itemcode || det.itemName;
              const masterItem = this.itemList.find(m =>
                m.id === det.itemId ||
                (m.itemcode || '').trim().toUpperCase() === (itemCode || '').trim().toUpperCase()
              );
              if (masterItem) {
                rate = Number(masterItem.ipurrate || masterItem.Ipurrate || 0);
              }
            }

            const partDesc = det.itemDescription || det.item?.itemdesc || det.itemName || 'Unknown';

            // Collect parts with zero rate for validation
            if (!rate || rate === 0) {
              zeroParts.push(partDesc);
            }

            const taxable = qty * rate;

            // Determine interstate flag from selected location/transaction type
            const dealerLoc = this.locationList.find(l =>
              ((l.locname || '').trim().toLowerCase()) ===
              ((this.partsPOData.selectedLocation || '').trim().toLowerCase())
            ) || (this.locationList.length > 0 ? this.locationList[0] : null);
            const locState = (dealerLoc?.state || dealerLoc?.State || '').trim();
            // let isInterstate = locState ? locState.toLowerCase() !== 'maharashtra' : false;
            // if (this.selectedTransactionType === 'I') isInterstate = true;
            // else if (this.selectedTransactionType === 'L') isInterstate = false;
            // else if (rawIgst > 0 && rawSgst === 0 && rawCgst === 0) isInterstate = true;

            let sgstAmt = 0, cgstAmt = 0, igstAmt = 0;
            // if (isInterstate) {
            //   igstAmt = (taxable * rawIgst) / 100;
            //   if (igstAmt === 0 && (rawSgst + rawCgst) > 0) igstAmt = (taxable * (rawSgst + rawCgst)) / 100;
            // } else {
            //   sgstAmt = (taxable * rawSgst) / 100;
            //   cgstAmt = (taxable * rawCgst) / 100;
            //   if (sgstAmt === 0 && cgstAmt === 0 && rawIgst > 0) {
            //     sgstAmt = (taxable * rawIgst / 2) / 100;
            //     cgstAmt = (taxable * rawIgst / 2) / 100;
            //   }
            // }

            kitItems.push({
              partNo: det.itemName || det.item?.itemcode || det.itemcode || det.itemId,
              description: partDesc,
              qty: qty,
              rate: rate,
              mrp: det.item?.mrp || 0,
              taxableAmount: taxable,
              sgstAmt: sgstAmt,
              cgstAmt: cgstAmt,
              igstAmt: igstAmt,
              amount: taxable + sgstAmt + cgstAmt + igstAmt,
              rawSgstRate: rawSgst,
              rawCgstRate: rawCgst,
              rawIgstRate: rawIgst,
              itemType: det.item?.itemtype || 1,
              fromKit: true
            });
          });

          // Block if any kit item has zero rate
          if (zeroParts.length > 0) {
            this.toaster.show(`Rate is 0 for: ${zeroParts.join(', ')}. Kit not added.`, { classname: 'bg-danger text-white', delay: 6000 });
            return;
          }

          kitItems.forEach(k => this.purchaseDetails.push(k));

          this.resetCurrentItem();
          this.loadPage();
          this.toaster.show('Kit expanded successfully.', { classname: 'bg-success text-white', delay: 3000 });
        },
        error: (err) => {
          this.loader.hide();
          console.error('Error expanding kit:', err);
          this.toaster.show('Error loading kit details.', { classname: 'bg-danger text-white', delay: 3000 });
        }
      });
    } else {
      // Standard Part Addition
      // const isDuplicate = this.purchaseDetails.some((item, index) =>
      //   item.partNo === this.currentItem.partNo && index !== this.editingIndex
      // );

      // if (isDuplicate) {
      //   this.toaster.show(`Part "${this.currentItem.description}" is already added.`, { classname: 'bg-danger text-white', delay: 5000 });
      //   return;
      // }

      // Attempt to set a fallback description if still empty
      if (!this.currentItem.itemdesc) {
        const fallbackModel = this.itemList.find(m => m.itemcode === this.currentItem.partNo);
        if (fallbackModel) {
          this.currentItem.itemdesc = fallbackModel.itemdesc || fallbackModel.itemname || fallbackModel.Itemname || fallbackModel.itemdesc || '';
        }
      }

      // this.calculateRowTotals();

      // const newItem = { ...this.currentItem };

      let index = this.pagedPurchaseDetails.findIndex(x => x.id === this.currentItem.id);

      const gstData = this.calculateGSTAmount(this.currentItem.itemRate, this.taxDetails);

      const qty = Number(this.currentItem.quantity || 0);
      const rate = Number(this.currentItem.itemRate || 0);

      this.currentItem.mrp = qty * rate + gstData.totalGST;
      this.currentItem.amount = (Number(this.currentItem.itemRate) * (this.currentItem.quantity || 0)).toFixed(2);

      const itemToSave = {
        ...this.currentItem,

        sgstAmt: gstData.sgst * this.currentItem.quantity,
        cgstAmt: gstData.cgst * this.currentItem.quantity,
        igstAmt: gstData.igst * this.currentItem.quantity,

        updatedBy: this.storageService.getUserId(),
        updatedDate: new Date()
      };

      if (index > -1) {
        itemToSave.status = 'Modified';
        this.pagedPurchaseDetails[index] = itemToSave;
      } else {
        itemToSave.status = 'Added';

        itemToSave.id = this.tempIdCounter--;

        itemToSave.createdBy = this.storageService.getUserId();
        itemToSave.createdDate = new Date();

        this.pagedPurchaseDetails = [...this.pagedPurchaseDetails, itemToSave];
      }

      // if (this.editingIndex !== null) {
      //   this.pagedPurchaseDetails[this.editingIndex] = newItem;
      //   this.editingIndex = null;
      // } else {
      //   this.pagedPurchaseDetails.push(newItem);
      // }

      this.resetCurrentItem();
      // this.loadPage();
    }
  }

  resetCurrentItem() {
    this.currentItem = {
      id: 0,
      partNo: '',
      description: '',
      qty: 0,
      rate: 0,
      mrp: 0,
      amount: 0,
      taxableAmount: 0,
      sgstAmt: 0,
      cgstAmt: 0,
      igstAmt: 0,
      rawSgstRate: 0,
      rawCgstRate: 0,
      rawIgstRate: 0,
      itemType: 1,
      currentStock: 0
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

    if (this.isSaving) return;
    this.isSaving = true;
    this.loader.show();

    const userId = this.storageService.getUserId();
    // PONumber is Prefix + OrderNo logic can be added later if needed. For now using orderNo.
    const poModel = {
      PONumber: this.partsPOData.prefixNo,
      PODate: this.partsPOData.poDate,
      POType: this.partsPOData.poType,
      subOrderType: this.partsPOData.subPoType,
      CustomerCode: this.dealerCode,
      TransactionType: this.partsPOData.transactionType,
      LocCode: this.partsPOData.selectedLocation,
      LedgerCode: this.partsPOData.partyName,
      createdBy: userId,
      createdDate: new Date(),
      Items: this.pagedPurchaseDetails.map((item) => ({
        ItemCode: item.partNo,
        Qty: item.quantity
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

    const dealerCode = this.storageService.getDealerCode();

    console.log(this.pagedPurchaseDetails);

    const soHeader = {
      soHeader: {
        CustomerCode: dealerCode || '',
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
        ItemName: item.partNo,
        modlname: item.partNo,
        descriptions: item.description,
        Unit: 'NOS',
        Qty: item.quantity,
        itemmodelname: item.modelNo,
        colridno: 0,
        colrcode: '',
        dmspordridno: '1111',
        poid: 1111
      }))
    };

    this.purchaseService.sendToERP(soHeader).subscribe({
      next: (res: any) => {
        this.loader.hide();
        this.toaster.show('Submit to ERP successful!', { classname: 'bg-success text-white', delay: 5000 });
        this.isSubmitted = res.Succeed; // Disable button after success

        // const match = res?.ConfirmMessage?.match(/SO No\.\s*([A-Za-z0-9/-]+)/);
        // const salesOrderNo = match ? match[1] : '';
        const salesOrderNo = res.ReturnValue.SOId;

        this.updatePOStatus(this.partsPOData.prefixNo, res.Succeed, salesOrderNo, this.partsPOData.selectedLocation);
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
          poDate: res.poDate,
          selectedLocation: res.locCode,
          prefixNo: res.poNumber,
          orderNo: res.poNumber.split('/').pop(),
          subPoType: res.subOrderType,
          transactionType: res.transactionType,
          isKit: false,
          partyName: res.ledgerCode,
          poType: 'Spares'
        }
        this.pagedPurchaseDetails = res.items.map((item: any) => {

          const totalGST = item.taxes.reduce(
            (sum, tax) => sum + Number(tax.taxRate || 0), 0
          );

          const gstPrice = this.calculateGST(item.rate, totalGST);
          const gstData = this.calculateGSTAmount(item.rate, item.taxes);

          return {
            id: item.lineNumber,
            partNo: item.itemCode,
            description: item.itemDescription,
            quantity: item.qty,
            itemRate: gstPrice.basePrice,
            mrp: item.rate,
            amount: Number(gstPrice.basePrice) * Number(item.qty),
            // taxableAmount: gstData.,
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
}
