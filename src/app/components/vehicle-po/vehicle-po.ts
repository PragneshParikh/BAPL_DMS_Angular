import { Component, OnInit } from '@angular/core';
import { LocationMasterService } from '../../core/services/location-master-service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { StorageService } from '../../core/services/storage';
import { ItemMasterService } from '../../core/services/item-master-service';
import { VehiclePoService } from '../../core/services/vehicle-po-service';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { TRANSACTION_TYPES } from '../../constant';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import Swal from 'sweetalert2';
import { LedgerMaster } from '../../core/services/ledger-master';
import { PrefixService } from '../../core/services/prefix';
export interface PurchaseOrderItemViewModel {
  ItemCode: string;
  Qty: number;
}

export interface PurchaseOrderViewModel {
  PONumber: string;
  PODate: string;
  POType: string;
  CustomerCode: string;
  TransactionType?: string;
  Remarks?: string;
  LocCode?: string;
  LedgerCode?: string;
  Items: PurchaseOrderItemViewModel[];
}



@Component({
  selector: 'app-vehicle-po',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgbPaginationModule],
  templateUrl: './vehicle-po.html',
  styleUrl: './vehicle-po.scss',
})

export class VehiclePO implements OnInit {
  locationList: any[] = [];
  selectedLocation: string = '';

  modelList: any[] = [];
  purchaseDetails: any[] = [];
  pagedPurchaseDetails: any[] = [];
  page = 1;
  pageSize = 5;

  // Purchase Info fields
  prefixNo: string = '';
  orderNo: string = '';
  poDate: string = new Date().toISOString();
  remarks: string = '';
  poType: string = 'Vehicle';
  isSubmitted: boolean = false;
  isSaving: boolean = false;
  partyName: string = 'BGAUSS AUTO PRIVA';
  famell: string = 'Famell It';
  isGst: boolean = true;
  ponumber: string = '';
  totalAmt: number = 0;
  editingIndex: number | null = null;
  transactionTypeList = TRANSACTION_TYPES;
  selectedTransactionType: string = '';
  globalSubsidy: number = 0;
  ledgerList: any[] = [];
  selectedLedgerCode: string = '';
  locationInvalid: boolean = false;
  transactionTypeInvalid: boolean = false;
  qtyInvalid: boolean = false;
  ledgerInvalid: boolean = false;

  currentItem: any = {
    modelNo: '',
    description: '',
    color: '',
    qty: 0,
    rate: 0,
    discAmt: 0,
    amount: 0,
    taxableAmount: 0,
    sgstAmt: 0,
    cgstAmt: 0,
    igstAmt: 0,
    subsidy: 0,
    rawSgstRate: 0,
    rawCgstRate: 0,
    rawIgstRate: 0,
    rawSubsidy: 0,
    itemType: 0
  };
  dealerCode: string = '';

  constructor(
    private locationService: LocationMasterService,
    private storageService: StorageService,
    private itemService: ItemMasterService,
    private vehiclePoService: VehiclePoService,
    private route: ActivatedRoute,
    private router: Router,
    private loader: LoaderService,
    public toaster: ToastService,
    private ledgerService: LedgerMaster,
    private prefixService: PrefixService
  ) {
    this.dealerCode = this.storageService.getDealerCode();
  }

  ngOnInit() {
    this.loadShowroomLocations();
    this.loadItemMasterList();
    this.fetchGlobalSubsidy();
    this.loadLedgerList();

    this.route.params.subscribe(params => {
      this.ponumber = params['ponumber'];
      if (this.ponumber) {
        this.loadPODetails(this.ponumber);
      } else {
        this.generateNewOrderNo();
        // For new PO: apply default ledger (list may already be loaded)
        this.applyDefaultLedger();
      }
    });
  }

  applyDefaultLedger() {
    // If ledger list is already fetched, select the first one
    if (this.ledgerList.length > 0 && !this.selectedLedgerCode) {
      this.selectedLedgerCode = this.ledgerList[0].ledgerCode;
    }
    // If not yet fetched, the loadLedgerList callback will handle it
  }

  fetchGlobalSubsidy() {
    this.vehiclePoService.getSubsidyValue().subscribe({
      next: (val) => {
        this.globalSubsidy = val || 0;
      },
      error: (err) => console.error('Error fetching subsidy:', err)
    });
  }

  generateNewOrderNo() {
    // this.orderNo = 'P0-7'; // Logic for new order number
    // this.orderNo = 'TEMP-' + Date.now();
    this.loader.show();
    this.prefixService.getPrefixByDealerByModule(this.dealerCode, 'purchase_order').subscribe({
      next: (res: string) => {
        this.loader.hide();
        this.orderNo = res;
      }, error: (err) => {
        this.loader.hide();
        console.error('Error fetching prefix:', err);
        this.toaster.show('Could not generate order number. Please check the console for more info.', { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  loadPODetails(poNumber: string) {
    this.loader.show();
    this.vehiclePoService.getPOByNumber(poNumber).subscribe({
      next: (response: any) => {
        this.loader.hide();
        const res = Array.isArray(response) ? response[0] : response;

        if (res) {
          // Robust property resolution
          this.orderNo = res.PONumber || res.poNumber || res.ponumber || res.purchaseNo || res.PurchaseNo || poNumber;
          this.poDate = res.PODate || res.PurchaseDate || res.poDate || res.podate || res.date || '';
          // this.partyName = res.CustomerCode || res.customerCode || res.customercode || res.partyName || res.PartyName || 'BGAUSS AUTO PRIV';
          this.partyName = 'BGAUSS AUTO PRIV';
          this.isSubmitted = res.IsSubmitted || res.isSubmitted || res.issubmitted || res.status === 'Submitted' || false;
          this.remarks = res.Remarks || res.remarks || '';
          this.selectedLocation = res.LocCode || res.locCode || res.loccode || this.selectedLocation;
          this.prefixNo = res.PrefixNo || res.prefixNo || '';
          this.selectedTransactionType = res.TransactionType || res.transactionType || '';
          this.selectedLedgerCode = res.LedgerCode || res.ledgerCode || res.ledgercode || '';
          if (!this.selectedLedgerCode) {
            this.applyDefaultLedger();
          }

          const itemsArr = res.Items || res.items || res.purchaseOrderDetails || res.PurchaseOrderDetails || [];

          if (itemsArr && itemsArr.length > 0) {
            this.purchaseDetails = itemsArr.map((item: any) => {
              const itemCode = item.ItemCode || item.itemCode || item.modelNo || item.ModelNo;
              const modelInfo = this.modelList.find(m => m.itemcode === itemCode);
              const itmTaxes = item.Taxes || item.taxes || item.purchaseOrderTaxes || item.PurchaseOrderTaxes || [];

              // Compute correctly instead of relying on flawed DB TaxableAmount
              const qty = item.Qty ?? item.qty ?? 0;
              const rate = item.Rate ?? item.rate ?? 0;
              const grossAmount = qty * rate;
              const discAmt = item.DiscAmt ?? item.discAmt ?? item.Subsidy ?? item.subsidy ?? 0;
              const taxableAmount = Math.max(0, grossAmount - discAmt);

              // Helper for safe tax extraction and correction
              const getTax = (code: string) => {
                const upperTarget = code.toUpperCase();
                let finalTaxAmount = 0;

                const matches = itmTaxes.filter((t: any) => (t.TaxCode || t.taxCode || '').toUpperCase().includes(upperTarget));

                if (matches.length > 0) {
                  finalTaxAmount = matches.reduce((sum: number, t: any) => {
                    // 1. Explicit DB TaxRate
                    let taxRate = Number(t.TaxRate ?? t.taxRate ?? t.Rate ?? t.rate);
                    if (taxRate && taxRate > 0) {
                      return sum + (taxableAmount * taxRate / 100);
                    }
                    // 2. Extract from code string (e.g. IGST18 -> 18)
                    const codeStr = String(t.TaxCode || t.taxCode || '');
                    const rateMatch = codeStr.match(/\d+(\.\d+)?/);
                    if (rateMatch) {
                      return sum + (taxableAmount * parseFloat(rateMatch[0]) / 100);
                    }
                    // 3. Fallback raw amount
                    return sum + (Number(t.TaxAmount ?? t.taxAmount ?? t.Amount ?? t.amount) || 0);
                  }, 0);
                } else {
                  // Fallback to direct properties on the item object
                  const itemKeys = Object.keys(item);
                  const matchingKey = itemKeys.find(k => k.toUpperCase().includes(upperTarget) && (k.toUpperCase().includes('AMT') || k.toUpperCase().includes('AMOUNT')));
                  if (matchingKey) {
                    finalTaxAmount = Number(item[matchingKey]) || 0;
                  } else {
                    finalTaxAmount = Number(item[code] ?? item[code.toLowerCase()]) || 0;
                  }
                }

                // Guard: If backend calculated it on Gross Amount, correct it for Taxable
                if (finalTaxAmount > 0 && grossAmount > 0) {
                  const deducedRate = (finalTaxAmount / grossAmount) * 100;
                  const roundedRate = Math.round(deducedRate * 10) / 10;
                  const validGSTRates = [1.5, 2.5, 3, 5, 6, 9, 12, 14, 18, 28];

                  if (validGSTRates.includes(roundedRate)) {
                    return (taxableAmount * roundedRate) / 100;
                  }
                }

                return finalTaxAmount;
              };

              const sgstAmt = getTax('SGST');
              const cgstAmt = getTax('CGST');
              const igstAmt = getTax('IGST');

              const totalAmount = taxableAmount + sgstAmt + cgstAmt + igstAmt;

              return {
                modelNo: itemCode,
                description: item.Description || item.description || item.modelDescription || item.ModelDescription || modelInfo?.itemdesc || modelInfo?.Itemdesc || '',
                color: item.Color || item.color || item.colour || item.Colour || modelInfo?.colorcode || modelInfo?.colorCode || modelInfo?.Colorcode || modelInfo?.color || modelInfo?.Color || modelInfo?.colorname || modelInfo?.ColorName || '',
                qty: qty,
                rate: rate,
                discAmt: discAmt,
                amount: totalAmount,
                taxableAmount: taxableAmount,
                sgstAmt: sgstAmt,
                cgstAmt: cgstAmt,
                igstAmt: igstAmt,
                subsidy: item.Subsidy || item.subsidy || 0
              };
            });

            // Async fallback: fetch comprehensive model info for rows missing colors
            this.purchaseDetails.forEach((pItem: any) => {
              if (!pItem.color || !pItem.description) {
                this.itemService.getPurchaseDetailsByModelNo(pItem.modelNo).subscribe({
                  next: (res: any) => {
                    if (res) {
                      if (!pItem.color) pItem.color = res.colorcode || res.colorCode || res.Colorcode || res.color || res.Color || res.colorname || res.ColorName || '';
                      if (!pItem.description) pItem.description = res.itemdesc || res.itemDesc || res.Itemdesc || '';
                    }
                  }
                });
              }
            });

            this.loadPage();
          } else {
            console.warn('No items found in PO response');
            this.purchaseDetails = [];
            this.loadPage();
          }
        } else {
          console.error('No data found for PO Number:', poNumber);
        }
      },
      error: (err) => {
        this.loader.hide();
        console.error('Error loading PO details:', err);
        this.toaster.show('Could not load PO details. Please check the console for more info.', { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  loadShowroomLocations() {
    const dealerCode = this.storageService.getDealerCode();

    // First fetch the full location master to get all metadata (especially State)
    this.locationService.getAllLocationMaster().subscribe({
      next: (allLocs: any[]) => {
        const fullLocationMap = Array.isArray(allLocs) ? allLocs : [];

        // Now fetch specific locations for this dealer
        this.locationService.getLocationByDealerCode(dealerCode).subscribe({
          next: (res: any) => {
            const dealerLocs = Array.isArray(res) ? res : [];

            // Enrich dealer locations with 'state' from the full master list
            this.locationList = dealerLocs.map(loc => {
              const matchedLoc = fullLocationMap.find(m =>
                (m.locname || '').trim().toLowerCase() === (loc.locname || '').trim().toLowerCase()
              );
              return {
                ...loc,
                state: matchedLoc?.state || matchedLoc?.State || loc.state || loc.State || ''
              };
            });

            // Set default if not already set by loadPODetails
            if (this.locationList.length > 0 && !this.selectedLocation) {
              this.selectedLocation = this.locationList[0].loccode || this.locationList[0].Loccode || this.locationList[0].locname;
            }

            // Recalculate if there's an item in progress
            if (this.currentItem.modelNo) {
              this.calculateRowTotals();
            }
          },
          error: (err) => console.error('Error fetching dealer locations:', err)
        });
      },
      error: (err) => {
        console.error('Error fetching full location master:', err);
        // Fallback to specific locations if full list fails (but state detection will be limited)
        this.locationService.getLocationByDealerCode(dealerCode).subscribe({
          next: (res: any) => {
            this.locationList = res;
            if (this.locationList.length > 0 && !this.selectedLocation) {
              this.selectedLocation = this.locationList[0].loccode || this.locationList[0].Loccode || this.locationList[0].locname;
            }
          }
        });
      }
    });
  }

  onLocationChange() {
    // Refresh calculations for the current item if a model is already selected
    if (this.currentItem.modelNo) {
      this.calculateRowTotals();
    }
  }

  loadItemMasterList() {
    this.itemService.getItems(6, '', 11).subscribe({
      next: (res: any[]) => {
        this.modelList = Array.isArray(res) ? res.filter(item => item.grpid === 6 || item.grppid === 6 || !item.grpid) : [];
        // Supplement missing info in purchaseDetails if needed
        if (this.purchaseDetails.length > 0) {
          this.purchaseDetails.forEach(item => {
            if (!item.description || !item.color) {
              const modelInfo = this.modelList.find(m => m.itemcode === item.modelNo);
              if (modelInfo) {
                item.description = item.description || modelInfo.itemdesc || modelInfo.Itemdesc || modelInfo.description || '';
                item.color = item.color || modelInfo.colorcode || modelInfo.colorCode || modelInfo.Colorcode || modelInfo.color || modelInfo.Color || modelInfo.colorName || modelInfo.ColorName || modelInfo.Colour || modelInfo.colour || '';
              }
            }
          });
        }
      },
      error: (err) => console.error('Error loading item master:', err)
    });
  }

  onModelChange() {
    if (!this.currentItem.modelNo) {
      this.resetCurrentItem();
      return;
    }

    this.loader.show();

    this.itemService.getPurchaseDetailsWithHsnTaxByModelNo(this.currentItem.modelNo).subscribe({
      next: (res: any) => {
        this.loader.hide();
        if (res) {
          // Robust property extraction (handling different casing from backend)
          const getVal = (obj: any, ...keys: string[]) => {
            for (const key of keys) {
              if (obj[key] !== undefined) return obj[key];
              const lowerKey = key.toLowerCase();
              if (obj[lowerKey] !== undefined) return obj[lowerKey];
              const upperKey = key.toUpperCase();
              if (obj[upperKey] !== undefined) return obj[upperKey];
            }
            return 0;
          };

          this.currentItem.description = res.itemdesc || res.itemDesc || res.Itemdesc;
          this.currentItem.color = res.colorcode || res.colorCode || res.Colorcode;
          this.currentItem.rawSgstRate = getVal(res, 'Sgst', 'sgst', 'SGST');
          this.currentItem.rawCgstRate = getVal(res, 'Cgst', 'cgst', 'CGST');
          this.currentItem.rawIgstRate = getVal(res, 'Igst', 'igst', 'IGST');
          this.currentItem.rate = getVal(res, 'Ipurrate', 'ipurrate', 'IPURRATE', 'rate');
          this.currentItem.rawSubsidy = getVal(res, 'Fame2amount', 'fame2amount', 'fame2Amount');
          this.currentItem.itemType = res.itemtype || res.itemType || 0;

          // Re-calculate totals immediately
          this.calculateRowTotals();

          // Force UI refresh for the calculation fields
          setTimeout(() => {
            this.calculateRowTotals();
          }, 50);
        }
      },
      error: (err) => {
        this.loader.hide();
        console.error('Error fetching model details:', err);
      }
    });
  }

  addPurchaseItem() {
    if (!this.currentItem.modelNo) {
      this.toaster.show('Please select a model', { classname: 'bg-danger text-white', delay: 3000 });
      return;
    }

    // Header validation (visual only, no toaster as per request)
    this.locationInvalid = !this.selectedLocation;
    this.transactionTypeInvalid = !this.selectedTransactionType;
    this.qtyInvalid = !this.currentItem.qty || this.currentItem.qty <= 0;

    if (this.locationInvalid || this.transactionTypeInvalid || this.qtyInvalid) {
      return;
    }

    // Check for duplicate model in the list (using description/name)
    const isDuplicate = this.purchaseDetails.some((item, index) =>
      item.modelNo === this.currentItem.modelNo && index !== this.editingIndex
    );

    if (isDuplicate) {
      this.toaster.show(`Model "${this.currentItem.description}" is already added. If you need to change the quantity, please edit the existing entry.`, { classname: 'bg-danger text-dark', delay: 5000 });
      return;
    }

    this.calculateRowTotals();

    const newItem = { ...this.currentItem };

    // Ensure all critical tax fields are copied as numbers
    newItem.sgstAmt = Number(this.currentItem.sgstAmt) || 0;
    newItem.cgstAmt = Number(this.currentItem.cgstAmt) || 0;
    newItem.igstAmt = Number(this.currentItem.igstAmt) || 0;
    newItem.amount = Number(this.currentItem.amount) || 0;

    if (this.editingIndex !== null) {
      this.purchaseDetails[this.editingIndex] = newItem;
      this.editingIndex = null;
    } else {
      this.purchaseDetails.push(newItem);
    }

    this.resetCurrentItem();
    this.loadPage();
  }

  resetCurrentItem() {
    this.currentItem = {
      modelNo: '',
      description: '',
      color: '',
      qty: 0,
      rate: 0,
      discAmt: 0,
      amount: 0,
      taxableAmount: 0,
      sgstAmt: 0,
      cgstAmt: 0,
      igstAmt: 0,
      subsidy: 0,
      rawSgstRate: 0,
      rawCgstRate: 0,
      rawIgstRate: 0,
      rawSubsidy: 0,
      itemType: 0
    };
    this.editingIndex = null;
  }

  calculateRowTotals() {
    let qty = Number(this.currentItem.qty) || 0;
    let rate = Number(this.currentItem.rate) || 0;

    // Bind subsidy to discAmt if itemType is 11
    if (this.currentItem.itemType === 11) {
      this.currentItem.discAmt = (Number(this.currentItem.rawSubsidy) || 0) * qty;
    }

    let discAmt = Number(this.currentItem.discAmt) || 0;

    let taxableAmount = (qty * rate) - discAmt;
    this.currentItem.taxableAmount = taxableAmount > 0 ? taxableAmount : 0;

    let rawSubsidy = this.currentItem.rawSubsidy || 0;
    this.currentItem.subsidy = rawSubsidy > 0 ? (rawSubsidy * qty) : 0;

    const dealerLoc = this.locationList.find(l =>
      ((l.locname || l.Locname || '').trim().toLowerCase()) ===
      ((this.selectedLocation || '').trim().toLowerCase())
    ) || (this.locationList.length > 0 ? this.locationList[0] : null);

    const locState = (dealerLoc?.state || dealerLoc?.State || '').trim();

    // Robust property extraction (handling different casing from backend)
    const getVal = (obj: any, ...keys: string[]) => {
      if (!obj) return 0;
      for (const key of keys) {
        if (obj[key] !== undefined && obj[key] !== null) return Number(obj[key]);
        const lowerKey = key.toLowerCase();
        if (obj[lowerKey] !== undefined && obj[lowerKey] !== null) return Number(obj[lowerKey]);
        const upperKey = key.toUpperCase();
        if (obj[upperKey] !== undefined && obj[upperKey] !== null) return Number(obj[upperKey]);
      }
      return 0;
    };

    const rawSgstRate = getVal(this.currentItem, 'rawSgstRate', 'sgst');
    const rawCgstRate = getVal(this.currentItem, 'rawCgstRate', 'cgst');
    const rawIgstRate = getVal(this.currentItem, 'rawIgstRate', 'igst');

    // Determine if Interstate: 
    // 1. Explicitly not Maharashtra
    // 2. OR if Transaction Type is 'I' (Interstate)
    // 3. OR if we have an IGST rate but no SGST/CGST rates (HSN mapping preference)
    let isInterstate = locState ? locState.toLowerCase() !== 'maharashtra' : false;

    if (this.selectedTransactionType === 'I') {
      isInterstate = true;
    } else if (this.selectedTransactionType === 'L') {
      isInterstate = false;
    } else if (rawIgstRate > 0 && (rawSgstRate === 0 && rawCgstRate === 0)) {
      isInterstate = true;
    }

    if (isInterstate) {
      // Interstate logic: Use IGST
      this.currentItem.sgstAmt = 0;
      this.currentItem.cgstAmt = 0;
      this.currentItem.igstAmt = (this.currentItem.taxableAmount * rawIgstRate) / 100;

      // Secondary fallback if IGST is 0 but we have local rates (rare for Interstate)
      if (this.currentItem.igstAmt === 0 && (rawSgstRate + rawCgstRate) > 0) {
        this.currentItem.igstAmt = (this.currentItem.taxableAmount * (rawSgstRate + rawCgstRate)) / 100;
      }
    } else {
      // Local logic: Use SGST/CGST
      this.currentItem.sgstAmt = (this.currentItem.taxableAmount * rawSgstRate) / 100;
      this.currentItem.cgstAmt = (this.currentItem.taxableAmount * rawCgstRate) / 100;
      this.currentItem.igstAmt = 0;

      // Fallback: if we only have an IGST rate in a local context, split it
      if (this.currentItem.sgstAmt === 0 && this.currentItem.cgstAmt === 0 && rawIgstRate > 0) {
        const halfIgst = rawIgstRate / 2;
        this.currentItem.sgstAmt = (this.currentItem.taxableAmount * halfIgst) / 100;
        this.currentItem.cgstAmt = (this.currentItem.taxableAmount * halfIgst) / 100;
      }
    }

    this.currentItem.amount = this.currentItem.taxableAmount + this.currentItem.sgstAmt + this.currentItem.cgstAmt + this.currentItem.igstAmt;
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
    if (this.isSubmitted) return;
    // Find the actual index in the main array
    const actualIndex = (this.page - 1) * this.pageSize + index;
    const item = this.purchaseDetails[actualIndex];
    this.editingIndex = actualIndex;

    // Copy the item data to currentItem
    this.currentItem = { ...item };

    // Re-fetch model details to ensure all metadata (rates, itemType) for calculations are present
    if (this.currentItem.modelNo) {
      this.itemService.getPurchaseDetailsWithHsnTaxByModelNo(this.currentItem.modelNo).subscribe({
        next: (res: any) => {
          if (res) {
            // Patch missing description or color if it wasn't populated from list
            if (!this.currentItem.description) {
              this.currentItem.description = res.itemdesc || res.itemDesc || res.Itemdesc || '';
            }
            if (!this.currentItem.color) {
              this.currentItem.color = res.colorcode || res.colorCode || res.Colorcode || res.color || res.Color || res.colorname || res.ColorName || '';
            }

            this.currentItem.rawSgstRate = res.sgst || res.sGst || res.Sgst || 0;
            this.currentItem.rawCgstRate = res.cgst || res.cGst || res.Cgst || 0;
            this.currentItem.rawIgstRate = res.igst || res.iGst || res.Igst || 0;
            this.currentItem.rawSubsidy = res.fame2amount || res.fame2Amount || res.Fame2amount || 0;
            this.currentItem.itemType = res.itemtype || res.itemType || 0;

            // Re-trigger calculations with latest logic while preserving row's qty/disc
            this.calculateRowTotals();
          }
        }
      });
    }
  }

  deleteItem(index: number) {
    if (this.isSubmitted) return;

    Swal.fire({
      title: 'Are you sure you want to delete?',
      text: "",
      icon: 'warning',
      showCancelButton: true,
      customClass: {
        confirmButton: 'btn btn-primary w-xs me-2 mt-2',
        cancelButton: 'btn btn-danger w-xs mt-2',
      },
      confirmButtonText: 'Yes, delete it!',
      buttonsStyling: false,
      showCloseButton: true
    }).then((result) => {
      if (result.isConfirmed) {
        // Find the actual index in the main array
        const actualIndex = (this.page - 1) * this.pageSize + index;
        this.purchaseDetails.splice(actualIndex, 1);
        this.loadPage();

        Swal.fire({
          title: 'Deleted!',
          text: 'Your item has been deleted.',
          icon: 'success',
          customClass: {
            confirmButton: 'btn btn-primary w-xs mt-2',
          },
          buttonsStyling: false
        });
      }
    });
  }

  get isFameEnabled(): boolean {
    // If ANY item in the PO or the current selection has a subsidy value, enable the dropdown
    const hasCurrentSubsidy = (Number(this.currentItem?.rawSubsidy) || 0) > 0;
    const hasListSubsidy = this.purchaseDetails?.some(item => (Number(item.subsidy) || Number(item.rawSubsidy) || 0) > 0);

    return hasCurrentSubsidy || hasListSubsidy;
  }

  get totalQty(): number {
    return this.purchaseDetails.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  }

  get totalDisc(): number {
    return this.purchaseDetails.reduce((sum, item) => sum + (Number(item.discAmt) || 0), 0);
  }

  get totalSgst(): number {
    return this.purchaseDetails.reduce((sum, item) => sum + (Number(item.sgstAmt) || 0), 0);
  }

  get totalCgst(): number {
    return this.purchaseDetails.reduce((sum, item) => sum + (Number(item.cgstAmt) || 0), 0);
  }

  get totalIgst(): number {
    return this.purchaseDetails.reduce((sum, item) => sum + (Number(item.igstAmt) || 0), 0);
  }

  get totalNetAmount(): number {
    return this.purchaseDetails.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }

  loadLedgerList() {
    this.ledgerService.getCompanyLedgers().subscribe({
      next: (res: any) => {
        this.ledgerList = res || [];
        // Auto-select first item for new POs or if nothing is stored yet
        if (!this.selectedLedgerCode && this.ledgerList.length > 0) {
          this.selectedLedgerCode = this.ledgerList[0].ledgerCode;
        }
      },
      error: (err) => {
        console.error('Error loading ledgers:', err);
      }
    });
  }

  onSave() {
    if (this.purchaseDetails.length === 0) {
      this.toaster.show('Please add at least one item to the purchase details.', { classname: 'bg-danger text-white', delay: 3000 });
      return;
    }

    // Header validation
    this.locationInvalid = !this.selectedLocation;
    this.transactionTypeInvalid = !this.selectedTransactionType;
    this.ledgerInvalid = !this.selectedLedgerCode;

    if (this.locationInvalid || this.transactionTypeInvalid || this.ledgerInvalid) {
      return;
    }

    if (this.isSaving) return;
    this.isSaving = true;

    this.loader.show();

    const dealerCode = this.storageService.getDealerCode();
    const poModel = {
      PONumber: this.orderNo,
      PODate: this.poDate,
      POType: this.poType,
      CustomerCode: dealerCode || '',
      TransactionType: this.selectedTransactionType,
      Remarks: this.remarks,
      LocCode: this.selectedLocation,
      LedgerCode: this.selectedLedgerCode,
      Items: this.purchaseDetails.map((item, index) => ({
        ItemCode: item.modelNo,
        Qty: item.qty,
        LineNumber: index + 1,
        DiscAmt: item.discAmt || 0
      }))
    };

    const saveObs = this.ponumber
      ? this.vehiclePoService.updatePO(poModel)
      : this.vehiclePoService.createPurchaseOrder(poModel);

    saveObs.subscribe({
      next: (res) => {
        this.loader.hide();
        this.isSaving = false;
        if (res.success) {
          this.toaster.show(res.message || 'Purchase Order saved successfully.', { classname: 'bg-success text-white', delay: 5000 });
          this.redirectToCreatePOList();
        } else {
          this.toaster.show(res.message || 'Error saving Purchase Order.', { classname: 'bg-danger text-white', delay: 5000 });
        }
      },
      error: (err) => {
        this.loader.hide();
        this.isSaving = false;
        console.error('Save error:', err);
        this.toaster.show(err.error?.message || 'Error connecting to server.', { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  onSubmitToERP() {
    this.loader.show();

    const dealerCode = this.storageService.getDealerCode();
    // const poModel = {
    //   PONumber: this.orderNo,
    //   PODate: this.poDate,
    //   POType: this.poType,
    //   CustomerCode: dealerCode || '',
    //   TransactionType: this.selectedTransactionType,
    //   Remarks: this.remarks,
    //   LocCode: this.selectedLocation,
    //   LedgerCode: this.selectedLedgerCode,
    //   Items: this.purchaseDetails.map((item, index) => ({
    //     ItemCode: item.modelNo,
    //     Qty: item.qty,
    //     LineNumber: index + 1,
    //     DiscAmt: item.discAmt || 0
    //   }))
    // };

    const poModel = {
      refno: this.orderNo,
      pordrdate: this.poDate,
      pordr_type: 'SSO',
      ordrtype: this.poType,
      testcertificate: '',
      consigneecode: this.selectedLocation,
      customercode: dealerCode || '',
      amount: 0,
      FameIIFlag: '',
      soLine: this.purchaseDetails.map((item) => ({
        Itemname: item.modelNo,
        modlname: item.modelNo,
        descriptions: item.description,
        Unit: 'NOS',
        qty: item.qty,
        itemmodelname: item.modelNo,
        colridno: 0,
        colrcode: '',
        dmspordridno: '1111',
        poid: '1111'
      }))
    };

    console.log('Submitting to ERP with model:', poModel);

    this.vehiclePoService.sendToERP(poModel).subscribe({
      next: (res: any) => {
        this.loader.hide();
        console.log('Submit to ERP response:', res);
        this.toaster.show('Submit to ERP successful!', { classname: 'bg-success text-white', delay: 5000 });
        this.isSubmitted = true; // Disable button after success
        this.redirectToCreatePOList();
      },
      error: (err) => {
        this.loader.hide();
        console.error('Error submitting to ERP:', err);
        this.toaster.show('An error occurred while submitting to ERP: ' + (err.error?.message || err.message), { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }
  redirectToCreatePOList() {
    this.router.navigate(['/vehicle-po-list']);
  }

  onChangeTransactionType(event: any) {
    if (!event) return;

    const newValue = event.target.value;
    if (newValue === 'B2B') {
      this.openConfirmationDialog(event);
    } else {

    }
  }

  openConfirmationDialog(event: any) {
    Swal.fire({
      title: 'Are you sure you want to make the order for B2B?',
      text: '',
      icon: 'warning',
      width: '320px',
      padding: '1rem',
      confirmButtonText: 'Yes',
      buttonsStyling: false,
      allowOutsideClick: false,
      showCancelButton: true,
      showCloseButton: false,
      customClass: {
        popup: 'swal-compact',
        title: 'fs-6',          // smaller title
        htmlContainer: 'fs-7',  // smaller text
        confirmButton: 'btn btn-sm btn-primary me-2',
        cancelButton: 'btn btn-sm btn-danger'
      }
    }).then((result) => {
      if (!result.isConfirmed) {
        event.target.value = '';
        this.selectedTransactionType = '';
      }
    });
  }

}
