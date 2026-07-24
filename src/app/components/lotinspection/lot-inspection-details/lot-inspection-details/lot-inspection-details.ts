import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { LotInspectionUpdate, Header, Detail } from '../../../../ViewModels/LotInspectionViewModel';
import { LotInspectionDetailsService } from '../../../../core/services/lot-inspection-details-service';
import { StorageService } from '../../../../core/services/storage';
import { LoaderService } from '../../../../core/services/loader';
import { ToastService } from '../../../../shared/toaster/toast-service';
import { LocationName } from '../../../../ViewModels/ReceiptEntryModel';
import Swal from 'sweetalert2';
import { LocationMasterService } from '../../../../core/services/location-master-service';
import { LedgerMasterService } from '../../../../core/services/ledger-master';

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
  selectedlotPartyId: any;

  isLotInspected: any;
  isSuperAdmin: boolean;
  dealerCode: any;
  IsD2d: boolean = false;
  inwardType: string;
  lotPartyList: any;

  constructor(
    private route: ActivatedRoute,
    private lotInspectionDetailservice: LotInspectionDetailsService,
    private locationService: LocationMasterService,
    private ledgerService: LedgerMasterService,
    public toaster: ToastService,
    private loader: LoaderService,
    private router: Router,
    private storageService: StorageService
  ) { }

  ngOnInit(): void {

    this.fetchLocations();
    this.route.paramMap.subscribe(params => {
      this.invoiceNo = params.get('invoiceNo') || '';

      if (this.invoiceNo) {
        this.getInvoiceData();
      } else {
        console.error('error')
      }
    });
  }


  allowOnlyNumbers(event: any, field: 'driverContact' | 'keyFobSetQty' | 'chargerQty' | 'mirrorSetQty' | 'firstAidKitQty' | 'toolkitQty' | 'ownersManual' | 'ignitionKeySet' | 'attributeCard' | 'chargingKit') {
    const value = event.target.value.replace(/\D/g, '');
    event.target.value = value;

    switch (field) {
      case 'driverContact':
        this.headerObj.driverContact = value;
        break;
      case 'keyFobSetQty':
        this.detailList[0].keyFobSetQty = value;
        break;
      case 'chargerQty':
        this.detailList[0].chargerQty = value;
        break;
      case 'mirrorSetQty':
        this.detailList[0].mirrorSetQty = value;
        break;
      case 'firstAidKitQty':
        this.detailList[0].firstAidKitQty = value;
        break;

      case 'toolkitQty':
        this.detailList[0].toolkitQty = value;
        break;
      case 'ownersManual':
        this.detailList[0].ownersManual = value;
        break;
      case 'ignitionKeySet':
        this.detailList[0].ignitionKeySet = value;
        break;
      case 'attributeCard':
        this.detailList[0].attributeCard = value;
        break;
      case 'chargingKit':
        this.detailList[0].chargingKit = value;
        break;

    }
  }

  allowCharactersOnly(event: KeyboardEvent): boolean {
    const char = event.key;

    if (!/^[a-zA-Z\s]$/.test(char)) {
      event.preventDefault();
      return false;
    }

    return true;
  }

  onDriverNameInput() {
    this.headerObj.driverName = (this.headerObj.driverName || '')
      .replace(/[^a-zA-Z\s]/g, '');
  }
  onTransporterNameInput() {
    this.headerObj.transporterName = (this.headerObj.transporterName || '')
      .replace(/[^a-zA-Z\s]/g, '');
  }

  fetchLocations(): void {
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';

    if (!this.isSuperAdmin) {
      this.dealerCode = this.storageService.getDealerCode();
    } else {
      this.dealerCode = null;
    }


    this.locationService.getLocationList(this.dealerCode).subscribe({
      next: (data: any[]) => {
        // only showroom (id = 1)
        this.locations = data.filter(x => x.locareadidNo === 1);
      },
      error: (err) => {
        console.error('Error fetching locations', err);
      }
    });
  }
  onLocationChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedLocation = target.value;
  }

  onvehiclefasteringcoverChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedvehiclefasteringcover = target.value;
  }
  onPlastingCoverChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedPlastingcover = target.value;
  }

  onSupervicsorChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedSupervisor = target.value;
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
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';

    this.lotInspectionDetailservice.getAllDetailsByInvoice(this.invoiceNo).subscribe({
      next: (res: any) => {

        if (res?.data?.length > 0) {
          this.isLotInspected = res?.data[0]?.islotinspected;
          this.IsD2d = res?.data[0]?.isD2D;
          this.inwardType = res?.data[0].inwardType;
          this.invoiceNo = res?.data[0].invoiceNo;
          this.getlotPartyName(this.IsD2d, this.invoiceNo);


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
            isD2D: this.IsD2d,
            inwardType: first.inwardType || this.inwardType,
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
  getlotPartyName(isD2D: boolean, invoiceNo: string) {
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';
    if (!this.isSuperAdmin) {
      this.dealerCode = this.storageService.getDealerCode();
    } else {
      this.dealerCode = null;
    }
    this.IsD2d = isD2D;
    this.ledgerService.getLotRelatedLedgers(invoiceNo, this.IsD2d).subscribe({
      next: (res: any) => {

        this.lotPartyList = res;
        if (this.lotPartyList.length === 1) {
          this.selectedlotPartyId = this.lotPartyList[0].id;
        }
      }, error: (err) => {
        this.loader.hide();
        console.error(err);
      }
    })
  }
  // ================= SAVE DATA =================
  saveData() {
    // VALIDATION FIRST
debugger;
console.log("Save time ",this.headerObj)
    if (!this.headerObj.arrivalDate) {
      this.toaster.show('Arrival Date is required', {
        classname: 'bg-warning text-white',
        delay: 3000
      });
      return;
    }
    if (!this.headerObj.arrivalTime) {
      this.toaster.show('Arrival Time is required', {
        classname: 'bg-warning text-white',
        delay: 3000
      });
      return;
    }
    if (!this.headerObj.lrNo) {
      this.toaster.show('L.R. No is required', {
        classname: 'bg-warning text-white',
        delay: 3000
      });
      return;
    }
    if (!this.headerObj.lrDate) {
      this.toaster.show('L.R. Date is required', {
        classname: 'bg-warning text-white',
        delay: 3000
      });
      return;
    }
    if (!this.headerObj.truckNo) {
      this.toaster.show('Truck No is required', {
        classname: 'bg-warning text-white',
        delay: 3000
      });
      return;
    }
    if (!this.headerObj.transporterName) {
      this.toaster.show('Transporter Name is required', {
        classname: 'bg-warning text-white',
        delay: 3000
      });
      return;
    }
    if (!this.headerObj.driverName) {
      this.toaster.show('Driver Name is required', {
        classname: 'bg-warning text-white',
        delay: 3000
      });
      return;
    }
    if (!this.headerObj.driverContact) {
      this.toaster.show('Driver Contact is required', {
        classname: 'bg-warning text-white',
        delay: 3000
      });
      return;
    }
    if (!this.headerObj.locationName) {
      this.toaster.show('Location Name is required', {
        classname: 'bg-warning text-white',
        delay: 3000
      });
      return;
    }
    if (!this.headerObj.nameSupervisor) {
      this.toaster.show('Name of Supervisor Name is required', {
        classname: 'bg-warning text-white',
        delay: 3000
      });
      return;
    }
    if (!this.headerObj.plasticCover) {
      this.toaster.show('Plastic Cover is required', {
        classname: 'bg-warning text-white',
        delay: 3000
      });
      return;
    }
    if (!this.headerObj.vehicleFasteningBracket) {
      this.toaster.show('Vvehicle Fastening Bracket is required', {
        classname: 'bg-warning text-white',
        delay: 3000
      });
      return;
    }
    if (!this.headerObj.inwardType) {
      this.toaster.show('Inward Type is required', {
        classname: 'bg-warning text-white',
        delay: 3000
      });
      return;
    }


    const invalidRows = this.detailList.filter(x => !x.vehicleStatus || x.vehicleStatus === '');

    if (invalidRows.length > 0) {
      Swal.fire({
        icon: 'error',
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
      IsD2D: this.headerObj.isD2D || false,
      InwardType: this.headerObj.inwardType,
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
        this.router.navigate(['/lotinspection']);
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