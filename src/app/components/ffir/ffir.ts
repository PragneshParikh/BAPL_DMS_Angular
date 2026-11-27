// src\app\components\ffir\ffir.ts
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../core/services/storage';
import { LocationName } from '../../ViewModels/ReceiptEntryModel';
import { JobCardService } from '../../core/services/job-card-service';
import Swal from 'sweetalert2';
import { ActivatedRoute, Router } from '@angular/router';
import { LoaderService } from '../../core/services/loader';
import { FFIRService } from '../../core/services/ffirservice';
import { FFIRIssueType, FFIRPresentVehicleStatus, FFIRPurposeofCIR, FFIRTypeRoadSurface } from '../../constant';
import { number } from 'echarts';
import { LocationMasterService } from '../../core/services/location-master-service';
import { PrefixService } from '../../core/services/prefix';
import { MenuAccessService } from '../../core/services/menu-access.service';
import { B2BJobcardService } from '../b2b-jobcard/services/b2b-jobcard.service';
import { ComplaintmasterService } from '../../core/services/complaintmaster-service';
import { GroupMasterService } from '../../core/services/group-master-service';
import { firstValueFrom, forkJoin } from 'rxjs';

type FFIRMediaType = 'Image' | 'Video';

interface PendingFFIRAttachment {
  file: File;
  previewUrl: string;
  mediaType: FFIRMediaType;
}

@Component({
  selector: 'app-ffir',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './ffir.html',
  styleUrl: './ffir.scss',
})
export class FFIR implements OnInit, OnDestroy {
  readonly SUBMENU_ID = 23;
  readonly B2B_SUBMENU_ID = 160;
  canCreate = false;
  canEdit = false;
  locations: LocationName[];
  ffirData: any = {};
  jobNo: number = 0;
  selectedLocation: string = '';
  isEditMode = false;
  editId: number = 0;
  jobCardId: number = 0;
  b2bJobCardId = '';
  isB2BMode = false;
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
  complaintMasterList: any[] = [];
  groupMasterList: any[] = [];
  savedImages: any[] = [];
  savedVideos: any[] = [];
  pendingImages: PendingFFIRAttachment[] = [];
  pendingVideos: PendingFFIRAttachment[] = [];
  isLoadingAttachments = false;
  isSaving = false;
  createdFFIRId: number | null = null;
  private readonly maxImages = 10;
  private readonly maxImageSize = 10 * 1024 * 1024;
  private readonly maxVideos = 5;
  private readonly maxVideoSize = 100 * 1024 * 1024;
  issueTypeList = FFIRIssueType;
  presentvehcileStatus = FFIRPresentVehicleStatus;
  typeRoadSurface = FFIRTypeRoadSurface;
  purposeofCIR = FFIRPurposeofCIR;
  chassisNo: string = '';

  ffirObj: any = {

    ffirPrefix: '',
    dealerCode: '',
    cirNo: 0,
    cirDate: '',

    jobCardCustomerId: null,
    jobCardHeaderId: null,
    b2bJobCardId: null,

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

    //createdBy: 'Admin',

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
    private prefixService: PrefixService,
    private ffirService: FFIRService,
    private route: ActivatedRoute,
    private loader: LoaderService,
    private menuAccess: MenuAccessService,
    private jobCardService: JobCardService,
    private b2bJobCardService: B2BJobcardService,
    private complaintMasterService: ComplaintmasterService,
    private groupMasterService: GroupMasterService) { }


  // fetch jobcard related data
  ngOnInit(): void {
    this.ffirObj.cirDate = this.todayAsInputValue();
    this.ffirObj.failureDate = this.todayAsInputValue();
    this.isB2BMode = this.route.snapshot.routeConfig?.path === 'ffir-b2b/:id';
    this.loadComplaintLookups();

    if (this.isB2BMode) {
      this.b2bJobCardId = this.route.snapshot.paramMap.get('id') || '';
      this.canCreate = this.menuAccess.canCreate(this.B2B_SUBMENU_ID)
        || this.menuAccess.canEdit(this.B2B_SUBMENU_ID);
      this.canEdit = this.menuAccess.canEdit(this.B2B_SUBMENU_ID);
      this.loadParts();
      this.loadB2BJobCardData();
    } else {
      this.jobCardId = Number(this.route.snapshot.paramMap.get('id'));
      this.canCreate = this.menuAccess.canCreate(this.SUBMENU_ID);
      this.canEdit = this.menuAccess.canEdit(this.SUBMENU_ID);
      if (!this.route.snapshot.queryParamMap.has('id')) this.loadPrefix();
      this.fetchJobNoBasedData();
      this.loadParts();
    }

    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.editId = +params['id'];
        this.getFFIRById(this.editId);
      }
    });


  }

  ngOnDestroy(): void {
    [...this.pendingImages, ...this.pendingVideos]
      .forEach((attachment) => URL.revokeObjectURL(attachment.previewUrl));
  }

  private todayAsInputValue(): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().split('T')[0];
  }

  private loadComplaintLookups(): void {
    forkJoin({
      groups: this.groupMasterService.getGroupMasterList(),
      complaints: this.complaintMasterService.getComplaintMasterList()
    }).subscribe({
      next: ({ groups, complaints }) => {
        this.groupMasterList = groups || [];
        this.complaintMasterList = complaints || [];
        this.enrichComplaintList();
      },
      error: (err) => {
        console.error('Failed to load complaint group lookups', err);
        Swal.fire({
          icon: 'error',
          text: 'Failed to load Group Master and Complaint Master data',
          width: '350px'
        });
      }
    });
  }

  private enrichComplaintList(): void {
    this.complaintList = this.complaintList.map((item: any) => {
      const complaintNames = [
        this.readProperty(item, 'complaintCode'),
        this.readProperty(item, 'complaintName'),
        this.readProperty(item, 'complaint')
      ].map((value) => String(value || '').trim()).filter(Boolean);
      const master = this.complaintMasterList.find((candidate: any) =>
        complaintNames.some((name) =>
          String(this.readProperty(candidate, 'complaintName') || '').trim().toLowerCase() === name.toLowerCase()
        )
      );
      const groupId = Number(this.readProperty(master, 'groupName')) || null;
      const group = this.groupMasterList.find((candidate: any) =>
        Number(this.readProperty(candidate, 'id')) === groupId
      );
      const complaintName = this.readProperty(master, 'complaintName') || complaintNames[0] || '';

      return {
        ...item,
        groupName: this.readProperty(group, 'groupName')
          || this.readProperty(master, 'complaintGroupName')
          || '',
        complaintName: this.readProperty(master, 'complaintName') || complaintName
      };
    });
  }

  get canSaveFFIR(): boolean {
    const observation = this.ffirObj.detailObservation || {};
    const photoCount = this.savedImages.length + this.pendingImages.length;
    const videoCount = this.savedVideos.length + this.pendingVideos.length;

    return !this.isSaving
      && !this.isLoadingAttachments
      && !!String(this.ffirObj.purposeOfCIR || '').trim()
      && !!String(this.ffirObj.reportTitle || '').trim()
      && !!String(this.ffirObj.reportPreparedBy || '').trim()
      && !!String(this.ffirObj.typeOfRoadSurface || '').trim()
      && !!String(observation.observationFailedParts || '').trim()
      && !!String(observation.rootCauseofFailure || '').trim()
      && !!String(observation.correctiveAction || '').trim()
      && !!String(observation.resolutionComplaint || '').trim()
      && !!String(observation.presentStatusofVehicle || '').trim()
      && photoCount >= 1
      && photoCount <= this.maxImages
      && videoCount <= this.maxVideos;
  }

  loadPrefix(dealerCode?: string | null): void {
    this.loader.show();
    const effectiveDealerCode = dealerCode || this.storageService.getDealerCode();
    const module = 'ffir_prefix';
    this.prefixService.getPrefixByDealerByModule(effectiveDealerCode, module).subscribe({
      next: (res: string) => {
        this.loader.hide();
        this.ffirObj.ffirPrefix = res;
        this.ffirObj.cirNo = Number(res.split('/').pop());
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
      }
    });
  }

  private loadB2BJobCardData(loadPrefix = true): void {
    if (!this.b2bJobCardId) {
      this.router.navigate(['/b2bjobcards']);
      return;
    }

    this.loader.show();
    this.b2bJobCardService.getById(this.b2bJobCardId).subscribe({
      next: (card) => {
        this.loader.hide();
        this.ffirData = {
          jobNo: card.jobCardNumber,
          dealerCode: card.dealerCode,
          customerName: card.customer?.name || '',
          locationName: card.serviceLocationName || '',
          chassisNo: card.vehicle?.chassisNo || '',
          registerNo: card.vehicle?.regNo || '',
          vehicleSaleDate: card.vehicle?.purchaseDate || null,
          modelName: card.vehicle?.model || '',
          vehiclekms: card.odometerAtCheckIn,
          complaints: (card.complaints || []).map((complaint, index) => ({
            id: index + 1,
            customerVoice: card.customerVoice || '',
            complaintCode: '',
            complaint,
            observation: ''
          }))
        };
        this.chassisNo = this.ffirData.chassisNo;
        this.ffirObj.dealerCode = card.dealerCode || this.storageService.getDealerCode();
        if (this.chassisNo) this.loadJobcardHistory(this.chassisNo);
        this.complaintList = this.ffirData.complaints;
        this.enrichComplaintList();
        if (loadPrefix) this.loadPrefix(this.ffirObj.dealerCode);
      },
      error: (err) => {
        this.loader.hide();
        console.error('B2B FFIR API Error', err);
        Swal.fire({
          icon: 'error',
          text: 'Failed to load B2B job card data for FFIR',
          width: '300px'
        }).then(() => this.router.navigate(['/b2bjobcards']));
      }
    });
  }

  private readProperty(source: any, property: string): any {
    if (!source || typeof source !== 'object') return undefined;
    const key = Object.keys(source).find((candidate) => candidate.toLowerCase() === property.toLowerCase());
    return key ? source[key] : undefined;
  }

  getFFIRById(id: number) {

    this.ffirService.getFFIRById(id).subscribe({

      next: (res: any) => {
        const mainParts = this.readProperty(res, 'mainParts') || [];
        const observation = this.readProperty(res, 'detailObservation') || {};
        this.ffirObj = {
          ...res,
          ffirPrefix: this.readProperty(res, 'ffirPrefix') || '',
          cirNo: this.readProperty(res, 'cirNo') ?? 0,
          cirDate: this.readProperty(res, 'cirDate') || '',
          jobCardHeaderId: this.readProperty(res, 'jobCardHeaderId') ?? null,
          jobCardCustomerId: this.readProperty(res, 'jobCardCustomerId') ?? null,
          b2bJobCardId: this.readProperty(res, 'b2bJobCardId') ?? null,
          purposeOfCIR: this.readProperty(res, 'purposeOfCIR') || '',
          ffirChassisNo: this.readProperty(res, 'ffirChassisNo') || '',
          failureDate: this.readProperty(res, 'failureDate') || '',
          reportTitle: this.readProperty(res, 'reportTitle') || '',
          reportPreparedBy: this.readProperty(res, 'reportPreparedBy') || '',
          noOfPassenger: this.readProperty(res, 'noOfPassenger') ?? 0,
          typeOfRoadSurface: this.readProperty(res, 'typeOfRoadSurface') || '',
          repeatFailure: this.readProperty(res, 'repeatFailure') ?? false,
          chassisModified: this.readProperty(res, 'chassisModified') ?? false,
          ffirRemarks: this.readProperty(res, 'ffirRemarks') || '',
          detailObservation: {
            observationFailedParts: this.readProperty(observation, 'observationFailedParts') || '',
            rootCauseofFailure: this.readProperty(observation, 'rootCauseofFailure') || '',
            correctiveAction: this.readProperty(observation, 'correctiveAction') || '',
            resolutionComplaint: this.readProperty(observation, 'resolutionComplaint') || '',
            presentStatusofVehicle: this.readProperty(observation, 'presentStatusofVehicle') || '',
            vehicleOffRoadReason: this.readProperty(observation, 'vehicleOffRoadReason') || ''
          }
        };
        // FORMAT DATE
        this.ffirObj.cirDate =
          this.ffirObj.cirDate
            ? new Date(this.ffirObj.cirDate).toISOString().split('T')[0]
            : '';

        this.ffirObj.failureDate =
          this.ffirObj.failureDate
            ? new Date(this.ffirObj.failureDate).toISOString().split('T')[0]
            : this.todayAsInputValue();
        this.loadAttachments(id);

        this.selectedMainParts = mainParts.map((part: any) => ({
          ...part,
          partAffectedName: this.readProperty(part, 'partAffectedName') || '',
          partAffectedDescription: this.readProperty(part, 'partAffectedDescription') || ''
        }));
        this.loadParts();
        if (this.ffirObj.b2bJobCardId) {
          this.isB2BMode = true;
          this.b2bJobCardId = this.ffirObj.b2bJobCardId;
          this.jobCardId = 0;
          this.canCreate = this.menuAccess.canCreate(this.B2B_SUBMENU_ID)
            || this.menuAccess.canEdit(this.B2B_SUBMENU_ID);
          this.canEdit = this.menuAccess.canEdit(this.B2B_SUBMENU_ID);
          this.loadB2BJobCardData(false);
        } else {
          this.jobCardId = this.ffirObj.jobCardHeaderId;
          this.fetchJobNoBasedData();
        }
      },
      error: (err) => {
        console.error(err);
        Swal.fire({
          icon: 'error',
          text: 'Failed to load FFIR details',
          width: '300px'
        });
      }
    });
  }

  fetchJobNoBasedData(): void {
    if (!this.jobCardId) return;

    this.loader.show();

    this.jobCardService.getCIRJobCardDetails(this.jobCardId).subscribe({
      next: (res: any) => {

        this.loader.hide();

        if (!res) {
          this.loader.hide();
          Swal.fire({
            icon: 'error',
            text: 'No linked job card details were returned for this FFIR',
            width: '300px'
          });
          return;
        }

        const complaints = this.readProperty(res, 'complaints') || [];
        this.ffirData = {
          jobNo: this.readProperty(res, 'jobNo'),
          chassisNo: this.readProperty(res, 'chassisNo') || this.ffirObj.ffirChassisNo || '',
          customerName: this.readProperty(res, 'customerName') || '',
          jobCardCustomerId: this.readProperty(res, 'jobCardCustomerId') ?? null,
          modelName: this.readProperty(res, 'modelName') || '',
          vehiclekms: this.readProperty(res, 'vehiclekms'),
          registerNo: this.readProperty(res, 'registerNo') || '',
          observation: this.readProperty(res, 'observation') || '',
          locationName: this.readProperty(res, 'locationName') || '',
          vehicleSaleDate: this.readProperty(res, 'vehicleSaleDate') || null,
          complaints
        };

        this.chassisNo = this.ffirData.chassisNo;

        if (this.chassisNo) {
          this.loadJobcardHistory(this.chassisNo);
        }

        this.complaintList = complaints.map((item: any) => ({
          id: this.readProperty(item, 'id'),
          customerVoice: this.readProperty(item, 'customerVoice'),
          complaintCode: this.readProperty(item, 'complaintCode'),
          complaint: this.readProperty(item, 'complaint'),
          observation: this.ffirData.observation,
          actionTaken: this.ffirData.actionTaken
        }));
        this.enrichComplaintList();

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
  onImagesSelected(event: Event): void {
    this.queueAttachments(event, 'Image');
  }

  onVideosSelected(event: Event): void {
    this.queueAttachments(event, 'Video');
  }

  private queueAttachments(event: Event, mediaType: FFIRMediaType): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    input.value = '';

    const pending = mediaType === 'Image' ? this.pendingImages : this.pendingVideos;
    const savedCount = mediaType === 'Image' ? this.savedImages.length : this.savedVideos.length;
    const maxCount = mediaType === 'Image' ? this.maxImages : this.maxVideos;
    const maxSize = mediaType === 'Image' ? this.maxImageSize : this.maxVideoSize;
    let remainingSlots = maxCount - savedCount - pending.length;

    if (remainingSlots <= 0) {
      this.showAttachmentLimit(mediaType, maxCount);
      return;
    }

    let limitReached = false;
    for (const file of files) {
      if (file.size > maxSize) {
        Swal.fire({
          icon: 'warning',
          text: `${file.name} exceeds the ${mediaType === 'Image' ? '10 MB' : '100 MB'} file limit.`,
          width: '350px'
        });
        continue;
      }

      if (remainingSlots === 0) {
        limitReached = true;
        break;
      }

      pending.push({
        file,
        previewUrl: URL.createObjectURL(file),
        mediaType
      });
      remainingSlots--;
    }

    if (limitReached) this.showAttachmentLimit(mediaType, maxCount);
  }

  private showAttachmentLimit(mediaType: FFIRMediaType, maxCount: number): void {
    Swal.fire({
      icon: 'warning',
      text: `A maximum of ${maxCount} ${mediaType.toLowerCase()}${maxCount === 1 ? '' : 's'} can be attached to one FFIR.`,
      width: '350px'
    });
  }

  removePendingAttachment(mediaType: FFIRMediaType, index: number): void {
    const pending = mediaType === 'Image' ? this.pendingImages : this.pendingVideos;
    const [removed] = pending.splice(index, 1);
    if (removed) URL.revokeObjectURL(removed.previewUrl);
  }

  private loadAttachments(ffirId: number): void {
    this.isLoadingAttachments = true;
    this.ffirService.getAttachments(ffirId).subscribe({
      next: (res: any[]) => {
        const attachments = Array.isArray(res) ? res : [];
        this.savedImages = attachments.filter((item) =>
          String(this.readProperty(item, 'mediaType')).toLowerCase() === 'image'
        );
        this.savedVideos = attachments.filter((item) =>
          String(this.readProperty(item, 'mediaType')).toLowerCase() === 'video'
        );
        this.isLoadingAttachments = false;
      },
      error: (err) => {
        console.error('Failed to load FFIR attachments', err);
        this.isLoadingAttachments = false;
        Swal.fire({
          icon: 'error',
          text: 'Failed to load FFIR attachments',
          width: '300px'
        });
      }
    });
  }

  onLocationChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedLocation = target.value;

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

  async saveFFIR(): Promise<void> {
    if (!this.canSaveFFIR) {
      await Swal.fire({
        icon: 'warning',
        text: 'Complete all required fields and attach at least one photo before saving.',
        width: '350px'
      });
      return;
    }

    const dealerCode = this.isB2BMode
      ? this.ffirData?.dealerCode || this.ffirObj.dealerCode
      : this.storageService.getDealerCode();
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
    if (this.isB2BMode) {
      this.ffirObj.b2bJobCardId = this.b2bJobCardId;
      this.ffirObj.jobCardHeaderId = null;
      this.ffirObj.jobCardCustomerId = null;
    } else {
      this.ffirObj.b2bJobCardId = null;
      this.ffirObj.jobCardHeaderId = this.jobCardId;
      this.ffirObj.jobCardCustomerId = this.ffirData.jobCardCustomerId;
    }

    this.isSaving = true;
    let ffirSaved = this.isEditMode || this.createdFFIRId !== null;
    try {
      let ffirId: number;
      if (this.isEditMode) {
        await firstValueFrom(this.ffirService.updateFFIR(this.editId, this.ffirObj));
        ffirId = this.editId;
        ffirSaved = true;
      } else if (this.createdFFIRId !== null) {
        ffirId = this.createdFFIRId;
      } else {
        const response: any = await firstValueFrom(this.ffirService.insertFFIR(this.ffirObj));
        ffirId = Number(this.readProperty(response, 'id'));
        if (!ffirId) throw new Error('The saved FFIR did not return an ID.');
        this.createdFFIRId = ffirId;
        ffirSaved = true;
      }

      await this.uploadPendingAttachments(ffirId);
      await Swal.fire({
        icon: 'success',
        title: 'Success',
        text: this.isEditMode ? 'FFIR updated successfully' : 'FFIR saved successfully'
      });
      this.onNavigate();
    } catch (err: any) {
      console.error('Failed to save FFIR', err);
      const message = this.readProperty(err?.error, 'message')
        || err?.error
        || err?.message
        || 'Unable to save FFIR.';
      await Swal.fire({
        icon: 'error',
        title: 'Save failed',
        text: ffirSaved
          ? `FFIR details are saved, but an attachment could not be uploaded. Save again to retry. ${message}`
          : String(message),
        width: '450px'
      });
    } finally {
      this.isSaving = false;
    }
  }

  private async uploadPendingAttachments(ffirId: number): Promise<void> {
    const pending = [
      ...this.pendingImages.map((attachment) => ({ attachment, mediaType: 'Image' as const })),
      ...this.pendingVideos.map((attachment) => ({ attachment, mediaType: 'Video' as const }))
    ];

    for (const { attachment, mediaType } of pending) {
      const response: any = await firstValueFrom(
        this.ffirService.uploadAttachment(ffirId, attachment.file)
      );
      const saved = {
        ...response,
        previewUrl: this.readProperty(response, 'url'),
        mediaType: this.readProperty(response, 'mediaType') || mediaType
      };
      if (mediaType === 'Image') {
        this.savedImages.push(saved);
        this.pendingImages.splice(this.pendingImages.indexOf(attachment), 1);
      } else {
        this.savedVideos.push(saved);
        this.pendingVideos.splice(this.pendingVideos.indexOf(attachment), 1);
      }
      URL.revokeObjectURL(attachment.previewUrl);
    }
  }

  onNavigate() {
    if (this.isB2BMode && !this.isEditMode) {
      this.router.navigate(['/b2bjobcards', this.b2bJobCardId]);
      return;
    }
    this.router.navigate(['/ffirlisting']);
  }

}
