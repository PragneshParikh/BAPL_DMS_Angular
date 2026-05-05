import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../core/services/storage';
import { ReceiptEntryService } from '../../core/services/receipt-entry-service';
import { LocationName } from '../../ViewModels/ReceiptEntryModel';

@Component({
  selector: 'app-ffir',
  imports: [FormsModule, CommonModule],
  templateUrl: './ffir.html',
  styleUrl: './ffir.scss',
})
export class FFIR {

  locations: LocationName[];
  selectedLocation: string = '';
  isEditMode = false;
  editId: number = 0;
  chassiseditData: any = null;
  constructor(private storageService: StorageService,
    private receiptEntryService: ReceiptEntryService) { }


  //Fetech Dealer Location
  fetchLocations(): void {
    const dealerCode = this.storageService.getDealerCode();
    this.receiptEntryService.getLocationList(dealerCode).subscribe({
      next: (data: any[]) => {
        // only Workshop (id = 2)
        this.locations = data.filter(x => x.locareadidNo === 2);
        // EDIT MODE FIX
        if (this.isEditMode && this.chassiseditData) {
          // backend value assign
          this.selectedLocation = this.chassiseditData.jobCardHeader.serviceloc;
          // OPTIONAL (safe match)
          const match = this.locations.find(
            x => x.locname === this.selectedLocation
          );
          if (match) {
            this.selectedLocation = match.locname;
          }
        }
        //console.log("Workshop Locations", this.locations);
      },
      error: (err) => {
        console.error('Error fetching locations', err);
      }
    });
  }

  onFileSelected(event: any, index: number) {
    const file = event.target.files[0];
    if (!file) return;

    // this.detailList[index].file = file;

    if (file.type.startsWith('image/')) {
      //this.detailList[index].preview = URL.createObjectURL(file);
    }
  }
  onLocationChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedLocation = target.value;

    console.log('Selected Location:', this.selectedLocation);
  }
}
