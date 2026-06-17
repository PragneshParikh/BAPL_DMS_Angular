import { Component, OnInit } from '@angular/core';
import { StorageService } from '../../../core/services/storage';
import { DealerService } from '../../../core/services/dealer-service';
import { DealerMasterViewModel } from '../../../ViewModels/Dealer/DealerMasterViewModel';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-delivery-slip',
  imports: [],
  templateUrl: './delivery-slip.html',
  styleUrl: './delivery-slip.scss',
})
export class DeliverySlip implements OnInit {
  dealer: DealerMasterViewModel;
  partyName!: string;
  modelName!: string;
  chassisNo!: string;
  motorNo!: string;
  regNo!: string;
  dealerCode: any;
  /**
   *
   */
  constructor(private storageService: StorageService,
    private dealerService: DealerService,
    private route: ActivatedRoute
  ) {

  }
  ngOnInit(): void {
   
    this.route.queryParams.subscribe(params => {
      this.partyName = params['partyName'];
      this.modelName = params['modelName'];
      this.chassisNo = params['chassisNo'];
      this.motorNo = params['motorNo'];
      this.regNo = params['regNo'];
      this.dealerCode =params['dealerCode'];
    });
     this.getDealerDetails(this.dealerCode);
  }

  getDealerDetails(dealerCode:string) {

    this.dealerService.getByDealerCode(dealerCode).subscribe((res: any) => {
      this.dealer = res?.data|| null;
      console.log(this.dealer);
      

    });
  }
}
