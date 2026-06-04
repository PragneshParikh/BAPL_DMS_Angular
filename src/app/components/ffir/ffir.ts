import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../core/services/storage';
import { LocationName } from '../../ViewModels/ReceiptEntryModel';
import { JobCardService } from '../../core/services/job-card-service';
import Swal from 'sweetalert2';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { LoaderService } from '../../core/services/loader';
import { FFIRService } from '../../core/services/ffirservice';
import { FFIRIssueType, FFIRPresentVehicleStatus, FFIRPurposeofCIR, FFIRTypeRoadSurface } from '../../constant';
import { number } from 'echarts';
import { LocationMasterService } from '../../core/services/location-master-service';

@Component({
  selector: 'app-ffir',
  imports: [FormsModule, CommonModule],
  templateUrl: './ffir.html',
  styleUrl: './ffir.scss',
})
export class FFIR {

  locations: LocationName[];
  ffirData: any = {};
  jobNo: number = 0;
  selectedLocation: string = '';
  isEditMode = false;
  editId: number = 0;
  jobCardId: number = 0;
  chassiseditData: any = null;
  searchpartText: string = '';
  searchComplaintText: string = '';
  partsList: any[] = [];          // API data
  failurcomplaintList: any[] = [];
  jobcardhistoryList: any[] = [];
  filteredParts: any[] = [];
  filteredComplaints: any[] = [];
  selectedMainParts: any[] = [];
  showDropdown: boolean = false;
  showfailurepartdropdown: boolean = false;
  showComplaintDropdown: boolean = false;
  complaintList: any[] = [];
  issueTypeList = FFIRIssueType;
  presentvehcileStatus = FFIRPresentVehicleStatus;
  typeRoadSurface = FFIRTypeRoadSurface;
  purposeofCIR = FFIRPurposeofCIR;
  chassisNo: string = '';

  ffirObj: any = {

    ffirPrefix: '',
    dealerCode: '',
    cirDate: '',

    jobCardCustomerId: 0,
    jobCardHeaderId: 0,

    purposeOfCIR: '',
    ffirChassisNo: '',

    failureDate: '',

    reportTitle: '',
    reportPreparedBy: '',

    noOfPassenger: 0,

    typeOfRoadSurface: '',

    repeatFailure: false,
    chassisModified: false,

    ffirRemarks: '',

    createdBy: 'Admin',

    mainParts: [],

    detailObservation: {

      observationFailedParts: '',
      rootCauseofFailure: '',
      correctiveAction: '',
      resolutionComplaint: '',
      presentStatusofVehicle: '',
      vehicleOffRoadReason: ''
    }
  };


  constructor(private storageService: StorageService,
    private locationService: LocationMasterService,
    private router: Router,
    private ffirService: FFIRService,
    private route: ActivatedRoute,
    private loader: LoaderService,
    private jobCardService: JobCardService) { }


  // fetch jobcard related data
  ngOnInit(): void {
    //debugger;
    this.jobCardId = Number(this.route.snapshot.paramMap.get('id'));
    //console.log("Received JobCardId:", this.jobCardId);

    this.fetchJobNoBasedData();
    this.loadParts();
    this.loadFailureComplaints();

    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.editId = +params['id'];
        this.getFFIRById(this.editId);
      }
    });


  }
  getFFIRById(id: number) {

    this.ffirService.getFFIRById(id).subscribe({

      next: (res: any) => {

        this.ffirObj = res;
        // FORMAT DATE
        this.ffirObj.cirDate =
          res.cirDate
            ? new Date(res.cirDate).toISOString().split('T')[0]
            : '';

        this.ffirObj.failureDate =
          res.failureDate
            ? new Date(res.failureDate).toISOString().split('T')[0]
            : '';

        this.selectedMainParts = res.mainParts || [];
        this.jobCardId = this.ffirObj.jobCardHeaderId
        this.fetchJobNoBasedData();
        this.loadParts();
        this.loadFailureComplaints();
      },
      error: (err) => {
        console.log(err);
      }
    });
  }

  fetchJobNoBasedData(): void {
   // debugger;
    if (!this.jobCardId) return;   // safety check
    this.loader.show();
    this.jobCardService.getCIRJobCardDetails(this.jobCardId).subscribe({
      next: (res: any) => {
        this.loader.hide();
        //console.log("FFIR API Response", res);
        this.ffirData = res;
        //console.log("FFIR API Response", this.ffirData);
        this.chassisNo = this.ffirData.chassisNo;
        if (this.chassisNo) {
          this.loadJobcardHistory(this.chassisNo);
        }
        //const ffirData = res
        this.complaintList = [{
          id: this.ffirData.id,
          customerVoice: this.ffirData.customerVoice,
          complaintCode: this.ffirData.complaintCode,
          complaint: this.ffirData.complaint,
          observation: this.ffirData.observation,
          actionTaken: this.ffirData.actionTaken
        }];
      },
      error: (err) => {
        console.error("FFIR API Error", err);
        this.loader.hide();
        Swal.fire({
          icon: 'error',
          text: 'Failed to load FFIR data',
          width: '300px'
        });
      }
    });
  }


  //Fetech Dealer Location
 fetchLocations(): void {

  const dealerCode =
    this.storageService.getDealerCode();

  this.locationService
    .getLocationList(dealerCode)
    .subscribe({

      next: (data: any[]) => {

        // only Workshop
        this.locations = data.filter(
          x => x.locareadidNo === 2
        );

        // EDIT MODE
        if (this.isEditMode && this.chassiseditData) {

          const serviceLocCode =
            this.chassiseditData
              .jobCardHeader
              .serviceloc;

          // MATCH
          const match = this.locations.find(
            x => x.locCode === serviceLocCode
          );
          if (match) {
            this.selectedLocation =
              match.locname;
              console.log("LocationName:",this.selectedLocation)
          }
        }
      },

      error: (err) => {

        console.error(
          'Error fetching locations',
          err
        );

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
  loadParts() {

    this.ffirService.getPartDropdownlist().subscribe(res => {
      this.partsList = res;
    });
  }

  filterParts() {
    const value = this.searchpartText.toLowerCase();

    this.filteredParts = this.partsList.filter(x =>
      x.partAffectedName.toLowerCase().includes(value)
    );
  }

  selectPart(part: any) {

    const exists = this.selectedMainParts.find(
      x => x.fullPartName === part.partAffectedName
    );

    if (exists) {

      Swal.fire({
        icon: 'warning',
        title: 'Already Added',
        text: 'This part is already added.',
        confirmButtonText: 'OK'
      });

      this.searchpartText = '';
      this.showDropdown = false;

      return;
    }

    // frontend display full value
    this.selectedMainParts.push({

      fullPartName: part.partAffectedName

    });

    console.log(this.selectedMainParts);

    this.searchpartText = '';
    this.showDropdown = false;
  }

  hideDropdown() {
    setTimeout(() => {
      this.showDropdown = false;
      this.showComplaintDropdown = false;
      this.showfailurepartdropdown = false;
    }); // delay so click works
  }
  deleteMainPart(index: number) {
    this.selectedMainParts.splice(index, 1);
  }
  loadFailureComplaints() {
    
    this.ffirService.getComplaintCodeList().subscribe(res => {
      this.failurcomplaintList = res;
    });
  }
  filterComplaints() {
    const failurecomplaintvalue = this.searchComplaintText.toLowerCase();

    this.filteredComplaints = this.failurcomplaintList.filter(x =>
      x.complaint.toLowerCase().includes(failurecomplaintvalue)
    );
  }

  selectComplaint(complaint: any) {
    this.searchComplaintText = complaint.complaint;
    this.showComplaintDropdown = false;
  }

  loadJobcardHistory(chassisNo: string) {
    this.ffirService.getJobCardHistory(chassisNo).subscribe({
      next: (res: any) => {
        this.jobcardhistoryList = res;
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  saveFFIR() {
   // debugger;
    const dealerCode = this.storageService.getDealerCode();
    this.ffirObj.dealerCode = dealerCode;
    this.ffirObj.mainParts = this.selectedMainParts.map((item: any) => {
      // EDIT MODE
      if (item.partAffectedName) {

        return {

          partAffectedName:
            item.partAffectedName,

          partAffectedDescription:
            item.partAffectedDescription

        };

      }

      // ADD MODE
      const splitData =
        item.fullPartName?.split('-') || [];

      return {

        partAffectedName:
          splitData[0]?.trim() || '',

        partAffectedDescription:
          splitData.slice(1)
            .join('-')
            .trim() || ''

      };

    });
    this.ffirObj.ffirChassisNo = this.chassisNo;
    this.ffirObj.jobCardHeaderId = this.jobCardId;
    this.ffirObj.jobCardCustomerId = this.failurcomplaintList[0].id;
    // EDIT
    if (this.isEditMode) {
      this.ffirService
        .updateFFIR(this.editId, this.ffirObj)
        .subscribe({
          next: (res: any) => {
            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: 'FFIR updated successfully'
            }).then(() => {
              this.router.navigate(['/ffirlisting']);
            });
          },
          error: (err) => {
            console.log(err);
          }
        });
    }
    // INSERT
    else {
      this.ffirService.insertFFIR(this.ffirObj).subscribe({
        next: (res: any) => {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'FFIR saved successfully'
          }).then(() => {
            this.router.navigate(['/ffirlisting']);
          });
        },
        error: (err) => {
          console.error(err);
        }
      });
    }
  }

}
