import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Form22masterservice } from '../../core/services/form22masterservice';
import { OemmodelServiceFrom, OemmodelServiceSeq } from '../../constant';
import { ModewiseServicescheduleservice } from '../../core/services/modewise-servicescheduleservice';
import { JobCardService } from '../../core/services/job-card-service';
import { Router } from '@angular/router';
import { ToastService } from '../../shared/toaster/toast-service';
import { delay } from 'lodash';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modelwise-service-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modelwise-service-schedule.html',
  styleUrl: './modelwise-service-schedule.scss',
})
export class ModelwiseServiceSchedule {

  constructor(private form22service: Form22masterservice,
    private jobCardService: JobCardService,
    private modelwiseservicescheduleservice: ModewiseServicescheduleservice,
    public toaster: ToastService,
    private router: Router
  ) { }

  oemModelList: any[] = [];
  serviceheadlist: any[] = [];
  servicetypelist: any[] = [];
  SelectedoemmodelId: any = "";
  SelectedserviceheadId: any = "";
  SelectedservicetypeId: any = "";
  serviceSeqList = OemmodelServiceSeq;
  servicefromList = OemmodelServiceFrom;
  effectiveDate: any = null;
  noOfServices: number = 0;
  serviceRows: any[] = [];
  serviceTypeCache: any = {};
  oemmodelId: number | null = null;
  scheduleList: any[] = [];
  modelvarientList: any[] = [];
  isEditMode: boolean = false;
  editId: number = 0;


  ngOnInit() {
    this.loadList();
    this.loadOemModels();
    this.loadserviceheadmodel();
  }
  openModal() {
    this.SelectedoemmodelId = null;
    this.noOfServices = 0;
    this.serviceRows = [];
  }
  openAddModal() {
    this.isEditMode = false;
    this.editId = 0;

    this.SelectedoemmodelId = null;
    this.noOfServices = 0;
    this.effectiveDate = null;

    this.serviceRows = [];
    this.modelvarientList = [];
  }
  //Oem dropdown binding
  loadOemModels() {
    this.form22service.getOemModelList().subscribe({
      next: (res: any) => {
        this.oemModelList = res;
        //console.log("oemModelList:",this.oemModelList)
      },
      error: (err) => {
        console.error('Error fetching OEM Models', err);
      }
    });
  }

  /// load service head
  loadserviceheadmodel() {
    this.modelwiseservicescheduleservice.getServiceHeadmodelwise().subscribe({
      next: (res: any) => {
        this.serviceheadlist = res;
        //console.log("serviceheadlist:", this.serviceheadlist)
      },
      error: (err) => {
        console.error("error occured", err);
      }
    })
  }

  // load service type
  loadservicetypemodel(row: any) {

    this.jobCardService.getServiceType(row.serviceHeadId).subscribe(res => {

      row.serviceTypeList = res;   //  row-wise data
      row.serviceTypeId = '';      // reset selection

      //console.log("servicetype:", row.serviceTypeList);
    });
  }

  onServiceheadchanging(row: any) {
    this.loadservicetypemodel(row);
  }
  onSearchChange() {

    console.log("Model:", this.searchModelId);
    console.log("Date:", this.searchDate);

    //  both empty → full list
    if (!this.searchModelId && !this.searchDate) {
      this.loadList();
      return;
    }

    //  filter apply
    this.modelwiseservicescheduleservice.getModelwiseservicescheduleList(
      this.searchModelId,
      this.searchDate
    ).subscribe({
      next: (res: any) => {
        this.scheduleList = res;
      },
      error: err => console.error(err)
    });
  }
  generateRows() {
    const count = Number(this.noOfServices);

    if (!count || count <= 0) {
      this.serviceRows = [];
      return;
    }

    this.serviceRows = [];

    for (let i = 0; i < count; i++) {
      this.serviceRows.push({
        serviceName: this.serviceSeqList[i]?.value || `${i + 1}th Service`,
        serviceSeqId: this.serviceSeqList[i]?.Id || i + 1,

        daysFrom: '',
        daysTo: '',
        kmFrom: '',
        kmTo: '',

        serviceFrom: '',
        serviceHeadId: '',
        serviceTypeId: '',

        serviceTypeList: []
      });
    }
  }

  onModelChange() {

    //console.log("Selected Model ID:", this.SelectedoemmodelId);

    if (!this.SelectedoemmodelId) {
      this.modelvarientList = [];
      return;
    }

    this.modelwiseservicescheduleservice.getBymodelwisemodelvarient(this.SelectedoemmodelId)
      .subscribe({
        next: (res: any) => {
          // console.log("Variant API:", res);

          this.modelvarientList = res.map((x: any) => ({
            ...x,
            selected: true
          }));
        },
        error: err => console.error(err)
      });
  }
  onVariantChange(item: any, event: any) {

    if (!event.target.checked) {
      setTimeout(() => {
        item.selected = true;
      });

      //  toaster
      this.toaster.show('You cannot unselect model variant', {
        classname: "bg-danger text-white"
      });
    }
  }

  // insert + update operation 
  save(form: any) {
    debugger;
    if (form.invalid) {
      this.toaster.show('Please fill all required fields', {
        classname: 'bg-danger text-white',
        delay: 3000
      });
      return;
    }
    if (!this.SelectedoemmodelId) {
      this.toaster.show('Please select model', {
        classname: 'bg-danger text-white',
        delay: 3000
      });
      return;
    }
    if (!this.noOfServices || this.noOfServices <= 0) {
      this.toaster.show('Enter valid number of services', {
        classname: 'bg-danger text-white',
        delay: 3000
      });
      return;
    }
    if (!this.effectiveDate || this.effectiveDate <= 0) {
      this.toaster.show('Please select effective Date', {
        classname: 'bg-danger text-white',
        delay: 3000
      });
      return;
    }
    if (this.serviceRows.length === 0) {
      this.toaster.show('Please enter service rows', {
        classname: 'bg-danger text-white',
        delay: 3000
      });
      return;
    }
    if (this.serviceRows.some(x =>
      !x.serviceHeadId ||
      !x.serviceTypeId ||
      !x.daysFrom ||
      !x.daysTo ||
      !x.kmFrom ||
      !x.kmTo
    )) {
      this.toaster.show('Please fill all rows properly', {
        classname: 'bg-danger text-white',
        delay: 3000
      });
      return;
    }

    const payload = this.serviceRows.map(x => ({
      id: x.id || 0,
      oemModelId: this.SelectedoemmodelId,
      noofservice: this.noOfServices,

      seqno: x.serviceSeqId,
      srNo: x.serviceName,

      daysFrom: x.daysFrom,
      daysTo: x.daysTo,

      journeyFrom: x.kmFrom,
      journeyTo: x.kmTo,

      serviceFrom: x.serviceFrom,
      serviceHead: x.serviceHeadId,
      serviceType: x.serviceTypeId,

      effectiveDate: this.effectiveDate
    }));

    console.log("SAVE:", payload);

    this.modelwiseservicescheduleservice.saveServiceSchedule(payload).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: this.isEditMode ? 'Updated Successfully' : 'Saved Successfully',
          showConfirmButton: false,
          timer: 1500
        });
        this.resetForm();
        this.loadList();
      },
      error: err => console.error(err)
    });
  }
  loadList() {

    this.modelwiseservicescheduleservice
      .getModelwiseservicescheduleList(
        this.searchModelId,
        this.searchDate
      )
      .subscribe({
        next: (res: any) => {
          this.scheduleList = res;
        },
        error: err => console.error(err)
      });
  }
  edit(item: any) {

    this.isEditMode = true;

    //  correct binding
    this.SelectedoemmodelId = item.oemModelId;
    this.effectiveDate = item.effectiveDate;

    //  API CALL
    this.modelwiseservicescheduleservice
      .getModelwiseservicescheduleList(item.oemModelId)
      .subscribe({
        next: (res: any) => {

          if (res && res.length > 0) {

            //  FIXED
            this.SelectedoemmodelId = res[0].oemModelId;
            this.noOfServices = res[0].noofservice;
            this.effectiveDate = res[0].effectiveDate
              ? res[0].effectiveDate.split('T')[0]
              : null;

            //  rows mapping
            this.serviceRows = res.map((x: any) => ({
              id: x.id,
              serviceSeqId: x.seqno,
              serviceName: x.srNo,

              daysFrom: x.daysFrom,
              daysTo: x.daysTo,

              kmFrom: x.journeyFrom,
              kmTo: x.journeyTo,

              serviceFrom: x.serviceFrom,

              //  MUST BE ID
              serviceHeadId: x.serviceHeadId,
              serviceTypeId: x.serviceTypeId,

              serviceTypeList: []
            }));

            //  load service type for each row
            this.serviceRows.forEach(row => {
              if (row.serviceHeadId) {
                this.onServiceheadchanging(row);
              }
            });

            //  load model variants
            this.onModelChange();
          }
        },
        error: err => console.error(err)
      });
  }
  resetForm() {
    this.SelectedoemmodelId = null;
    this.noOfServices = 0;
    this.effectiveDate = null;
    this.serviceRows = [];
  }

  searchModelId: any = '';
  searchDate: any = '';


  search() {

    this.loadList();
    this.modelwiseservicescheduleservice.getModelwiseservicescheduleList(
      this.searchModelId,
      this.searchDate
    ).subscribe({
      next: (res: any) => {
        this.scheduleList = res;
      },
      error: err => console.error(err)
    });
  }


  //  Navigate to Add Page
  goToAdd() {
    this.router.navigate(['/add-service-schedule']);
  }
}
