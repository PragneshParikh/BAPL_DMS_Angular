import { Component, OnInit, TemplateRef } from '@angular/core';
import { BatteryApiResponse, BatteryCapacity } from '../../ViewModels/BatteryCapacityMaster/BatteryCapacity';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbHighlight, NgbModal, NgbModalRef, NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { AccessRoles } from '../../constant';
import { AuthenticationService } from '../../core/services/auth.service';
import { BatteryCapacityMasterService } from '../../core/services/battery-capacity-master-service';
import { ToastService } from '../../shared/toaster/toast-service';
import { LoaderService } from '../../core/services/loader';
import { Occupation, OccupationApiResponse } from '../../ViewModels/OccupationMasterViewModel';
import { OccupationService } from '../../core/services/occupation-service';

@Component({
  selector: 'app-occupation-master',
  imports: [CommonModule, FormsModule, NgbPaginationModule, NgbHighlight, NgbTooltipModule],
  templateUrl: './occupation-master.html',
  styleUrl: './occupation-master.scss',
})
export class OccupationMaster implements OnInit {

  allOccupations: Occupation[] = [];
  filteredOccupations: Occupation[] = [];
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  searchTerm = '';
  page = 1;
  pageSize = 10;
  selectedOccupation: Occupation = {
    id: 0,
    occupationName: '',
    isActive: true
  };

  isEditMode = false;
  private modalRef!: NgbModalRef;
  occupationAccess = 0;
  accessRole = AccessRoles;
  constructor(
    private occupationService: OccupationService,
    private modalService: NgbModal,
    public toastService: ToastService,
    private loader: LoaderService,
    private authenticationService: AuthenticationService
  ) { }

  ngOnInit(): void {
    this.loadOccupations();
  }

  /* ================= LOAD ================= */
  loadOccupations(): void {
    this.loader.show();
    this.occupationService.getOccupationMasters().subscribe({
      next: (res: OccupationApiResponse) => {
        this.allOccupations = res.data || [];
        this.filteredOccupations = [...this.allOccupations];
        this.loader.hide();
      },
      error: () => {
        this.loader.hide();
        this.toastService.show(
          'Failed to load occupations', {
          classname: 'bg-danger text-white',
          delay: 5000
        }
        );
      }
    });
  }

  /* ================= PAGINATION ================= */

  get paginatedData(): Occupation[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredOccupations.slice(start, start + this.pageSize);
  }

  /* ================= SEARCH ================= */
  onSearchChange(): void {
    if (!this.searchTerm) {
      this.filteredOccupations = [...this.allOccupations];
      this.page = 1;
      return;
    }
    this.filteredOccupations = this.allOccupations.filter(x => x.occupationName?.toLowerCase().includes(this.searchTerm.toLowerCase()));
    this.page = 1;
  }

  /* ================= MODAL ================= */
  openAddModal(content: TemplateRef<unknown>): void {
    this.isEditMode = false;
    this.selectedOccupation = {
      id: 0,
      occupationName: '',
      isActive: true
    };
    this.modalRef = this.modalService.open(content, {
      centered: true
    });
  }

  openEditModal(content: TemplateRef<unknown>, item: Occupation): void {
    this.isEditMode = true;
    this.selectedOccupation = { ...item };
    this.modalRef = this.modalService.open(content, {
      centered: true
    });
  }
  /* ================= ADD ================= */
  addOccupation(): void {
    if (!this.selectedOccupation.occupationName?.trim()) {
      this.toastService.show('Occupation Name is required',
        {
          classname: 'bg-danger text-white',
          delay: 4000
        }
      );
      return;
    }
    this.loader.show();
    this.occupationService.addOccupationMaster(this.selectedOccupation).subscribe({
      next: () => {
        this.loader.hide();
        this.toastService.show('Occupation added successfully!',
          {
            classname: 'bg-success text-white',
            delay: 5000
          }
        );
        this.modalRef.close();
        this.loadOccupations();
      },
      error: () => {
        this.loader.hide();
        this.toastService.show('Failed to add occupation',
          {
            classname: 'bg-danger text-white',
            delay: 5000
          }
        );
      }
    });
  }

  /* ================= UPDATE ================= */
  updateOccupation(): void {
    if (!this.selectedOccupation.occupationName?.trim()) {
      this.toastService.show('Occupation Name is required',
        {
          classname: 'bg-danger text-white',
          delay: 4000
        }
      );
      return;
    }
    this.loader.show();
    this.occupationService.updateOccupationMaster(this.selectedOccupation.id, this.selectedOccupation)
      .subscribe({
        next: () => {
          this.loader.hide();
          this.modalRef.close();
          this.toastService.show('Occupation updated successfully!',
            {
              classname: 'bg-success text-white',
              delay: 5000
            }
          );
          this.loadOccupations();
        },
        error: () => {
          this.loader.hide();
          this.toastService.show('Failed to update occupation',
            {
              classname: 'bg-danger text-white',
              delay: 5000
            }
          );
        }
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

    this.filteredOccupations.sort((a: any, b: any) => {
      switch (column) {
        case 'occupationName':
          return this.sortDirection === 'asc' ? a.occupationName.localeCompare(b.occupationName) : b.occupationName.localeCompare(a.occupationName);
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