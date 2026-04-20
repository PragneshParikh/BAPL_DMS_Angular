import { Component, OnInit } from '@angular/core';
import { LocationMasterService } from '../../core/services/location-master-service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { StorageService } from '../../core/services/storage';
import { ItemMasterService } from '../../core/services/item-master-service';
import { PartsPoService } from '../../core/services/parts-po-service';
import { KitCreationService } from '../../core/services/kit-creation.service';
import { KitDetailService } from '../../core/services/kit-detail-service';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { TRANSACTION_TYPES } from '../../constant';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import { JobCardService } from '../../core/services/job-card-service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-parts-po',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgbPaginationModule],
  templateUrl: './parts-po.html',
  styleUrl: './parts-po.scss',
})
export class PartsPo implements OnInit {
  locationList: any[] = [];
  selectedLocation: string = '';

  modelList: any[] = [];
  kitList: any[] = [];
  purchaseDetails: any[] = [];
  pagedPurchaseDetails: any[] = [];
  page = 1;
  pageSize = 5;

  // Purchase Info fields (Prefix and OrderNo are UI-only for now)
  prefixNo: string = '';
  orderNo: string = '';
  poDate: string = new Date().toISOString();
  remarks: string = '';
  poType: string = '';
  isSubmitted: boolean = false;
  isSaving: boolean = false;
  partyName: string = 'BGAUSS AUTO PRIVATE LIMITED';
  isGst: boolean = true;
  isKit: boolean = false;
  ponumber: string = '';
  totalAmt: number = 0;
  editingIndex: number | null = null;
  transactionTypeList = TRANSACTION_TYPES;
  selectedTransactionType: string = '';
  
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
    partNo: '',
    description: '',
    qty: 0,
    rate: 0,
    mrp: 0, // UI-only
    amount: 0,
    taxableAmount: 0,
    sgstAmt: 0,
    cgstAmt: 0,
    igstAmt: 0,
    rawSgstRate: 0,
    rawCgstRate: 0,
    rawIgstRate: 0,
    itemType: 1
  };

  constructor(
    private locationService: LocationMasterService,
    private storageService: StorageService,
    private itemService: ItemMasterService,
    private partsPoService: PartsPoService,
    private route: ActivatedRoute,
    private router: Router,
    private loader: LoaderService,
    public toaster: ToastService,
    private kitCreationService: KitCreationService,
    private kitDetailService: KitDetailService,
    private jobCardService: JobCardService
  ) { }

  ngOnInit() {
    this.loadShowroomLocations();
    this.loadItemMasterList();
    this.loadKitList();
    this.loadJobCards();

    this.route.params.subscribe(params => {
      this.ponumber = params['ponumber'];
      if (this.ponumber) {
        // Load details logic would go here if editing
      } else {
        this.generateNewOrderNo();
      }
    });
  }

  generateNewOrderNo() {
    this.orderNo = '1'; // Placeholder
  }

  loadShowroomLocations() {
    const dealerCode = this.storageService.getDealerCode();
    this.locationService.getAllLocationMaster().subscribe({
      next: (allLocs: any[]) => {
        const fullLocationMap = Array.isArray(allLocs) ? allLocs : [];
        this.locationService.getLocationByDealerCode(dealerCode).subscribe({
          next: (res: any) => {
            const dealerLocs = Array.isArray(res) ? res : [];
            this.locationList = dealerLocs.map(loc => {
              const matchedLoc = fullLocationMap.find(m =>
                (m.locname || '').trim().toLowerCase() === (loc.locname || '').trim().toLowerCase()
              );
              return {
                ...loc,
                state: matchedLoc?.state || matchedLoc?.State || loc.state || loc.State || ''
              };
            });
            if (this.locationList.length > 0 && !this.selectedLocation) {
              this.selectedLocation = this.locationList[0].locname;
            }
          }
        });
      }
    });
  }

  onLocationChange() {
    this.locationInvalid = false;
    this.calculateRowTotals();
  }

  onPoTypeChange() {
    this.orderTypeInvalid = false;
    if (this.poType !== 'SSOMSO') {
      this.isKit = false;
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
      (j.jobNo || '').toString().trim() === this.vorDetails.jobNo.toString().trim()
    );

    if (job) {
      this.vorDetails = {
        jobNo: job.jobNo,
        chassisNo: job.chassisNo || '',
        registerNo: job.registerNo || '',
        engineNo: job.engineNo || '',
        jobType: job.jobtype || '',
        serviceHead: job.serviceHead || '',
        serviceType: job.serviceType || '',
        partyName: job.customerName || '',
        mobileNo: job.mobileNo || '',
        modelNo: job.modelName || ''
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

  loadItemMasterList() {
    // For Parts, grpidno is 1, itemType is 2
    this.itemService.getItems(1, '', 2).subscribe({
      next: (res: any[]) => {
        this.modelList = Array.isArray(res) ? res : [];
      },
      error: (err) => console.error('Error loading item master:', err)
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

    if (this.isKit) {
      const selectedKit = this.kitList.find(k => k.id === Number(this.currentItem.partNo) || k.kitName === this.currentItem.partNo);
      if (selectedKit) {
        this.currentItem.description = selectedKit.kitName || '';
      }
      return;
    }

    this.loader.show();
    this.itemService.getPurchaseDetailsWithHsnTaxByModelNo(this.currentItem.partNo).subscribe({
      next: (res: any) => {
        this.loader.hide();
        if (res) {
          const getVal = (obj: any, ...keys: string[]) => {
            for (const key of keys) {
              if (obj[key] !== undefined) return obj[key];
            }
            return 0;
          };

          this.currentItem.description = res.itemdesc || res.itemDesc || res.Itemdesc;
          this.currentItem.rawSgstRate = getVal(res, 'Sgst', 'sgst', 'SGST');
          this.currentItem.rawCgstRate = getVal(res, 'Cgst', 'cgst', 'CGST');
          this.currentItem.rawIgstRate = getVal(res, 'Igst', 'igst', 'IGST');
          this.currentItem.rate = getVal(res, 'Ipurrate', 'ipurrate', 'IPURRATE', 'rate');
          this.currentItem.mrp = 0; // Default MRP
          this.currentItem.itemType = res.itemtype || res.itemType || 1;

          this.calculateRowTotals();
        }
      },
      error: (err) => {
        this.loader.hide();
      }
    });
  }

  calculateRowTotals() {
    let qty = Number(this.currentItem.qty) || 0;
    let rate = Number(this.currentItem.rate) || 0;

    let taxableAmount = (qty * rate);
    this.currentItem.taxableAmount = taxableAmount > 0 ? taxableAmount : 0;

    const dealerLoc = this.locationList.find(l =>
      ((l.locname || '').trim().toLowerCase()) ===
      ((this.selectedLocation || '').trim().toLowerCase())
    ) || (this.locationList.length > 0 ? this.locationList[0] : null);

    const locState = (dealerLoc?.state || '').trim();
    
    const rawSgstRate = Number(this.currentItem.rawSgstRate) || 0;
    const rawCgstRate = Number(this.currentItem.rawCgstRate) || 0;
    const rawIgstRate = Number(this.currentItem.rawIgstRate) || 0;

    let isInterstate = locState ? locState.toLowerCase() !== 'maharashtra' : false;

    if (this.selectedTransactionType === 'I') {
      isInterstate = true;
    } else if (this.selectedTransactionType === 'L') {
      isInterstate = false;
    }

    if (isInterstate) {
      this.currentItem.sgstAmt = 0;
      this.currentItem.cgstAmt = 0;
      this.currentItem.igstAmt = (this.currentItem.taxableAmount * rawIgstRate) / 100;
    } else {
      this.currentItem.sgstAmt = (this.currentItem.taxableAmount * rawSgstRate) / 100;
      this.currentItem.cgstAmt = (this.currentItem.taxableAmount * rawCgstRate) / 100;
      this.currentItem.igstAmt = 0;
    }

    this.currentItem.amount = this.currentItem.taxableAmount + this.currentItem.sgstAmt + this.currentItem.cgstAmt + this.currentItem.igstAmt;
    
    // Reset flags if values are present
    if (this.currentItem.qty > 0) this.qtyInvalid = false;
    if (this.selectedTransactionType) this.transactionTypeInvalid = false;
  }

  addPurchaseItem() {
    this.locationInvalid = !this.selectedLocation;
    this.transactionTypeInvalid = !this.selectedTransactionType;
    this.orderTypeInvalid = !this.poType;
    this.partNoInvalid = !this.currentItem.partNo;
    this.qtyInvalid = !this.currentItem.qty || this.currentItem.qty <= 0;

    if (this.locationInvalid || this.transactionTypeInvalid || this.orderTypeInvalid || this.partNoInvalid || this.qtyInvalid) {
      return;
    }

    if (this.isKit) {
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

          details.forEach((det: any) => {
            const kitItem = {
              partNo: det.itemName || det.item?.itemcode || det.itemcode || det.itemId,
              description: det.itemDescription || det.item?.itemdesc || det.description || det.itemName || '',
              qty: det.quantity || 0,
              rate: det.item?.ipurrate || det.rate || 0,
              mrp: det.item?.mrp || 0,
              amount: 0,
              taxableAmount: 0,
              sgstAmt: 0,
              cgstAmt: 0,
              igstAmt: 0,
              rawSgstRate: det.item?.sgst || 0,
              rawCgstRate: det.item?.cgst || 0,
              rawIgstRate: det.item?.igst || 0,
              itemType: det.item?.itemtype || 1,
              fromKit: true
            };

            // Potential duplicate check per item if needed
            this.purchaseDetails.push(kitItem);
          });

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
      const isDuplicate = this.purchaseDetails.some((item, index) =>
        item.partNo === this.currentItem.partNo && index !== this.editingIndex
      );

      if (isDuplicate) {
        this.toaster.show(`Part "${this.currentItem.description}" is already added.`, { classname: 'bg-danger text-white', delay: 5000 });
        return;
      }

      // Attempt to set a fallback description if still empty
      if (!this.currentItem.description) {
          const fallbackModel = this.modelList.find(m => m.itemcode === this.currentItem.partNo);
          if (fallbackModel) {
              this.currentItem.description = fallbackModel.itemdesc || fallbackModel.itemname || fallbackModel.Itemname || fallbackModel.description || '';
          }
      }

      this.calculateRowTotals();

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
  }

  resetCurrentItem() {
    this.currentItem = {
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
      itemType: 1
    };
    this.editingIndex = null;
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
    this.editingIndex = actualIndex;
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

  onSave() {
    if (this.purchaseDetails.length === 0) {
      this.toaster.show('Please add at least one item.', { classname: 'bg-danger text-white', delay: 3000 });
      return;
    }

    if (this.isSaving) return;
    this.isSaving = true;
    this.loader.show();

    const dealerCode = this.storageService.getDealerCode();
    // PONumber is Prefix + OrderNo logic can be added later if needed. For now using orderNo.
    const poModel = {
      PONumber: this.prefixNo + this.orderNo,
      PODate: this.poDate,
      POType: this.poType,
      CustomerCode: dealerCode,
      TransactionType: this.selectedTransactionType,
      Items: this.purchaseDetails.map((item) => ({
        ItemCode: item.partNo,
        Qty: item.qty
      }))
    };

    this.partsPoService.createPartsPurchaseOrder(poModel).subscribe({
      next: (res) => {
        this.loader.hide();
        this.isSaving = false;
        if (res.success) {
          this.toaster.show(res.message, { classname: 'bg-success text-white', delay: 5000 });
          this.router.navigate(['/parts-po-list']);
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

  onSubmitToERP() {
    this.toaster.show('Submit to ERP logic to be implemented.', { classname: 'bg-info text-white', delay: 3000 });
    // This will hit the /SendToERP endpoint eventually
  }

  onCancel() {
    this.router.navigate(['/parts-po-list']);
  }
}
