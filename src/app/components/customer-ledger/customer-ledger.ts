  import { Component, Input, OnInit, Optional } from '@angular/core';
  import { FormsModule } from '@angular/forms';
  import { error } from 'console';
  import { LedgerMaster } from '../../core/services/ledger-master';
  import { ActivatedRoute, Router } from '@angular/router';
  import { LoaderService } from '../../core/services/loader';
  import { ToastService } from '../../shared/toaster/toast-service';
  import { tap } from 'rxjs';
  import { Gender } from '../../constant';
  import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';


  @Component({
    selector: 'app-customer-ledger',
    imports: [FormsModule, CommonModule],
    templateUrl: './customer-ledger.html',
    styleUrl: './customer-ledger.scss',
  })
  export class CustomerLedger {
    genders = Gender
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
      createdDate: new Date()
    };

    public isModify = false;
    isExternalCall: boolean;

    constructor(
      private ledgerService: LedgerMaster,
      private activatedRoute: ActivatedRoute,
      private loader: LoaderService,
      private toaster: ToastService,
      private router: Router,
       @Optional () public activeModal: NgbActiveModal 

    ) {
      this.activatedRoute.paramMap.subscribe(params => {
        const id = Number(params.get('id'));
        if (id > 0) {
          this.isModify = true;
          this.getCustomerLedgerDetails(id);
        }
      });
    }
@Input() ledgerId!: number;
@Input() defaultLedgerType: string = '';

ngOnInit() {

  this.isExternalCall = !!this.activeModal || !!this.ledgerId;

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
      // this.loader.show();
      this.ledgerService.getLedgerById(id).subscribe({
        next: (res) => {
          console.log(res);
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
            createdDate: res.createdDate
          }
          this.loader.hide();
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
    this.activeModal.close(newId ); 
  }
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
  if (this.isExternalCall) {
    this.router.navigate(['/receipt-entry']);
  } 
  // Default → Customer Ledger listing
  else {
    this.router.navigate(['/customer-ledger']);
  }
}


  }
