import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReceiptEntryService } from '../../core/services/receipt-entry-service';
import { StorageService } from '../../core/services/storage';
import { cashAccounts } from '../../constant';
import { JobCardService } from '../../core/services/job-card-service';

@Component({
  selector: 'app-repair-bill',
  imports: [FormsModule, CommonModule],
  templateUrl: './repair-bill.html',
  styleUrl: './repair-bill.scss',
})
export class RepairBill implements OnInit {

  currentDate: string = new Date().toISOString().split('T')[0];
  selectedLocation: string = '';
  locations: any[] = [];
  jobCardList: any[] = [];
  selectedJobCard: any = {};
  showJobDetails = false;
  selectedLocationCode: any;
  selectedCashAccount: number | null = null;
  modalService: any;
  cashAccounts = cashAccounts;
  showPreviousYearJobs: boolean = false;
  isSuperAdmin: boolean;
  showSelectedJob: boolean;


  constructor(private receiptEntryService: ReceiptEntryService,
    private storageService: StorageService,
    private jobCardService: JobCardService
  ) {

  }
  ngOnInit(): void {
    this.fetchLocations();
  }


  fetchLocations(): void {
    const dealerCode = this.storageService.getDealerCode();
    this.receiptEntryService.getLocationList(dealerCode).subscribe({
      next: (data: any[]) => {
        // only Workshop
        this.locations = data.filter(x => x.locareadidNo === 2);
        // auto select first workshop location
        if (this.locations.length > 0) {
          this.selectedLocation = this.locations[0].locname;
          this.selectedLocationCode = this.locations[0].locCode;
        }
      },
      error: (err) => {
        console.error('Error fetching locations', err);
      }
    });
  }
  showPopup = false;

  openPopup(): void {
    this.showPopup = true;
  }

  closePopup(): void {
    this.showPopup = false;
  }
  loadJobCardList():void {
    // this.lodder = true;
    let dealerCode = '';
    if (!this.isSuperAdmin) {
      dealerCode = this.storageService.getDealerCode();
    }

    this.jobCardService.getJobCardList(dealerCode).subscribe({
      next: (res) => {
        this.jobCardList = res;
        //console.log("listing : ", res)
        // this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching job cards', err);
        // this.loading = false;
      }
    });
  }

onSelect(item: any) {
  this.selectedJobCard = item;
  this.showPopup = false;

  this.showJobDetails = true;
}
toggleJobDetails() {
  this.showJobDetails = !this.showJobDetails;
   this.showSelectedJob = !this.showSelectedJob;
}



}
