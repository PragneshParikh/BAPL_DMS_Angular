import {
  Component,
  Input,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { Gender } from '../../constant';
import { EmployeeMasterService } from '../../core/services/employee-master';
import { DealerService } from '../../core/services/dealer-service';
import { LocationMasterService } from '../../core/services/location-master-service';
import { DepartmentService } from '../../core/services/department';
import { DesignationService } from '../../core/services/designation';

@Component({
  selector: 'app-employee-master',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './employee-master.html',
  styleUrls: ['./employee-master.scss']
})
export class EmployeeMasterComponent implements OnInit {

  @Input() popupData: any;
  @Input() isPopupMode: boolean = false;

  genders = Gender;
  employeeData: any = {};
  states: any[] = [];
  cities: any[] = [];
  filteredCities: any[] = [];
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  isEditMode: boolean = false;
  departments: any[] = [];
  designations: any[] = [];
  dealerInfo: any = null;
  dealerLocations: any[] = [];

  constructor(
    private employeeService: EmployeeMasterService,
    private router: Router,
    private route: ActivatedRoute,
    private dealerMasterService: DealerService,
    private locationService: LocationMasterService,
    private departmentService: DepartmentService,
    private designationService: DesignationService
  ) { }

  ngOnInit(): void {

    this.loadStates();
    this.loadCities();
    this.loadDepartments();
    this.loadDesignations();

    // =====================================
    // POPUP / EDIT MODE
    // =====================================
    if (this.popupData) {

      this.isEditMode = true;                       // set FIRST so async callbacks see it

      this.employeeData = { ...this.popupData };

      // normalise dropdown values to trimmed strings so they preselect
      this.employeeData.department =
        this.popupData.department != null ? String(this.popupData.department) : '';

      this.employeeData.designation =
        this.popupData.designation != null ? String(this.popupData.designation) : '';

      this.employeeData.location =
        this.popupData.locationCode != null ? String(this.popupData.locationCode).trim() : '';

      this.employeeData.dateOfJoin = this.formatDate(this.popupData.dateOfJoin);
      this.imagePreview = this.popupData.profileImage;

      if (this.popupData.dealerCode) {
        this.loadDealerInfo(this.popupData.dealerCode);                      // dealer status/info only
        this.loadDealerLocations(this.popupData.dealerCode, this.employeeData.location); // options + preselect
      }

      setTimeout(() => {
        this.onStateChange();
        this.employeeData.city = this.popupData.city;
      }, 300);
    }

    // =====================================
    // ADD MODE — LOGGED-IN DEALER
    // =====================================
    else {
      this.loadLoggedInDealer();
    }
  }

  // =====================================
  // FORMAT DATE FOR <input type="date">
  // =====================================
  formatDate(value: any): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // =====================================
  // LOAD DEALER INFO BY CODE  (info only — does NOT load locations)
  // =====================================
  loadDealerInfo(dealerCode: string): void {
    this.dealerMasterService.getByDealerCode(dealerCode).subscribe({
      next: (response) => { this.dealerInfo = response; },
      error: () => { this.dealerInfo = null; }
    });
  }

  // =====================================
  // LOAD LOGGED-IN DEALER (add mode)
  // =====================================
  loadLoggedInDealer(): void {
    const dealerCode = localStorage.getItem('dealerCode');
    if (!dealerCode) return;

    this.employeeData.dealerCode = dealerCode;
    this.generateEmployeeCode(dealerCode);

    this.dealerMasterService.getByDealerCode(dealerCode).subscribe({
      next: (response) => {
        this.dealerInfo = response;
        this.employeeData.dealerCode = response.dealerCode ?? dealerCode;
        this.loadDealerLocations(response.dealerCode ?? dealerCode);
      },
      error: () => this.loadDealerLocations(dealerCode)
    });
  }

  // =====================================
  // LOAD DEALER LOCATIONS  (+ preselect saved location in edit)
  // =====================================
  loadDealerLocations(dealerCode: string, selectedCode?: string): void {
    this.locationService.getLocationByDealerCode(dealerCode).subscribe({
      next: (response: any[]) => {

        this.dealerLocations = (response ?? []).map(l => ({
          locCode: String(l.locCode ?? l.loccode ?? l.Loccode ?? '').trim(),
          locName: l.locName ?? l.locname ?? l.Locname ?? ''
        }));

        // figure out which code should be selected (trimmed on both sides)
        const saved =
          selectedCode != null
            ? String(selectedCode).trim()
            : (this.isEditMode && this.popupData?.locationCode != null
                ? String(this.popupData.locationCode).trim()
                : '');

        if (saved) {
          // defer so the <option> elements exist before we set the value
          setTimeout(() => {
            const match = this.dealerLocations.find(l => l.locCode === saved);
            this.employeeData.location = match ? match.locCode : '';
          });
        }
      },
      error: (error) => console.error('Dealer location load error', error)
    });
  }

  // =====================================
  // LOAD STATES
  // =====================================
  loadStates(): void {
    this.employeeService.getStates().subscribe({
      next: (response) => { this.states = response; }
    });
  }

  // =====================================
  // LOAD CITIES
  // =====================================
  loadCities(): void {
    this.employeeService.getCities().subscribe({
      next: (response) => { this.cities = response; }
    });
  }

  // =====================================
  // STATE CHANGE
  // =====================================
  onStateChange(): void {
    const selectedStateId = Number(this.employeeData.state);
    this.filteredCities = this.cities.filter((x: any) => x.stateId === selectedStateId);
  }

  // =====================================
  // SAVE / UPDATE
  // =====================================
  onSubmit(form: any): void {

    const employeeObj = {
      id: this.employeeData.id || 0,
      employeeCode: this.employeeData.employeeCode,
      firstName: this.employeeData.firstName,
      lastName: this.employeeData.lastName,
      gender: this.employeeData.gender,
      mobile: this.employeeData.mobile,
      emailId: this.employeeData.emailId,
      password: this.employeeData.password,
      address: this.employeeData.address,
      state: Number(this.employeeData.state),
      city: Number(this.employeeData.city),
      pincode: this.employeeData.pincode,
      dateOfJoin: this.employeeData.dateOfJoin,
      designation: this.employeeData.designation,
      department: this.employeeData.department,
      dealerCode: this.employeeData.dealerCode,
      supervisor: this.employeeData.supervisor,
      isActive: this.employeeData.isActive ?? true,
      profileImage: this.imagePreview as string,
      notes: this.employeeData.notes,
      locationCode: this.employeeData.location,
      createdBy: 'admin',
      createdDate: new Date(),
      updatedBy: 'admin',
      updatedDate: new Date()
    };

    if (this.isEditMode) {
      this.employeeService.updateEmployee(employeeObj).subscribe({
        next: () => { alert('Employee Updated Successfully'); }
      });
    } else {
      this.employeeService.saveEmployee(employeeObj).subscribe({
        next: () => { alert('Employee Saved Successfully'); }
      });
    }
  }

  // =====================================
  // FILE SELECT
  // =====================================
  onFileSelect(event: any): void {
    this.selectedFile = event.target.files[0];
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => { this.imagePreview = e.target?.result!; };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  // =====================================
  // LOAD DEPARTMENTS
  // =====================================
  loadDepartments(): void {
    this.departmentService.get().subscribe({
      next: (response: any[]) => {
        this.departments = response ?? [];
        this.syncDepartmentSelection();
      },
      error: (error) => console.error('Department load error', error)
    });
  }

  syncDepartmentSelection(): void {
    const current = this.employeeData?.department;
    if (current == null || current === '') return;
    const val = String(current);
    this.employeeData.department =
      this.departments.some(d => String(d.departmentId) === val) ? val : '';
  }

  // =====================================
  // LOAD DESIGNATIONS
  // =====================================
  loadDesignations(): void {
    this.designationService.get().subscribe({
      next: (response: any[]) => {
        this.designations = response ?? [];
        this.syncDesignationSelection();
      },
      error: (error) => console.error('Designation load error', error)
    });
  }

  syncDesignationSelection(): void {
    const current = this.employeeData?.designation;
    if (current == null || current === '') return;
    const val = String(current);
    this.employeeData.designation =
      this.designations.some(d => String(d.designationId) === val) ? val : '';
  }

  // =====================================
  // BACK
  // =====================================
  backToList(): void {
    this.router.navigate(['/employee']);
  }

  // =====================================
  // GENERATE EMPLOYEE CODE
  // =====================================
  generateEmployeeCode(dealerCode: string): void {
    const baseCode = dealerCode;
    this.employeeService.getEmployees().subscribe({
      next: (employees: any[]) => {
        let maxSeq = 0;
        (employees ?? []).forEach(e => {
          const code: string = e?.employeeCode ?? '';
          if (code.startsWith(baseCode)) {
            const suffix = code.substring(baseCode.length);
            const num = parseInt(suffix, 10);
            if (!isNaN(num) && num > maxSeq) maxSeq = num;
          }
        });
        const nextSeq = maxSeq + 1;
        this.employeeData.employeeCode = baseCode + nextSeq.toString().padStart(4, '0');
      },
      error: (error) => console.error('Employee code generation error', error)
    });
  }
}