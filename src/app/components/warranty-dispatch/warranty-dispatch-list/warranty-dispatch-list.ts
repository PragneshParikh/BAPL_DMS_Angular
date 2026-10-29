import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StorageService } from '../../../core/services/storage';
import { WarrantyDispatchService } from '../../../core/services/warranty-dispatch-service';
import { ToastService } from '../../../shared/toaster/toast-service';

@Component({
  selector: 'app-warranty-dispatch-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './warranty-dispatch-list.html',
  styleUrl: './warranty-dispatch-list.scss',
})
export class WarrantyDispatchList implements OnInit {
  dispatchList: any[] = [];
  dateFrom: string = '';
  dateTo: string = '';
  slipNo: string = '';

  constructor(
    private router: Router,
    private storageService: StorageService,
    private dispatchService: WarrantyDispatchService,
    private toaster: ToastService
  ) {}

  ngOnInit(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    this.dateFrom = firstDay.toISOString().split('T')[0];
    this.dateTo = today.toISOString().split('T')[0];

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