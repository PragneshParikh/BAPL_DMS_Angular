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
      next: (data: LocationName[]) => {
        this.locations = data;
        // console.log("location data",data)
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
    this.lotInspectionDetailservice.getAllDetailsByInvoice(this.invoiceNo).subscribe({
      next: (res: any) => {
        this.loader.hide();
        if (res?.data?.length) {

          const first = res.data[0];

          // HEADER
          this.headerObj = {
            invoiceNo: first.invoiceNo,
            invoiceDate: first.invoiceDate,
            lotNo: first.lotNo,
            arrivalDate: first.arrivalDate,
            arrivalTime: first.arrivalTime,
            lrNo: first.lrNo,
            lrDate: first.lrDate,
            truckNo: first.truckNo,
            transporterName: first.transporterName,
            driverName: first.driverName,
            driverContact: first.driverContact,
            commonRemarks: first.commonRemarks,
            vehicleFasteningBracket: first.vehicleFasteningBracket,
            plasticCover: first.plasticCover,
            nameSupervisor: first.nameSupervisor,
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

            keyFobSetQty: x.keyFobSetQty,
            chargerQty: x.chargerQty,
            mirrorSetQty: x.mirrorsetQty,
            firstAidKitQty: x.firstaidkitQty,
            toolkitQty: x.toolKitQty,

            ownersManual: x.ownersManual,
            ignitionKeySet: x.ignitionKeyset,
            attributeCard: x.attributeCard,
            chargingKit: x.chargingKit,

            inspectionDate: x.inspectionDate,
            vehicleStatus: x.vehicleStatus,
            damageDetails: x.damageDetails,
            chassisWiseRemarks: x.chassisWiseRemarks,
            modelWiseSupervisorName: x.modelWiseSupervisorName,
            locationName: x.locationName,
            UpdatedBy: 'Admin',
            UpdatedDate: this.formatDate(new Date()),

            file: null,
            preview: null
          }));
          //this.loader.hide();
          console.log("Header:", this.headerObj);
          console.log("Details:", this.detailList);
        }
      },
      error: (err) => {
        console.error('Error fetching locations', err);
        this.loader.hide();
      }
    });
  }

  // ================= SAVE DATA =================
  saveData() {
    //debugger;
    //update json object
    let model = {
      lotInspectedHeaderDetails: {},
      lotInspectedDetails: []
    };
    // LOT Inspection HEADER (manual mapping)
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
      updatedBy: 'Admin',
      updatedDate: new Date().toISOString()
    }

    model.lotInspectedHeaderDetails = formData;

    //Lot inspection Details mapping
    var invoiceDetails: any[] = [];
    this.detailList.forEach((item, i) => {
      debugger
      const list = {
        Id: item.id,
        LotHeaderId: item.lotHeaderID,
        ChassisNo: (item.chassisNo || 0),
        KeyFobSetQty: (item.keyFobSetQty || 0),
        ChargerQty: (item.chargerQty || 0),
        MirrorSetQty: (item.mirrorSetQty || 0),
        FirstAidKitQty: (item.firstAidKitQty || 0),
        ToolkitQty: (item.toolkitQty || 0),

        OwnersManual: item.ownersManual || 0,
        IgnitionKeySet: item.ignitionKeySet || 0,


        InspectionDate: item.inspectionDate || '',
        VehicleStatus: item.vehicleStatus || '',
        DamageDetails: item.damageDetails || '',
        ChassisWiseRemarks: item.chassisWiseRemarks || '',
        AttributeCard: item.attributeCard || 0,
        ChargingKit: item.chargingKit || 0,
        modelWiseSupervisorName: item.modelWiseSupervisorName || '',
        //lotVehicleDamageImage :item.lotVehicleDamageImage || '',
        LocationName: item.locationName || '',
        UpdatedBy: item.UpdatedBy || '',
        UpdatedDate: item.UpdatedDate || ''
      }
      invoiceDetails.push(list);
    });

    model.lotInspectedDetails = invoiceDetails;
    this.loader.show();
    this.lotInspectionDetailservice.updateLotInspectedDetails(model).subscribe({
      next: (res) => {
        this.loader.hide()
        this.toaster.show('LOT inspection details Updated successfully!', {
          classname: 'bg-success text-white',
          delay: 3000
        });

      },
      error: (err) => {

        console.error(err)
        this.loader.hide();

        this.toaster.show('Failed to submit  Lot Inspection details!', {
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