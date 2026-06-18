import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Route } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-free-service-rate',
  imports: [CommonModule, SharedModule, FormsModule, ReactiveFormsModule],
  templateUrl: './free-service-rate.html',
  styleUrl: './free-service-rate.scss',
})
export class FreeServiceRate implements OnInit {

  oemModelList: any[] = [];

  claimId: number = 0;
  dataSource: any[] = [
    { srNo: 1, serviceName: '1st Free Service', mertroRate: 0, metroGST: 0, nonMetroRate: 0, nonMetroGST: 0 },
    { srNo: 2, serviceName: '4th Free Service', mertroRate: 0, metroGST: 0, nonMetroRate: 0, nonMetroGST: 0 }
  ];

  isEdit: boolean = false;
  formData: any = {};

  constructor(
    private route: ActivatedRoute
  ) {

  }

  ngOnInit(): void {
    this.oemModelList = history.state.oemModelList || [];

    this.route.params.subscribe(params => {

      const encPO = params['ponumber'];
      const decoded = atob(encPO);

      this.claimId = Number(decoded.split('|')[1]);
      if (this.claimId && this.claimId !== 0) {
        this.isEdit = true;
        this.getClaimDetailsById(this.claimId);
      } else {
        this.isEdit = false;
      }
    });
  }

  getClaimDetailsById(Id: number) {

  }

}
