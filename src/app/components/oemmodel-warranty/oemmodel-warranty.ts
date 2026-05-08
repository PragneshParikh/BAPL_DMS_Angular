import { Component } from '@angular/core';
import { OemModelWarranty } from '../../ViewModels/OemModelWarranty';
import { OemmodelWarrantyService } from '../../core/services/oemmodel-warranty-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbHighlight, NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { FlatpickrDefaults, FlatpickrModule } from 'angularx-flatpickr';
import { Router, RouterOutlet } from '@angular/router';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';

@Component({
  selector: 'app-oemmodel-warranty',
  imports: [CommonModule,
    FormsModule,
    NgbHighlight,
    NgbPaginationModule,
    FlatpickrModule,
    RouterOutlet,
    NgbTooltipModule
  ],
  templateUrl: './oemmodel-warranty.html',
  styleUrl: './oemmodel-warranty.scss',
   providers: [FlatpickrDefaults, FlatpickrModule],
})
export class OemmodelWarranty {
  list: OemModelWarranty[] = [];
  filteredList: OemModelWarranty[] = [];
  paginatedList: OemModelWarranty[] = [];
sortDirection: { [key: string]: boolean } = {};
  page = 1;
  pageSize = 10;
today: string = new Date().toISOString().split('T')[0];
  searchTerm = '';

  filter = {
    oemmodelId: null as number | null,
    searchTerm: '',
  effectiveDateFrom: '' as string | null,
  effectiveDateTo: '' as string | null
};

  constructor(private service: OemmodelWarrantyService, private router: Router, private loader:LoaderService,private toaster:ToastService) {}

  ngOnInit(): void {
     this.loadData();
    //this.setDefaultDates();
  }

  setDefaultDates(): void {
  const today = new Date();

  const toDate = new Date(today);
  const fromDate = new Date(today);
  fromDate.setDate(today.getDate() - 7);

  this.filter.effectiveDateTo = this.formatDate(toDate);
  this.filter.effectiveDateFrom = this.formatDate(fromDate);
  //this.loadData();
}
formatDate(date: Date): string {
  return date.toISOString().split('T')[0]; // required for Flatpickr
}
  //  Load Data from API
 loadData(): void {
  this.loader.show();
  this.service.getAll(this.filter).subscribe({
    next: (res) => {
      this.list = res;
      this.filteredList = [...this.list];
      this.updatePagination();
      this.loader.hide();
    },
  error(err) {
    this.loader.hide();
  this.toaster.show('Failed to fetch receipt entries!', {
            classname: 'bg-warning text-white',
            delay: 5000
          });
  },
  });
  this.loader.hide();
}



 onSearch(): void {
  this.page = 1;
  this.loadData(); // CALL API
}

 onSearchChange(): void {
  this.filter.searchTerm = this.searchTerm;
  this.loadData();
}

 resetFilter(): void {
  this.filter = {
    oemmodelId: null,
    searchTerm: '',
    effectiveDateFrom: null,
    effectiveDateTo: null
  };

  this.searchTerm = '';
  this.loadData();
}

  // Sorting
sort(field: keyof OemModelWarranty): void {
  this.sortDirection[field] = !this.sortDirection[field];
  const direction = this.sortDirection[field] ? 1 : -1;

  this.filteredList.sort((a, b) => {
    let valA = a[field];
    let valB = b[field];

    if (valA == null) return -1 * direction;
    if (valB == null) return 1 * direction;

    if (field === 'effectiveDate') {
      return (new Date(valA as string).getTime() - new Date(valB as string).getTime()) * direction;
    }

    if (typeof valA === 'number' && typeof valB === 'number') {
      return (valA - valB) * direction;
    }

    if (typeof valA === 'boolean' && typeof valB === 'boolean') {
      return ((valA === valB) ? 0 : valA ? 1 : -1) * direction;
    }

    return valA.toString().localeCompare(valB.toString()) * direction;
  });

  this.updatePagination();
}

  // Pagination
  updatePagination(): void {
    const start = (this.page - 1) * this.pageSize;
    this.paginatedList = this.filteredList.slice(start, start + this.pageSize);
  }

  onPageChange(page: number): void {
    this.page = page;
    this.updatePagination();
  }

   //  Delete
  delete(id: number): void {
    if (!confirm('Are you sure you want to delete?')) return;

    this.service.delete(id).subscribe({
      next: () => {
        this.loadData();
      },
      error: (err) => console.error(err)
    });
  }

  addNew() {
  this.router.navigate(['/oemmodel-warranty/add']);
}

edit(item: OemModelWarranty) {
  console.log("Editing item:", item);
  this.router.navigate(['/oemmodel-warranty/edit', item.id]);
}

downloadExcel(): void {
  this.loader.show();

  this.service.downloadExcel().subscribe({
    next: (data: Blob) => {

      const blob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'OEMModelWarranty.xlsx';
      link.click();

      window.URL.revokeObjectURL(url);

      //  Success toaster
      this.toaster.show('Excel downloaded successfully!', {
        classname: 'bg-success text-white',
        delay: 3000
      });

      this.loader.hide();
    },

    error: (err) => {
      console.error('Download error:', err);

      // Error toaster
      this.toaster.show('Failed to download Excel!', {
        classname: 'bg-danger text-white',
        delay: 5000
      });

      this.loader.hide();
    }
  });
}

}
