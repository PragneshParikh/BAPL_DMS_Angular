import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbPaginationModule, NgbHighlight, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BatteryCapacityMasterService } from '../../core/services/battery-capacity-master-service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-battery-capacity-master',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbPaginationModule, NgbHighlight],
  templateUrl: './battery-capacity-master.html',
  styleUrl: './battery-capacity-master.scss',
})

export class BatteryCapacityMaster {

  allBatteryCapacities: any[] = [];
  filteredBatteryCapacities: any[] = [];
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  searchTerm = '';
  page = 1;
  pageSize = 10;

  selectedBattery: any = {};
  isEditMode = false;

  constructor(
    private batteryService: BatteryCapacityMasterService,
    private modalService: NgbModal
  ) { }

  ngOnInit() {
    this.loadBatteryCapacities();
  }

  loadBatteryCapacities() {

    this.batteryService.getBatteryCapcityMaster().subscribe({

      next: (res: any) => {

        this.allBatteryCapacities = res.data;
        this.filteredBatteryCapacities = [...this.allBatteryCapacities];

      }

    });

  }

  get paginatedData() {

    const start = (this.page - 1) * this.pageSize;
    return this.filteredBatteryCapacities.slice(start, start + this.pageSize);

  }

  onSearchChange() {

    if (!this.searchTerm) {
      this.filteredBatteryCapacities = [...this.allBatteryCapacities];
      return;
    }

    this.filteredBatteryCapacities = this.allBatteryCapacities.filter(x =>
      x.batteryCapacity.toLowerCase().includes(this.searchTerm.toLowerCase())
    );

    this.page = 1;

  }

  openAddModal(content: any) {

    this.isEditMode = false;

    this.selectedBattery = {
      batteryCapacity: '',
      isActive: true
    };

    this.modalService.open(content, { centered: true });

  }

  openEditModal(content: any, item: any) {

    this.isEditMode = true;

    this.selectedBattery = { ...item };

    this.modalService.open(content, { centered: true });

  }

  addBattery(modal: any) {

    if (!this.selectedBattery.batteryCapacity) {
      alert('Battery Capacity is required');
      return;
    }

    this.batteryService.addBatteryCapacityMaster(this.selectedBattery)
      .subscribe({

        next: (res: any) => {

          Swal.fire({
  title: "Success!",
  text: "Battery capacity added successfully!",
  icon: "success",
  draggable: true
});

          modal.close();

          this.loadBatteryCapacities();

        },

        error: () => {

            Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Something went wrong!",
           
          });

        }

      });

  }

  updateBattery(modal: any) {

    this.batteryService
      .updateBatteryCapacityMaster(this.selectedBattery.id, this.selectedBattery)
      .subscribe({

        next: (res: any) => {


          modal.close();

          this.loadBatteryCapacities();

        },

        error: () => {

          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Something went wrong!",
           
          });

        }

      });

  }

  confirmUpdate(modal: any) {

    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to update this Battery Capacity?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Update"
    }).then((result) => {

      if (result.isConfirmed) {

        this.updateBattery(modal);
        Swal.fire("BatteryCapacity Masteru Udated!");


      }
      else {
        Swal.fire("Changes not saved!");

      }

    });

  }


  downloadBatteryCapacityMasterExcel() {

    this.batteryService.downloadBatteryCapacityMasterExcel().subscribe((data: Blob) => {

      const blob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const downloadURL = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = downloadURL;
      link.download = 'BatteryCapacityList.xlsx';

      link.click();

      window.URL.revokeObjectURL(downloadURL);

    });

  }


  // onSort(column: string) {

  //   if (this.sortColumn === column) {
  //     this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  //   } else {
  //     this.sortColumn = column;
  //     this.sortDirection = 'asc';
  //   }

  //   this.filteredBatteryCapacities.sort((a, b) => {

  //     let valueA = a[column];
  //     let valueB = b[column];

  //     // Handle boolean sorting
  //     if (typeof valueA === 'boolean') valueA = valueA ? 1 : 0;
  //     if (typeof valueB === 'boolean') valueB = valueB ? 1 : 0;

  //     // Handle null values
  //     if (valueA == null) valueA = '';
  //     if (valueB == null) valueB = '';

  //     valueA = valueA.toString().toLowerCase();
  //     valueB = valueB.toString().toLowerCase();

  //     if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
  //     if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;

  //     return 0;

  //   });

  // }

  onSort(column: string) {

    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredBatteryCapacities.sort((a, b) => {

      let valueA = a[column];
      let valueB = b[column];

      // Boolean handling
      if (typeof valueA === 'boolean') valueA = valueA ? 1 : 0;
      if (typeof valueB === 'boolean') valueB = valueB ? 1 : 0;

      // Battery capacity numeric sorting
      if (column === 'batteryCapacity') {

        const numA = parseFloat(valueA);
        const numB = parseFloat(valueB);

        if (numA !== numB) {
          return this.sortDirection === 'asc'
            ? numA - numB
            : numB - numA;
        }

        return this.sortDirection === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      // Normal sorting
      valueA = valueA?.toString().toLowerCase() || '';
      valueB = valueB?.toString().toLowerCase() || '';

      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;

      return 0;

    });

    this.page = 1;

  }
}