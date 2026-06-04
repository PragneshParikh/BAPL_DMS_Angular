import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { zonesData } from '../../constant';
import { DealerService } from '../../core/services/dealer-service';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import { StorageService } from '../../core/services/storage';
import { CircularDealerAssignmentService } from '../../core/services/circular-dealer-assignment';

@Component({
  selector: 'app-circular-permission',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './circular-permission.html',
  styleUrl: './circular-permission.scss',
})
export class CircularPermission implements OnInit {
  @Input() selectedData: any;
  zones = zonesData;

  selectedZone: any;
  zoneItems: any[] = [];
  dealerList: any[] = [];
  dealerAssignments: any[] = [];
  originalAssignments: any[] = [];

  userId: string | null = null;

  constructor(
    public activeModal: NgbActiveModal,
    private dealerService: DealerService,
    private loader: LoaderService,
    private toaster: ToastService,
    private storageService: StorageService,
    private circularDealerAssignmentService: CircularDealerAssignmentService
  ) {
    this.userId = this.storageService.getUserId();
  }

  ngOnInit(): void {
    // this.getDealers();
    this.getCircularPermissions(this.selectedData.id);
  }

  // getDealers() {
  //   this.loader.show();
  //   this.dealerService.getDealers().subscribe(
  //     (dealers: any) => {
  //       this.loader.hide();
  //       this.dealerList = dealers.data;
  //       console.log("Fetched Dealers: ", this.dealerList);
  //     },
  //     (error) => {
  //       this.loader.hide();
  //       console.error('Error fetching dealers:', error);
  //       this.toaster.show('Something went wrong while fetching dealers.', { classname: 'bg-danger text-light', delay: 5000 });
  //     }
  //   );
  // }

  selectZone(zone: any) {
    this.selectedZone = zone;
    this.zoneItems = this.dealerList.filter(x => x.areaOfficeId === zone.id);
  }

  close(isAccepted) {
    if (isAccepted) {
      const changes = this.getAssignmentChanges();

      this.activeModal.close({
        isAccepted: true,
        addAssignments: changes.addAssignments,
        deleteAssignments: changes.deleteAssignments
      });
    } else {
      this.activeModal.dismiss("closed");
    }
  }

  onDealerSelectionChange(item: any, event: any) {

    const isChecked = event.target.checked;
    item.isSelected = isChecked;

    if (isChecked) {

      const exists = this.dealerAssignments.some(
        x => x.dealerCode === item.dealerCode
      );

      if (!exists) {
        this.dealerAssignments.push({
          id: 0,
          circularId: this.selectedData.id,
          dealerCode: item.dealerCode,
          dealerName: item.dealerName,
          isSelected: true,
          createdBy: this.userId,
          createdDate: new Date()
        });
      }

    } else {

      this.dealerAssignments = this.dealerAssignments.filter(
        x => x.dealerCode !== item.dealerCode
      );
    }
  }

  getCircularPermissions(circularId: number) {
    this.loader.show();
    this.circularDealerAssignmentService.getAssignmentsByCircularAndDealer(circularId).subscribe({
      next: (response: any) => {
        this.loader.hide();
        this.dealerList = response;
        this.originalAssignments = response.filter(x => x.isSelected);
        this.dealerAssignments = [...this.originalAssignments];
      },
      error: (err: any) => {
        this.loader.hide();
        console.error('Error fetching circular permissions:', err);
        this.toaster.show('Something went wrong while fetching circular permissions.', { classname: 'bg-danger text-light', delay: 5000 });
      }
    });
  }

  getAssignmentChanges() {

    const addAssignments = this.dealerAssignments.filter(
      current =>
        !this.originalAssignments.some(
          original => original.dealerCode === current.dealerCode
        )
    );

    const deleteAssignments = this.originalAssignments.filter(
      original =>
        !this.dealerAssignments.some(
          current => current.dealerCode === original.dealerCode
        )
    );

    return {
      addAssignments,
      deleteAssignments
    };
  }
}