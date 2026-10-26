import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StorageService } from '../../../core/services/storage';
import { WarrantyDispatchService } from '../../../core/services/warranty-dispatch-service';
import { ToastService } from '../../../shared/toaster/toast-service';
import { MenuAccessService } from '../../../core/services/menu-access.service';

@Component({
  selector: 'app-warranty-dispatch-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './warranty-dispatch-list.html',
  styleUrl: './warranty-dispatch-list.scss',
})
export class WarrantyDispatchList implements OnInit {
  readonly SUBMENU_ID = 129;
  dispatchList: any[] = [];
  dateFrom: string = '';
  dateTo: string = '';
  slipNo: string = '';
  canDelete = false;
  isAdmin = false;

  constructor(
    private router: Router,
    private storageService: StorageService,
    private dispatchService: WarrantyDispatchService,
    private toaster: ToastService,
    private menuAccess: MenuAccessService
  ) {
    this.canDelete = this.menuAccess.canDelete(this.SUBMENU_ID);
    const role = this.storageService.getRole();
    this.isAdmin = role === 'Admin' || role === 'SuperAdmin' || this.canDelete;
  }

  ngOnInit(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    this.dateFrom = firstDay.toISOString().split('T')[0];
    this.dateTo = today.toISOString().split('T')[0];

   this.isAdmin = true;

    this.searchDispatches();
  }

  searchDispatches(): void {
    const dealerCode = this.storageService.getDealerCode();
    const filter = {
      dealerCode: dealerCode,
      dateFrom: this.dateFrom,
      dateTo: this.dateTo,
      slipNo: this.slipNo,
      pageNumber: 1,
      pageSize: 100
    };


    this.dispatchService.searchWarrantyDispatch(filter).subscribe({
      next: (res: any) => {
        this.dispatchList = res.items || res.Items || (Array.isArray(res) ? res : []);
      },
      error: (err) => {
        console.error('Error fetching dispatch list:', err);
        this.toaster.show('Failed to load dispatch list.', { classname: 'bg-danger text-white', delay: 3000 });
      }
    });
  }


  deleteDispatch(id: number, event: Event): void {
    event.stopPropagation(); 

    const role = this.storageService.getRole();
    const isActualAdmin = role === 'Admin' || role === 'SuperAdmin';

    if (!isActualAdmin) {
      this.toaster.show('Only Admin is allowed to delete this dispatch record.', { 
        classname: 'bg-warning text-dark', 
        delay: 4000 
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this dispatch record?')) {
      return;
    }

    this.dispatchService.deleteWarrantyDispatch(id).subscribe({
      next: () => {
        this.toaster.show('Warranty Dispatch deleted successfully!', { classname: 'bg-success text-white', delay: 3000 });
        this.searchDispatches();
      },
      error: (err) => {
        console.error('Delete error:', err);
        this.toaster.show('Failed to delete dispatch.', { classname: 'bg-danger text-white', delay: 3000 });
      }
    });
  }
  
  goToNewDispatch(): void {
    this.router.navigate(['/warranty-dispatch']);
  }

  
  
  onRowDoubleClick(item: any): void {
    const dispatchId = item.id || item.Id;
    this.router.navigate(['/warranty-dispatch', dispatchId]);
  }

  back(): void {
    this.router.navigate(['/warranty-dispatch']);
  }
}