import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoaderService } from '../../../core/services/loader';
import { StorageService } from '../../../core/services/storage';
import { ToastService } from '../../../shared/toaster/toast-service';
import { WarrantyJCClaimService } from '../../../core/services/warranty-jcclaim-service';

@Component({
  selector: 'app-warranty-claim-list',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './warranty-claim-list.html',
  styleUrl: './warranty-claim-list.scss',
})
export class WarrantyClaimList implements OnInit {

  claims: any[] = [];
  totalCount: number = 0;
  totalPages: number = 0;
  printing: boolean = false;

  filter: any = {
    dateFrom: '',
    dateTo: '',
    chassisNo: '',
    claimNo: null,
    pageNumber: 1,
    pageSize: 25
  };

  constructor(
    private router: Router,
    private loader: LoaderService,
    private storageService: StorageService,
    private toaster: ToastService,
    private warrantyJCClaimService: WarrantyJCClaimService
  ) { }

  ngOnInit(): void {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.filter.dateFrom = this.formatDate(firstDayOfMonth);
    this.filter.dateTo = this.formatDate(today);

    this.search();
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  search(): void {
    this.loader.show();
    const dealerCode = this.storageService.getDealerCode();
    const payload = { ...this.filter, dealerCode };

    this.warrantyJCClaimService.searchWarrantyJCClaims(payload).subscribe({
      next: (res: any) => {
        this.loader.hide();
        this.claims = res?.items || [];
        this.totalCount = res?.totalCount || 0;
        this.totalPages = res?.totalPages || 0;
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show('Failed to load Warranty Claims.', { classname: 'bg-danger text-white', delay: 3000 });
      }
    });
  }

  resetFilter(): void {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.filter = {
      dateFrom: this.formatDate(firstDayOfMonth),
      dateTo: this.formatDate(today),
      chassisNo: '',
      claimNo: null,
      pageNumber: 1,
      pageSize: 25
    };
    this.search();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.filter.pageNumber = page;
    this.search();
  }

  // Prints every record matching the current filter (not just the visible
  // page) as a PDF, opened in a new tab.
  printList(): void {
    if (this.printing) return;

    this.printing = true;
    this.loader.show();
    const dealerCode = this.storageService.getDealerCode();
    const payload = { ...this.filter, dealerCode };

    this.warrantyJCClaimService.printWarrantyJCClaimList(payload).subscribe({
      next: (blob: Blob) => {
        this.loader.hide();
        this.printing = false;
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
      },
      error: (err) => {
        this.loader.hide();
        this.printing = false;
        console.error(err);
        this.toaster.show('Failed to generate the Warranty Claim List PDF.', {
          classname: 'bg-danger text-white',
          delay: 3000
        });
      }
    });
  }

  back(): void {
    this.router.navigate(['/warranty-job-card-claim']);
  }

  // Double-click a row - navigates to the main Warranty JobCard Claim page
  // showing this specific claim's details. Same sessionStorage handoff
  // pattern already used by the Warranty Order List's own "View" action -
  // no dedicated /warranty-job-card-claim/:id route exists (single flat
  // route by design), so the id is passed via sessionStorage instead of a
  // route param.
  viewClaim(id: number): void {
    sessionStorage.setItem('viewWarrantyJCClaimId', String(id));
    this.router.navigate(['/warranty-job-card-claim']);
  }

  // Prints a single claim (grid's per-row Action button).
  printingClaimId: number | null = null;

  printClaim(id: number): void {
    if (this.printingClaimId) return;

    this.printingClaimId = id;
    this.loader.show();
    this.warrantyJCClaimService.printWarrantyJCClaim(id).subscribe({
      next: (blob: Blob) => {
        this.loader.hide();
        this.printingClaimId = null;
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
      },
      error: (err) => {
        this.loader.hide();
        this.printingClaimId = null;
        console.error(err);
        this.toaster.show('Failed to generate the claim PDF.', {
          classname: 'bg-danger text-white',
          delay: 3000
        });
      }
    });
  }

  // Deletes a single claim (grid's per-row Action button). No longer
  // blocked by an existing order link - the backend removes that link
  // row itself now rather than rejecting the delete.
  deletingClaimId: number | null = null;

  deleteClaim(id: number): void {
    if (this.deletingClaimId) return;

    if (!confirm('Are you sure you want to delete this Warranty Claim? This cannot be undone.')) {
      return;
    }

    this.deletingClaimId = id;
    this.loader.show();
    this.warrantyJCClaimService.deleteWarrantyJCClaim(id).subscribe({
      next: () => {
        this.loader.hide();
        this.deletingClaimId = null;
        this.toaster.show('Warranty Claim deleted successfully.', {
          classname: 'bg-success text-white',
          delay: 3000
        });
        // Remove locally for immediate feedback instead of a full re-search.
        this.claims = this.claims.filter(c => c.id !== id);
        this.totalCount = Math.max(0, this.totalCount - 1);
      },
      error: (err) => {
        this.loader.hide();
        this.deletingClaimId = null;
        console.error(err);
        const serverMsg = typeof err?.error === 'string' ? err.error : 'Failed to delete the Warranty Claim.';
        this.toaster.show(serverMsg, {
          classname: 'bg-danger text-white',
          delay: 5000
        });
      }
    });
  }
}