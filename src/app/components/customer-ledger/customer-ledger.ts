import { Component, Input, OnInit, Optional } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LedgerMasterService } from '../../core/services/ledger-master';
import { ActivatedRoute, Router } from '@angular/router';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import { tap } from 'rxjs';
import { Gender, LedgerTypes } from '../../constant';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CityService } from '../../core/services/city';
import { StateService } from '../../core/services/state';
import { StorageService } from '../../core/services/storage';
import { AuthenticationService } from '../../core/services/auth.service';
import { GetUserNameByIdPipe } from '../../core/pipe/get-user-name-by-id-pipe';
import { OccupationService } from '../../core/services/occupation-service';

@Component({
  selector: 'app-customer-ledger',
  imports: [FormsModule, CommonModule, GetUserNameByIdPipe],
  templateUrl: './customer-ledger.html',
  styleUrl: './customer-ledger.scss',
})
export class CustomerLedger {
  optionalLedgerTypes = ['Party', 'Institution', 'Financier', 'Insurance'];
  genders = Gender
  ledgerTypes = LedgerTypes;
  formData = {
    id: 0,
    ledgerVisibility: '',
    dealerCode: '',
    ledgerCode: '',
    ledgerName: '',
    ledgerType: 'Party',
    gstNo: '',
    occupationId: null as number | null,
    pan: '',
    aadharNumber: '',
    mobileNumber: '',
    address: '',
    city: '',
    state: '',
    altMobileNumber:'',
    pin: '',
    email: '',
    gender: '',
    d2dProvision: false,
    dateOfBirth: '',
    createdBy: '1',
    createdDate: new Date(),
    updatedBy: null,
    updatedDate: null
  };

  public isModify = false;
  isExternalCall: boolean;

  _cities: any[] = [];
  cities: any[] = [];
  states: any[] = [];
  lstUsers: any[] = [];
  occupationList: any;
  mobileList: string[];
  mobileExist: boolean;
  role: string;
  showD2DProvision: boolean;

  constructor(
    private ledgerService: LedgerMasterService,
    private activatedRoute: ActivatedRoute,
    private loader: LoaderService,
    private toaster: ToastService,
    private router: Router,
    private cityService: CityService,
    private stateService: StateService,
    private storageService: StorageService,
    private occupationService: OccupationService,
    private authService: AuthenticationService,
    @Optional() public activeModal: NgbActiveModal
  ) {
    this.activatedRoute.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (id > 0) {
        this.isModify = true;
        this.getCustomerLedgerDetails(id);
      }
    });
    this.formData.createdBy = this.storageService.getDealerCode();
  }
  @Input() ledgerId!: number;
  @Input() fromReceiptEntry: boolean = false;
  @Input() defaultLedgerType: string = '';
  @Input() leadData: any;

  async ngOnInit() {
    this.role = this.storageService.getRole();
    this.showD2DProvision = this.role?.toLowerCase() === 'superadmin';
    this.ledgerTypes = this.role?.toLowerCase() === 'superadmin' ? LedgerTypes : LedgerTypes.filter(x => !x.isAdmin);
    await this.getMobileList();
    await this.getNextLedCode();
    await this.getUserList();
    await this.getOccupationList();
    await this.getCity();
    await this.getState();

    this.isExternalCall = !!this.activeModal || !!this.ledgerId;
    this.isExternalCall = this.fromReceiptEntry;

    if (this.fromReceiptEntry) {
      this.ledgerTypes = LedgerTypes.filter(x => !x.isAdmin || x.value === 'Receipt');
      this.formData.ledgerType = 'Receipt';
    }

    //SET DEFAULT TYPE (ONLY ADD MODE)
    if (!this.ledgerId && this.defaultLedgerType) {
      this.formData.ledgerType = this.defaultLedgerType;
    }

    //EDIT MODE
    if (this.ledgerId) {
      this.isModify = true;
      this.getCustomerLedgerDetails(this.ledgerId);
      return;
    }
    if (this.leadData) {

      this.populateLeadData();
    }
    // ROUTE MODE
    this.activatedRoute.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (id > 0) {
        this.isModify = true;
        this.getCustomerLedgerDetails(id);
      }
    });
  }
  getMobileList() {
    const dealerCode = this.storageService.getDealerCode();
    this.ledgerService.getLedgerMobileList(dealerCode).subscribe(
      (res) => {
        this.mobileList = res;

      }
    );
  }
  getNextLedCode() {
    const dealerCode = this.storageService.getDealerCode();
    this.ledgerService.getNextLedId(dealerCode).subscribe(
      (res) => {
        if (!this.isModify) {
          this.formData.ledgerCode = res;
        }
      }
    );
  }
  checkPhoneNumberExist(mobileNo: string): void {
    if (this.mobileList?.includes(mobileNo)) {
      this.mobileExist = true;
      this.toaster.show('Mobile number already exists', {
        classname: 'bg-danger text-white',
        delay: 5000
      });

      return;
    }
    this.mobileExist = false;
  }
  getOccupationList() {
    this.occupationService.getActiveOccupations().subscribe((res) => {

      this.occupationList = res;
    });
  }
  populateLeadData() {

    if (!this.leadData) return;

    this.formData.ledgerName = this.leadData.name || '';
    this.formData.mobileNumber = this.leadData.mobile || '';
    this.formData.email =
      this.leadData.email && this.leadData.email !== 'null'
        ? this.leadData.email
        : '';

    this.formData.address = this.leadData.brancharea || '';
    this.formData.pin = this.leadData.branchpin?.toString() || '';

    this.formData.ledgerType = this.defaultLedgerType || 'Party';

    // Auto-select state
    const state = this.states.find(
      x => x.stateName?.toLowerCase() === this.leadData.state?.toLowerCase()
    );

    if (state) {

      this.formData.state = state.id;

      this.changeCityOptions(state.id);

      const city = this.cities.find(
        x => x.cityName?.toLowerCase() === this.leadData.city?.toLowerCase()
      );

      if (city) {
        this.formData.city = city.id;
      }
    }
  }
  getCustomerLedgerDetails(id: any) {
    this.loader.show();
    this.ledgerService.getLedgerById(id).subscribe({
      next: (res) => {
console.log(res);

        this.formData = {
          id: res.id,
          dealerCode: res.dealerCode,
          ledgerCode: res.ledgerCode,
          ledgerName: res.ledgerName,
          ledgerType: res.ledgerType,
          gstNo: res.gstno,
          pan: res.pan,
          aadharNumber: res.aadharNumber,
          mobileNumber: res.mobileNumber,
          altMobileNumber: res.altMobileNumber,
          address: res.address,
          city: res.city,
          state: res.state,
          pin: res.pin,
          email: res.eMail,
          gender: res.gender,
          occupationId: res.occupationId,
          dateOfBirth: res.dateOfBirth,
          createdBy: res.createdBy,
          createdDate: res.createdDate,
          updatedBy: res.updatedBy,
          updatedDate: res.updatedDate,
          d2dProvision: res.d2DProvision === true || res.d2DProvision === 1,
          ledgerVisibility: res.ledgerVisibility
        }

         if (
        this.formData.ledgerType &&
        !this.ledgerTypes.some(x => x.value === this.formData.ledgerType)
      ) {
        const currentType = LedgerTypes.find(
          x => x.value === this.formData.ledgerType
        );

        if (currentType) {
          this.ledgerTypes = [currentType, ...this.ledgerTypes];
        }
      }

        this.loader.hide();
        this.changeCityOptions(this.formData.state);
      }, error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show('Something went wrong', {
          classname: 'bg-danger text-white',
          delay: 5000
        });
      }
    });
  }

  getUserList() {
    this.authService.getUserList().subscribe({
      next: (res) => {
        this.lstUsers = res;
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  onSubmit(form: any) {
    const dealerCode = this.storageService.getDealerCode();
    if(!this.isModify){
      this.formData.dealerCode = dealerCode;
    }
    else{
      this.formData.dealerCode = this.formData.dealerCode;
    }
    const isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';
console.log("Call",this.formData);

    this.formData.ledgerVisibility = (isSuperAdmin && !this.isExternalCall) ? 'All' : dealerCode;
    if (!form.valid) return;
    this.loader.show();
    const request$ = this.isModify
      ? this.ledgerService.update(this.formData)
      : this.ledgerService.insert(this.formData);

    request$
      .pipe(
        tap(() => this.loader.hide())
      )
      .subscribe({
        next: (res) => {
          this.toaster.show(
            `Ledger details ${this.isModify ? 'updated' : 'added'} successfully!`,
            { classname: 'bg-success text-white', delay: 5000 }
          );
          const newId = res || this.formData.id;
          if (this.activeModal) {
            this.activeModal.close(newId);
          }
          this.backToList();
        },
        error: (err) => {
          console.error(err);
          this.toaster.show(
            `Failed to ${this.isModify ? 'update' : 'save'} ledger details!`,
            { classname: 'bg-danger text-white', delay: 5000 }
          );
        }
      });
  }

  backToList() {
    // If modal → close
    if (this.activeModal) {
      this.activeModal.close();
      return;
    }
    // If called from Receipt Entry
    if (this.fromReceiptEntry) {
      this.router.navigate(['/receipt-entry/add']);
    }
    // Default → Customer Ledger listing
    else {
      this.router.navigate(['/customer-ledger']);
    }
  }

  async getCity() {

    this.cityService.get().subscribe({
      next: (res) => {
        this._cities = res;
      },
      error: (err) => {

      }
    });
  }

  getState() {
    this.stateService.get().subscribe({
      next: (res) => {
        this.states = res;
      },
      error: () => {

      }
    });
  }

  isLedgerCodeOptional(): boolean {
    return this.optionalLedgerTypes.includes(this.formData.ledgerType);
  }

  sanitizeMobile(event: any) {
    let value = event.target.value;

    value = value.replace(/[^0-9]/g, '');

    value = value.slice(0, 10);

    event.target.value = value;
    this.formData.mobileNumber = value;
  }
  onAltMobileInput(): void {
  this.formData.altMobileNumber =
    this.formData.altMobileNumber?.replace(/[^0-9]/g, '') || '';
}

  onStateChange(event: any) {
    const selectedStateId = event.target.value;
    this.changeCityOptions(selectedStateId);
  }
  changeCityOptions(selectedStateId: any) {
    this.cities = this._cities.filter(x => x.stateId === Number(selectedStateId));
  }


}
