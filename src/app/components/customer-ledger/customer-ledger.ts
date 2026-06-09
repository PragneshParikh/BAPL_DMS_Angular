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
    ledgerCode: '',
    ledgerName: '',
    ledgerType: 'Party',
    gstNo: '',
    pan: '',
    aadharNumber: '',
    mobileNumber: '',
    address: '',
    city: '',
    state: '',
    pin: '',
    email: '',
    gender: '',
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

  constructor(
    private ledgerService: LedgerMasterService,
    private activatedRoute: ActivatedRoute,
    private loader: LoaderService,
    private toaster: ToastService,
    private router: Router,
    private cityService: CityService,
    private stateService: StateService,
    private storageService: StorageService,
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

  async ngOnInit() {

    await this.getUserList();
    await this.getCity();
    await this.getState();

    this.isExternalCall = !!this.activeModal || !!this.ledgerId;
    this.isExternalCall = this.fromReceiptEntry;

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

    // ROUTE MODE
    this.activatedRoute.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (id > 0) {
        this.isModify = true;
        this.getCustomerLedgerDetails(id);
      }
    });
  }

  getCustomerLedgerDetails(id: any) {
    this.loader.show();
    this.ledgerService.getLedgerById(id).subscribe({
      next: (res) => {
        this.formData = {
          id: res.id,
          ledgerCode: res.ledgerCode,
          ledgerName: res.ledgerName,
          ledgerType: res.ledgerType,
          gstNo: res.gstno,
          pan: res.pan,
          aadharNumber: res.aadharNumber,
          mobileNumber: res.mobileNumber,
          address: res.address,
          city: res.city,
          state: res.state,
          pin: res.pin,
          email: res.eMail,
          gender: res.gender,
          dateOfBirth: res.dateOfBirth,
          createdBy: res.createdBy,
          createdDate: res.createdDate,
          updatedBy: res.updatedBy,
          updatedDate: res.updatedDate,
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

  onStateChange(event: any) {
    const selectedStateId = event.target.value;
    this.changeCityOptions(selectedStateId);
  }
  changeCityOptions(selectedStateId: any) {
    this.cities = this._cities.filter(x => x.stateId === Number(selectedStateId));
  }


}
