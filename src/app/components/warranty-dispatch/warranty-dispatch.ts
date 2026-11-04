import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PrefixService } from '../../core/services/prefix'; 
import { StorageService } from '../../core/services/storage';
import { DispatchMasterService } from '../../core/services/dispatch-master-service';
import { WarrantyDispatchService } from '../../core/services/warranty-dispatch-service';
import { Router } from '@angular/router';
import { ToastService } from '../../shared/toaster/toast-service'; // import path
@Component({
  selector: 'app-warranty-dispatch',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './warranty-dispatch.html',
  styleUrls: ['./warranty-dispatch.scss']
})
export class WarrantyDispatch implements OnInit {
  dispatchForm!: FormGroup;
  pendingSlips: any[] = [];
  dispatchThruList: any[] = [];

  constructor(
    private fb: FormBuilder,
    private prefixService: PrefixService,
    private storageService: StorageService,
    private dispatchMasterService: DispatchMasterService,
    private dispatchService: WarrantyDispatchService,
    private toaster: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];

    this.dispatchForm = this.fb.group({
      slipPrefix: [{ value: '', disabled: true }], 
      boxCount: [''],
      dispNo: [''], 
      docDate: [today],
      dispatchedThrough: [''],
      contactPerson: [''],
      mobileNumber: [''],
      courierCharges: [''],
      docNo: ['']  
    });

    this.loadWarrantyDispatchPrefix();
    this.loadDispatchThruOptions();
    this.loadPendingSlips();
  }

  goToDispatchList(): void {
  this.router.navigate(['/warranty-dispatch-list']);
}

  // loadPendingSlips() {
  //   const dealerCode = this.storageService.getDealerCode();

  //   const filter = {
  //     dealerCode: dealerCode,
  //     includeInactive: false,
  //     pageNumber: 1,
  //     pageSize: 100
  //   };

  //   this.dispatchService.searchWarrantyPackingSlips(filter).subscribe({
  //     next: (res: any) => {
  //       const data = res.items || res.Items || (Array.isArray(res) ? res : []);
        
  //       this.pendingSlips = data.map((item: any) => ({
  //         id: item.id || item.Id,
  //         selected: false,
  //         slipPrefix: item.slipPrefix || item.SlipPrefix || '',
  //         slipNo: item.slipNo || item.SlipNo || '',
  //         slipDate: item.slipDate || item.SlipDate || '',
  //         invoiceNo: item.invoiceNo || item.InvoiceNo || '',
  //         invoiceDate: item.invoiceDate || item.InvoiceDate || '',
  //         expanded: false,
  //         details: null,
  //         loadingDetails: false
  //       }));
  //     },
  //     error: (err) => {
  //       console.error('Error fetching pending slips:', err);
  //     }
  //   });
  // }
  loadPendingSlips() {
  const dealerCode = this.storageService.getDealerCode();
  
  if (!dealerCode) {
    return;
  }

  const filter = {
    dealerCode: dealerCode,
    includeInactive: false,
    pageNumber: 1,
    pageSize: 100
  };

  this.dispatchService.searchWarrantyPackingSlips(filter).subscribe({
    next: (res: any) => {
      const data = res.items || res.Items || (Array.isArray(res) ? res : []);
      this.pendingSlips = data.map((item: any) => ({
        id: item.id || item.Id,
        selected: false,
        slipPrefix: item.slipPrefix || item.SlipPrefix || '',
        slipNo: item.slipNo || item.SlipNo || '',
        slipDate: item.slipDate || item.SlipDate || '',
        invoiceNo: item.invoiceNo || item.InvoiceNo || '',
        invoiceDate: item.invoiceDate || item.InvoiceDate || '',
        expanded: false,
        details: null,
        loadingDetails: false
      }));
    },
    error: (err) => {
      console.error('Error fetching pending slips:', err);
    }
  });
}
  
  loadDispatchForView(id: number): void {
  this.dispatchService.getWarrantyDispatchById(id).subscribe({
    next: (res: any) => {
      const d = res?.data || res;
      this.dispatchForm.patchValue({
        slipPrefix: d.slipPrefix ?? d.SlipPrefix,
        boxCount: d.boxCount ?? d.BoxCount,
        docNo: d.docNo ?? d.DocNo,
        docDate: (d.docDate ?? d.DocDate)?.substring(0, 10),
        dispatchedThrough: d.dispatchedThrough ?? d.DispatchedThrough,
        contactPerson: d.contactPerson ?? d.ContactPerson,
        mobileNumber: d.mobileNumber ?? d.MobileNumber,
        courierCharges: d.courierCharges ?? d.CourierCharges,
        grNo: d.grNo ?? d.GrNo
      });

      const details = d.warrantyDispatchDetails || d.WarrantyDispatchDetails || [];
      this.pendingSlips = details.map((x: any) => {
        const s = x.warrantyPackingSlipHeader || x.WarrantyPackingSlipHeader || {};
        return {
          id: s.id ?? s.Id ?? x.warrantyPackingSlipHeaderId,
          selected: true,
          slipPrefix: s.slipPrefix ?? '',
          slipNo: s.slipNo ?? '',
          slipDate: s.slipDate ?? '',
          invoiceNo: '',
          invoiceDate: '',
          expanded: false, details: null, loadingDetails: false
        };
      });
      this.dispatchForm.disable();
    },
    error: () => this.toaster.show('Failed to load dispatch.', { classname: 'bg-danger text-white', delay: 3000 })
  });
}

  // loadWarrantyDispatchPrefix() {
  //   this.prefixService.get().subscribe({
  //     next: (res: any) => {
  //       const match = res.find((x: any) => 
  //         x.sequenceName === 'warranty_dispatch' || x.sequenceName === 'Warranty Dispatch'
  //       );
  //       if (match && match.sequenceCode) {
  //         let cleanPrefix = match.sequenceCode.replace(/###/g, ''); 
  //         this.dispatchForm.patchValue({ slipPrefix: cleanPrefix });
  //       }
  //     }
  //   });
  // }

  loadWarrantyDispatchPrefix() {
    this.prefixService.get().subscribe({
      next: (res: any) => {
        const match = res.find((x: any) => 
          x.sequenceName === 'warranty_dispatch' || x.sequenceName === 'Warranty Dispatch'
        );
        if (match) {
         
          if (match.sequenceCode) {
            let cleanPrefix = match.sequenceCode.replace(/###/g, ''); 
            this.dispatchForm.patchValue({ slipPrefix: cleanPrefix });
          }
          if (match.nextNo || match.currentNo || match.runningNo) {
            this.dispatchForm.patchValue({ dispNo: match.nextNo || match.currentNo || match.runningNo });
          }
        }
      }
    });
  }


  loadDispatchThruOptions() {
    this.dispatchMasterService.search('Dispatch Thru Master', '', 1, 100).subscribe({
      next: (res: any) => {
        const data = res.data || res.list || [];
        this.dispatchThruList = data.filter((x: any) => x.isActive === true);
      }
    });
  }

  
  toggleSelectAll(event: any): void {
    const isChecked = event.target.checked;
    if (this.pendingSlips && this.pendingSlips.length > 0) {
      this.pendingSlips.forEach((item: any) => {
        item.selected = isChecked;
      });
    }
  }

  toggleDetails(item: any): void {
    item.expanded = !item.expanded;
    if (item.expanded && !item.details) {
      item.loadingDetails = true;
      this.dispatchService.getPackingSlipById(item.id).subscribe({
        next: (res: any) => {
          item.details = res.data || res;
          item.loadingDetails = false;
        },
        error: (err) => {
          console.error('Error fetching slip details:', err);
          item.loadingDetails = false;
        }
      });
    }
  }

  viewDetails(item: any) {
    console.log('Selected item details:', item);
    this.toggleDetails(item);
  }

  // onSubmit() {
  //   const formData = this.dispatchForm.getRawValue();
  //   const selectedSlips = this.pendingSlips.filter(x => x.selected);
  //   console.log('Form Data:', formData);
  //   console.log('Selected Slips:', selectedSlips);
  // }
onSubmit() {
 
  const selectedSlips = this.pendingSlips.filter(x => x.selected);
  if (selectedSlips.length === 0) {
    this.toaster.show('Please select at least one packing slip!', { classname: 'bg-warning text-white', delay: 3000 });
    return;
  }

 
  const formData = this.dispatchForm.getRawValue();
  const dealerCode = this.storageService.getDealerCode();

  const payload = {
    dealerCode: dealerCode,
    slipPrefix: formData.slipPrefix,
    boxCount: Number(formData.boxCount) || 0,
    dispNo: Number(formData.dispNo) || 0,
    docDate: formData.docDate,
    dispatchedThrough: formData.dispatchedThrough,
    contactPerson: formData.contactPerson,
    mobileNumber: formData.mobileNumber,
    courierCharges: Number(formData.courierCharges) || 0,
    docNo: formData.docNo,
    packingSlipIds: selectedSlips.map(s => s.id)
  };

  console.log('Sending Payload to API:', payload);

 
  this.dispatchService.saveWarrantyDispatch(payload).subscribe({
    next: (res: any) => {
      
      this.toaster.show('Warranty Dispatch saved successfully!', { classname: 'bg-success text-white', delay: 3000 });
      
      this.pendingSlips = this.pendingSlips.filter(s => !s.selected);

      this.dispatchForm.reset();
      this.loadWarrantyDispatchPrefix();
      
      const today = new Date().toISOString().split('T')[0];
      this.dispatchForm.patchValue({ docDate: today });

     
    },
    error: (err: any) => {
      console.error('Save Error:', err);
      const serverMsg = err?.error?.message || err?.message || 'Error while saving Warranty Dispatch.';
      // Red Toaster Error
      this.toaster.show(serverMsg, { classname: 'bg-danger text-white', delay: 5000 });
    }
  });
}
}