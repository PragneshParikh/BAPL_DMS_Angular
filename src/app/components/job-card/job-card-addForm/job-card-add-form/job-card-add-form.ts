import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { JobType } from '../../../../constant';
import { StorageService } from '../../../../core/services/storage';
import { ReceiptEntryService } from '../../../../core/services/receipt-entry-service';
import { LocationName } from '../../../../ViewModels/ReceiptEntryModel';

@Component({
  selector: 'app-job-card-add-form',
  standalone:true,
  imports: [CommonModule,FormsModule],
  templateUrl: './job-card-add-form.html',
  styleUrl: './job-card-add-form.scss',
})
export class JobCardAddForm {
  JobType = JobType;
  isOpen: any = {
    job: true,
    battery: false,
    voice: false
  };
  selectedJobtype: string ='';
  locations: LocationName[];
  selectedLocation: string ='';

  constructor(private storageService:StorageService, private receiptEntryService:ReceiptEntryService){}

  ngOnInit(): void {
      this.fetchLocations();
    }
  
    //Fetech Dealer Location
    fetchLocations(): void {
      const dealerCode = this.storageService.getDealerCode();
      this.receiptEntryService.getLocationList(dealerCode).subscribe({
        next: (data: LocationName[]) => {
          this.locations = data;
          // console.log("location data",data)
        },
        error: (err) => {
          console.error('Error fetching locations', err);
        }
      });
    }

  toggle(section: string) {
    Object.keys(this.isOpen).forEach(key => {
      this.isOpen[key] = false;
    });

    this.isOpen[section] = true;
  }

  onLocationChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedLocation = target.value;

    console.log('Selected Location:', this.selectedLocation);
  }
  onJobType(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedJobtype = target.value;

    console.log('Selected Location:', this.selectedJobtype);
  }
}
