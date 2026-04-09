import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LotInspectionUpdate, Header, Detail } from '../../../../ViewModels/LotInspectionViewModel';
import { LotInspectionDetailsservice } from '../../../../core/services/lot-inspection-details-service';
import { StorageService } from '../../../../core/services/storage';
import { LoaderService } from '../../../../core/services/loader';
import { ToastService } from '../../../../shared/toaster/toast-service';
import { LocationName } from '../../../../ViewModels/ReceiptEntryModel';
import { ReceiptEntryService } from '../../../../core/services/receipt-entry-service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-lot-inspection-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lot-inspection-details.html',
  styleUrl: './lot-inspection-details.scss',
})
export class LotInspectionDetails implements OnInit {

  invoiceNo: string = '';
  headerObj: Header = {} as Header;
  detailList: Detail[] = [];
  locations: LocationName[];
  selectedLocation: string = '';
  selectedvehiclefasteringcover: string = '';
  selectedPlastingcover: string = '';
  selectedSupervisor: string = '';
  router: any;

  constructor(
    private route: ActivatedRoute,
    private lotInspectionDetailservice: LotInspectionDetailsservice,
    private receiptEntryService: ReceiptEntryService,
    public toaster: ToastService,
    private loader: LoaderService,
    private storageService: StorageService
  ) { }

  ngOnInit(): void {

    this.fetchLocations();
    this.route.paramMap.subscribe(params => {
      this.invoiceNo = params.get('invoiceNo') || '';

      if (this.invoiceNo) {
        this.getInvoiceData();
      } else {
        console.log('error')
        //this.loader.hide(); // important if no invoiceNo
      }
    });
  }

  fetchLocations(): void {
    const dealerCode = this.storageService.getDealerCode();
    this.receiptEntryService.getLocationList(dealerCode).subscribe({
      next: (data: any[]) => {
        // only Workshop (id = 2)
        this.locations = data.filter(x => x.locareadidNo === 2);
        //console.log("Workshop Locations", this.locations);
      },
      error: (err) => {
        console.error('Error fetching locations', err);
      }
    });
  }
  onLocationChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedLocation = target.value;

    console.log('Selected Location:', this.selectedLocation);
  }
  onvehiclefasteringcoverChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedvehiclefasteringcover = target.value;

    console.log('Selected vehcilefasteringcover:', this.selectedvehiclefasteringcover);
  }
  onPlastingCoverChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedPlastingcover = target.value;

    console.log('Selected Plastingcover:', this.selectedPlastingcover);
  }
  onSupervicsorChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedSupervisor = target.value;

    console.log('Selected Supervisor:', this.selectedSupervisor);
  }

  // ================= GET DATA =================
  getInvoiceData() {
    this.loader.show();
    // current datetime 
    const today = new Date();
    const now = new Date();
    const defaultvalue = 1;
    //current time 
    const formattedDate = today.toISOString().split('T')[0];
    const formattedTime =
      String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0');

    this.lotInspectionDetailservice.getAllDetailsByInvoice(this.invoiceNo).subscribe({
      next: (res: any) => {

        if (res?.data?.length) {

          const first = res.data[0];

          // HEADER
          this.headerObj = {
            invoiceNo: first.invoiceNo,
            invoiceDate: first.invoiceDate,
            lotNo: first.lotNo,
            arrivalDate: first.arrivalDate || formattedDate,
            arrivalTime: first.arrivalTime || formattedTime,
            lrNo: first.lrNo,
            lrDate: first.lrDate || formattedDate,
            truckNo: first.truckNo,
            transporterName: first.transporterName,
            driverName: first.driverName,
            driverContact: first.driverContact,
            commonRemarks: first.commonRemarks,
            vehicleFasteningBracket: first.vehicleFasteningBracket || this.selectedvehiclefasteringcover,
            plasticCover: first.plasticCover || this.selectedPlastingcover,
            nameSupervisor: first.nameSupervisor || this.selectedSupervisor,
            locationName: first.locationName || this.selectedLocation,
            dealerCode: this.storageService.getDealerCode()
          };

          // DETAILS
          this.detailList = res.data.map((x: any) => ({
            id: x.id,
            lotHeaderID: x.lotHeaderID,
            modelName: x.modelName,
            chassisNo: x.chassisNo,
            motorNo: x.motorNo,
            batteryNo: x.batteryNo,
            chargerNo: x.chargerNo,

            keyFobSetQty: x.keyFobSetQty || defaultvalue,
            chargerQty: x.chargerQty || defaultvalue,
            mirrorSetQty: x.mirrorsetQty || defaultvalue,
            firstAidKitQty: x.firstaidkitQty || defaultvalue,
            toolkitQty: x.toolKitQty || defaultvalue,
            ownersManual: x.ownersManual || defaultvalue,
            ignitionKeySet: x.ignitionKeyset || defaultvalue,
            attributeCard: x.attributeCard || defaultvalue,
            chargingKit: x.chargingKit || defaultvalue,

            inspectionDate: x.inspectionDate || formattedDate,
            vehicleStatus: x.vehicleStatus,
            damageDetails: x.damageDetails,
            chassisWiseRemarks: x.chassisWiseRemarks,
            UpdatedBy: 'Admin',
            UpdatedDate: this.formatDate(new Date()),

            file: null,
            preview: null
          }));
          //this.loader.hide();
          console.log("Header:", this.headerObj);
          console.log("Details:", this.detailList);
        }
        setTimeout(() => {
          this.loader.hide();
        });
      },
      error: (err) => {
        console.error('Error fetching locations', err);
        this.loader.hide();
      }
    });
  }

  // ================= SAVE DATA =================
  saveData() {

    // VALIDATION FIRST
    const invalidRows = this.detailList.filter(x => !x.vehicleStatus || x.vehicleStatus === '');

    if (invalidRows.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Vehicle Status Error',
        text: 'Please select Vehicle Status for all ChassisNo.',
        confirmButtonColor: '#747CA0',
        width: '260px',
        padding: '0.3em'
      });
      return;
    }

    // THEN PREPARE DATA
    let model = {
      lotInspectedHeaderDetails: {},
      lotInspectedDetails: []
    };

    let formData = {
      invoiceNo: this.headerObj.invoiceNo || '',
      invoiceDate: this.headerObj.invoiceDate,
      dealerCode: this.headerObj.dealerCode || '',
      arrivalDate: this.headerObj.arrivalDate || '',
      arrivalTime: this.headerObj.arrivalTime || '',
      lrNo: this.headerObj.lrNo || '',
      lrDate: this.headerObj.lrDate || '',
      truckNo: this.headerObj.truckNo || '',
      transporterName: this.headerObj.transporterName || '',
      driverName: this.headerObj.driverName || '',
      driverContact: this.headerObj.driverContact || '',
      commonRemarks: this.headerObj.commonRemarks || '',
      vehicleFasteningBracket: this.headerObj.vehicleFasteningBracket || '',
      plasticCover: this.headerObj.plasticCover || '',
      nameSupervisor: this.headerObj.nameSupervisor || '',
      LocationName: this.headerObj.locationName || '',
      updatedBy: 'Admin',
      updatedDate: new Date().toISOString(),
      IsLotInspected: true
    };

    model.lotInspectedHeaderDetails = formData;

    // DETAILS MAPPING
    let invoiceDetails: any[] = [];

    this.detailList.forEach((item) => {
      invoiceDetails.push({
        Id: item.id,
        LotHeaderId: item.lotHeaderID,
        ChassisNo: item.chassisNo || 0,
        KeyFobSetQty: item.keyFobSetQty || 0,
        ChargerQty: item.chargerQty || 0,
        MirrorSetQty: item.mirrorSetQty || 0,
        FirstAidKitQty: item.firstAidKitQty || 0,
        ToolkitQty: item.toolkitQty || 0,
        OwnersManual: item.ownersManual || 0,
        IgnitionKeySet: item.ignitionKeySet || 0,
        AttributeCard: item.attributeCard || 0,
        ChargingKit: item.chargingKit || 0,
        InspectionDate: item.inspectionDate || '',
        VehicleStatus: item.vehicleStatus || '',
        DamageDetails: item.damageDetails || '',
        ChassisWiseRemarks: item.chassisWiseRemarks || '',
        UpdatedBy: item.UpdatedBy || '',
        UpdatedDate: item.UpdatedDate || ''
      });
    });

    model.lotInspectedDetails = invoiceDetails;

    //  NOW SHOW LOADER
    this.loader.show();

    //  API CALL
    this.lotInspectionDetailservice.updateLotInspectedDetails(model).subscribe({
      next: (res) => {
        this.loader.hide();
        this.toaster.show('LOT inspection details Updated successfully!', {
          classname: 'bg-success text-white',
          delay: 3000
        });
      },
      error: (err) => {
        console.error(err);
        this.loader.hide();
        this.toaster.show('Failed to submit Lot Inspection details!', {
          classname: 'bg-danger text-white',
          delay: 5000
        });
      }
    });
  }
  // ================= FILE =================
  onFileSelected(event: any, index: number) {
    const file = event.target.files[0];
    if (!file) return;

    // this.detailList[index].file = file;

    if (file.type.startsWith('image/')) {
      //this.detailList[index].preview = URL.createObjectURL(file);
    }
  }

  // ================= DATE =================
  formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }
}