import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { error } from 'console';
import { LedgerMaster } from '../../core/services/ledger-master';
import { ActivatedRoute, Router } from '@angular/router';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import { tap } from 'rxjs';

@Component({
  selector: 'app-customer-ledger',
  imports: [FormsModule],
  templateUrl: './customer-ledger.html',
  styleUrl: './customer-ledger.scss',
})
export class CustomerLedger {
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

  private isModify = false;

  constructor(
    private ledgerService: LedgerMaster,
    private activatedRoute: ActivatedRoute,
    private loader: LoaderService,
    private toaster: ToastService,
    private router: Router
  ) {
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
        next: () => {
          this.toaster.show(
            `Ledger details ${this.isModify ? 'updated' : 'added'} successfully!`,
            { classname: 'bg-success text-white', delay: 5000 }
          );
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
    this.router.navigate(['/customer-ledger']);
  }


}
