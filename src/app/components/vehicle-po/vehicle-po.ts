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

export interface PurchaseOrderItemViewModel {
  ItemCode: string;
  Qty: number;
}

export interface PurchaseOrderViewModel {
  PONumber: string;
  PODate: string;
  POType: string;
  CustomerCode: string;
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
  partyName: string = 'BGAUSS AUTO PRIVA';
  famell: string = 'Famell It';
  isGst: boolean = true;
  ponumber: string = '';
  totalAmt: number = 0;
  editingIndex: number | null = null;
  transactionTypeList = TRANSACTION_TYPES;
  selectedTransactionType: string = '';
  globalSubsidy: number = 0;

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

  constructor(
    private locationService: LocationMasterService,
    private storageService: StorageService,
    private itemService: ItemMasterService,
    private vehiclePoService: VehiclePoService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadShowroomLocations();
    this.loadItemMasterList();
    this.fetchGlobalSubsidy();

    this.route.params.subscribe(params => {
      this.ponumber = params['ponumber'];
      if (this.ponumber) {
        this.loadPODetails(this.ponumber);
      } else {
        this.generateNewOrderNo();
      }
    });
  }

  fetchGlobalSubsidy() {
    this.vehiclePoService.getSubsidyValue().subscribe({
      next: (val) => {
        this.globalSubsidy = val || 0;
        console.log('Global Subsidy fetched:', this.globalSubsidy);
      },
      error: (err) => console.error('Error fetching subsidy:', err)
    });
  }

  generateNewOrderNo() {
    this.orderNo = 'P0-6'; // Logic for new order number
  }

  loadPODetails(poNumber: string) {
    console.log('Loading details for PO:', poNumber);
    this.vehiclePoService.getPOByNumber(poNumber).subscribe({
      next: (response: any) => {
        console.log('API Response for PO details:', response);
        const res = Array.isArray(response) ? response[0] : response;

        if (res) {
          // Robust property resolution
          this.orderNo = res.PONumber || res.poNumber || res.ponumber || res.purchaseNo || res.PurchaseNo || poNumber;
          this.poDate = res.PODate || res.PurchaseDate || res.poDate || res.podate || res.date || '';
          // this.partyName = res.CustomerCode || res.customerCode || res.customercode || res.partyName || res.PartyName || 'BGAUSS AUTO PRIV';
          this.partyName = 'BGAUSS AUTO PRIV';
          this.isSubmitted = res.IsSubmitted || res.isSubmitted || res.issubmitted || res.status === 'Submitted' || false;
          this.remarks = res.Remarks || res.remarks || '';
          this.selectedLocation = res.Location || res.location || res.LocName || res.locName || res.locname || this.selectedLocation;
          this.prefixNo = res.PrefixNo || res.prefixNo || '';
          this.selectedTransactionType = res.TransactionType || res.transactionType || '';

          const itemsArr = res.Items || res.items || res.purchaseOrderDetails || res.PurchaseOrderDetails || [];
          console.log('Items found in response:', itemsArr);

          if (itemsArr && itemsArr.length > 0) {
            this.purchaseDetails = itemsArr.map((item: any) => {
              const itemCode = item.ItemCode || item.itemCode || item.modelNo || item.ModelNo;
              const modelInfo = this.modelList.find(m => m.itemcode === itemCode);
              const itmTaxes = item.Taxes || item.taxes || [];

              return {
                modelNo: itemCode,
                description: item.Description || item.description || item.modelDescription || item.ModelDescription || modelInfo?.itemdesc || '',
                color: item.Color || item.color || item.colour || item.Colour || modelInfo?.colorcode || '',
                qty: item.Qty || item.qty || 0,
                rate: item.Rate || item.rate || 0,
                discAmt: item.DiscAmt || item.discAmt || item.Subsidy || item.subsidy || 0,
                amount: item.LineAmount || item.lineAmount || item.Amount || item.amount || 0,
                taxableAmount: item.TaxableAmount || item.taxableAmount || item.LineAmount || item.lineAmount || 0,
                sgstAmt: itmTaxes.find((t: any) => (t.TaxCode || t.taxCode) === 'SGST')?.TaxAmount ?? itmTaxes.find((t: any) => (t.TaxCode || t.taxCode) === 'SGST')?.taxAmount ?? 0,
                cgstAmt: itmTaxes.find((t: any) => (t.TaxCode || t.taxCode) === 'CGST')?.TaxAmount ?? itmTaxes.find((t: any) => (t.TaxCode || t.taxCode) === 'CGST')?.taxAmount ?? 0,
                igstAmt: itmTaxes.find((t: any) => (t.TaxCode || t.taxCode) === 'IGST')?.TaxAmount ?? itmTaxes.find((t: any) => (t.TaxCode || t.taxCode) === 'IGST')?.taxAmount ?? 0,
                subsidy: item.Subsidy || item.subsidy || 0
              };
            });
            console.log('Mapped purchaseDetails:', this.purchaseDetails);
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
        console.error('Error loading PO details:', err);
        alert('Could not load PO details. Please check the console for more info.');
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

            console.log('Enriched Location List with States:', this.locationList);

            // Set default if not already set by loadPODetails
            if (this.locationList.length > 0 && !this.selectedLocation) {
              this.selectedLocation = this.locationList[0].locname;
            }

            // Recalculate if there's an item in progress
            if (this.currentItem.modelNo) {
              this.calculateRowTotals();
            }
          },
          error: (err) => console.log('Error fetching dealer locations:', err)
        });
      },
      error: (err) => {
        console.error('Error fetching full location master:', err);
        // Fallback to specific locations if full list fails (but state detection will be limited)
        this.locationService.getLocationByDealerCode(dealerCode).subscribe({
          next: (res: any) => {
            this.locationList = res;
            if (this.locationList.length > 0 && !this.selectedLocation) {
              this.selectedLocation = this.locationList[0].locname;
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
                item.description = modelInfo.itemdesc || item.description;
                item.color = modelInfo.colorcode || item.color;
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

    this.itemService.getPurchaseDetailsByModelNo(this.currentItem.modelNo).subscribe({
      next: (res: any) => {
        console.log('Model details response:', res);
        if (res) {
          this.currentItem.description = res.itemdesc || res.itemDesc || res.Itemdesc;
          this.currentItem.color = res.colorcode || res.colorCode || res.Colorcode;
          this.currentItem.rate = res.ipurrate || res.iPurRate || res.Ipurrate;

          this.currentItem.rawSgstRate = res.sgst || res.sGst || res.Sgst || 0;
          this.currentItem.rawCgstRate = res.cgst || res.cGst || res.Cgst || 0;
          this.currentItem.rawIgstRate = res.igst || res.iGst || res.Igst || 0;
          this.currentItem.rawSubsidy = res.fame2amount || res.fame2Amount || res.Fame2amount || 0;
          this.currentItem.itemType = res.itemtype || res.itemType || 0;

          this.calculateRowTotals();
        }
      },
      error: (err) => {
        console.error('Error fetching model details:', err);
      }
    });
  }

  addPurchaseItem() {
    if (!this.currentItem.modelNo) {
      alert('Please select a model');
      return;
    }

    const newItem = { ...this.currentItem };

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
      this.currentItem.discAmt = (this.globalSubsidy || 0) * qty;
    }

    let discAmt = Number(this.currentItem.discAmt) || 0;

    let taxableAmount = (qty * rate) - discAmt;
    this.currentItem.taxableAmount = taxableAmount > 0 ? taxableAmount : 0;

    let rawSubsidy = this.currentItem.rawSubsidy || 0;
    this.currentItem.subsidy = rawSubsidy > 0 ? (rawSubsidy * qty) : 0;

    console.log('Calculating totals for location:', this.selectedLocation);
    console.log('Location list available:', this.locationList);

    const dealerLoc = this.locationList.find(l =>
      ((l.locname || l.Locname || '').trim().toLowerCase()) ===
      ((this.selectedLocation || '').trim().toLowerCase())
    ) || (this.locationList.length > 0 ? this.locationList[0] : null);

    console.log('Detected dealer location info:', dealerLoc);

    const locState = (dealerLoc?.state || dealerLoc?.State || '').trim();
    console.log('Detected state:', locState);

    const isInterstate = locState ? locState.toLowerCase() !== 'maharashtra' : false;
    console.log('Is Interstate:', isInterstate);

    let rawSgstRate = Number(this.currentItem.rawSgstRate) || 0;
    let rawCgstRate = Number(this.currentItem.rawCgstRate) || 0;
    let rawIgstRate = Number(this.currentItem.rawIgstRate) || 0;

    if (isInterstate) {
      // Interstate logic: Use IGST (sum of SGST/CGST if IGST is 0)
      let totalIgst = rawIgstRate;
      if (totalIgst === 0) totalIgst = rawSgstRate + rawCgstRate;

      this.currentItem.sgstAmt = 0;
      this.currentItem.cgstAmt = 0;
      this.currentItem.igstAmt = (this.currentItem.taxableAmount * totalIgst) / 100;
    } else {
      // Local logic: Use SGST/CGST (split IGST by 2 if they are 0)
      let sRate = rawSgstRate;
      let cRate = rawCgstRate;

      if (sRate === 0 && cRate === 0 && rawIgstRate > 0) {
        sRate = rawIgstRate / 2;
        cRate = rawIgstRate / 2;
      }

      this.currentItem.sgstAmt = (this.currentItem.taxableAmount * sRate) / 100;
      this.currentItem.cgstAmt = (this.currentItem.taxableAmount * cRate) / 100;
      this.currentItem.igstAmt = 0;
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
      this.itemService.getPurchaseDetailsByModelNo(this.currentItem.modelNo).subscribe({
        next: (res: any) => {
          if (res) {
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
    if (confirm('Are you sure you want to delete this item?')) {
      // Find the actual index in the main array
      const actualIndex = (this.page - 1) * this.pageSize + index;
      this.purchaseDetails.splice(actualIndex, 1);
      this.loadPage();
    }
  }

  onSave() {
    if (this.purchaseDetails.length === 0) {
      alert('Please add at least one item to the purchase details.');
      return;
    }

    const dealerCode = this.storageService.getDealerCode();
    const poModel = {
      PONumber: this.orderNo,
      PODate: this.poDate,
      POType: this.poType,
      CustomerCode: dealerCode || this.selectedLocation,
      TransactionType: this.selectedTransactionType,
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
        if (res.success) {
          alert(res.message || 'Purchase Order saved successfully.');
          this.router.navigate(['/vehicle-po-list']);
        } else {
          alert(res.message || 'Error saving Purchase Order.');
        }
      },
      error: (err) => {
        console.error('Save error:', err);
        alert(err.error?.message || 'Error connecting to server.');
      }
    });
  }

  onSubmitToERP() {
    const poFullNumber = this.prefixNo + this.orderNo;

    if (!poFullNumber) {
      alert('Invalid PO Number. Please ensure the PO is saved correctly.');
      return;
    }

    console.log('Submitting to ERP, PO Number:', poFullNumber);

    this.vehiclePoService.sendToERP(this.orderNo).subscribe({
      next: (res: any) => {
        console.log('Submit to ERP response:', res);
        alert('Submit to ERP successful!');
        this.isSubmitted = true; // Disable button after success
        this.router.navigate(['/vehicle-po-list']);
      },
      error: (err) => {
        console.error('Error submitting to ERP:', err);
        alert('An error occurred while submitting to ERP: ' + (err.error?.message || err.message));
      }
    });
  }
}
