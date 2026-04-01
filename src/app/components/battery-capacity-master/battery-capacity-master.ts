import { Component, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbPaginationModule, NgbHighlight, NgbModal, NgbModalRef, NgbTooltip, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { BatteryCapacityMasterService } from '../../core/services/battery-capacity-master-service';
import { ToastService } from '../../shared/toaster/toast-service';
import { BatteryApiResponse, BatteryCapacity } from '../../ViewModels/BatteryCapacityMaster/BatteryCapacity';
import { AuthenticationService } from '../../core/services/auth.service';
import { AccessRoles } from '../../constant';

@Component({
  selector: 'app-battery-capacity-master',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbPaginationModule, NgbHighlight, NgbTooltipModule],
  templateUrl: './battery-capacity-master.html',
  styleUrl: './battery-capacity-master.scss',
})
export class BatteryCapacityMaster {

  allBatteryCapacities: BatteryCapacity[] = [];
  filteredBatteryCapacities: BatteryCapacity[] = [];

  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  searchTerm = '';
  page = 1;
  pageSize = 10;

  selectedBattery: BatteryCapacity = {
    id: 0,
    batteryCapacity: '',
    isActive: true
  };

  isEditMode = false;

  private modalRef!: NgbModalRef;

  batteryCapacityAccess = 0;
  accessRole = AccessRoles;

  constructor(
    private batteryService: BatteryCapacityMasterService,
    private modalService: NgbModal,
    public toastService: ToastService,
    private authenticationService: AuthenticationService
  ) { }

  /* ================= INIT ================= */

  ngOnInit(): void {
    this.loadBatteryCapacities();
    this.batteryCapacityAccess = this.authenticationService.getAccessPermission(8);
  }

  /* ================= LOAD ================= */

  loadBatteryCapacities(): void {

    this.batteryService.getBatteryCapcityMaster().subscribe({

      next: (res: BatteryApiResponse) => {

        this.allBatteryCapacities = res.data || [];
        this.filteredBatteryCapacities = [...this.allBatteryCapacities];

      }

    });

  }

  /* ================= PAGINATION ================= */

  get paginatedData(): BatteryCapacity[] {

    const start = (this.page - 1) * this.pageSize;
    return this.filteredBatteryCapacities.slice(start, start + this.pageSize);

  }

  /* ================= SEARCH ================= */

  onSearchChange(): void {

    if (!this.searchTerm) {
      this.filteredBatteryCapacities = [...this.allBatteryCapacities];
      return;
    }

    this.filteredBatteryCapacities = this.allBatteryCapacities.filter(x =>
      x.batteryCapacity.toLowerCase().includes(this.searchTerm.toLowerCase())
    );

    this.page = 1;

  }

  /* ================= MODAL ================= */

  openAddModal(content: TemplateRef<unknown>): void {

    this.isEditMode = false;

    this.selectedBattery = {
      id: 0,
      batteryCapacity: '',
      isActive: true
    };

    this.modalRef = this.modalService.open(content, { centered: true });

  }

  openEditModal(content: TemplateRef<unknown>, item: BatteryCapacity): void {

    this.isEditMode = true;

    this.selectedBattery = { ...item };

    this.modalRef = this.modalService.open(content, { centered: true });

  }

  /* ================= ADD ================= */

  addBattery(): void {

    if (!this.selectedBattery.batteryCapacity) {

      this.toastService.show('Battery Capacity is required', {
        classname: 'bg-danger text-white',
        delay: 4000
      });

      return;
    }

    this.batteryService.addBatteryCapacityMaster(this.selectedBattery)
      .subscribe({

        next: () => {

          this.toastService.show('Battery capacity added successfully!', {
            classname: 'bg-success text-white',
            delay: 5000
          });

          this.modalRef.close();
          this.loadBatteryCapacities();

        },

        error: () => {

          this.toastService.show('Failed to add battery capacity', {
            classname: 'bg-danger text-white',
            delay: 5000
          });

        }

      });

  }

  /* ================= UPDATE ================= */

  updateBattery(): void {

    this.batteryService
      .updateBatteryCapacityMaster(this.selectedBattery.id, this.selectedBattery)
      .subscribe({

        next: () => {

          this.modalRef.close();

          this.toastService.show('Battery capacity updated successfully!', {
            classname: 'bg-success text-white',
            delay: 5000
          });

          this.loadBatteryCapacities();

        },

        error: () => {

          this.toastService.show('Something went wrong while updating!', {
            classname: 'bg-danger text-white',
            delay: 5000
          });

        }

      });

  }

  /* ================= EXCEL ================= */

  downloadBatteryCapacityMasterExcel(): void {

    this.batteryService.downloadBatteryCapacityMasterExcel().subscribe((data: Blob) => {

      const blob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'BatteryCapacityList.xlsx';
      link.click();

      window.URL.revokeObjectURL(url);

    });

  }

  /* ================= SORT ================= */

  onSort(column: string): void {

    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredBatteryCapacities.sort((a, b) => {

      switch (column) {

        case 'batteryCapacity': {

          const numA = parseFloat(a.batteryCapacity);
          const numB = parseFloat(b.batteryCapacity);

          if (numA !== numB) {
            return this.sortDirection === 'asc' ? numA - numB : numB - numA;
          }

          return this.sortDirection === 'asc'
            ? a.batteryCapacity.localeCompare(b.batteryCapacity)
            : b.batteryCapacity.localeCompare(a.batteryCapacity);
        }

        case 'isActive': {

          const valA = a.isActive ? 1 : 0;
          const valB = b.isActive ? 1 : 0;

          return this.sortDirection === 'asc' ? valA - valB : valB - valA;
        }

        default:
          return 0;
      }

    });

    this.page = 1;

  }

}