import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { Gender } from '../../constant';
import { EmployeeMasterService } from '../../core/services/employee-master';
import { DealerService } from '../../core/services/dealer-service';
import { LocationMasterService } from '../../core/services/location-master-service';
import { DepartmentService } from '../../core/services/department';
import { DesignationService } from '../../core/services/designation';
import { RoleService } from '../../core/services/Deptrole';


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
  @Output() closed = new EventEmitter<void>();

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
  selectedLocations: string[] = []; 

  // ============================
  // DEPARTMENT -> ROLES (cascading)
  // ============================
  departmentOptions: { id: string; name: string }[] = [];   // top-level checkboxes (DepartmentMaster)
  selectedDepartments: string[] = [];                        // checked department names
  allRoles: { name: string }[] = [];                         // all AspNetRoles
  rolesByDepartment: { [dept: string]: { name: string }[] } = {};  // roles revealed per dept
  selectedRoles: string[] = [];

  // ============================
  // VALIDATION
  // ============================
  // FIX: previously only mobile/pincode/password had inline messages —
  // every other required field silently disabled the Save button with no
  // explanation. Extended to cover every field isFormValid() already
  // enforces, so the user always sees *why* Save is blocked.
  errors: {
    firstName?: string;
    lastName?: string;
    gender?: string;
    mobile?: string;
    dateOfJoin?: string;
    location?: string;
    department?: string;
    designation?: string;
    state?: string;
    city?: string;
    pincode?: string;
    emailId?: string;
    password?: string;
    category?: string;
    role?: string;
  } = {};

  private readonly emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private readonly strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;

  // =====================================
  // CONSTRUCTOR
  // =====================================
  constructor(
    private employeeService: EmployeeMasterService,
    private router: Router,
    private route: ActivatedRoute,
    private dealerMasterService: DealerService,
    private locationService: LocationMasterService,
    private departmentService: DepartmentService,
    private designationService: DesignationService,
    private roleService: RoleService
  ) { }

  ngOnInit(): void {

    this.loadStates();
    this.loadCities();
    this.loadDepartments();
    this.loadDesignations();
    this.loadDepartmentOptions();   // department checkboxes
    this.loadAllRoles();            // AspNet roles (filtered on department check)

    // =====================================
    // POPUP EDIT MODE
    // =====================================
    if (this.popupData) {

      this.employeeData = { ...this.popupData };

      // make dropdown values match the string option values so they preselect
      this.employeeData.department =
        this.popupData.department != null ? String(this.popupData.department) : '';

      this.employeeData.designation =
        this.popupData.designation != null ? String(this.popupData.designation) : '';

      this.employeeData.location =
        this.popupData.locationCode != null ? String(this.popupData.locationCode).trim() : '';

      this.employeeData.dateOfJoin = this.formatDate(this.popupData.dateOfJoin);
      this.imagePreview = this.popupData.profileImage;
     // show login fields if this employee already has a login email
      this.employeeData.createLogin = !!this.popupData.emailId;
      this.selectedRoles = this.popupData.roles?.length ? [...this.popupData.roles] : [];
      this.selectedDepartments = this.popupData.selectedDepartments?.length
    ? [...this.popupData.selectedDepartments] : [];
      this.selectedRoles = this.popupData.roles?.length
        ? [...this.popupData.roles] : [];

      this.selectedDepartments.forEach(dept => {
        this.roleService.getByCategory(dept).subscribe({
          next: (res: any[]) => {
            this.rolesByDepartment[dept] = (res ?? []).map(r => ({ name: r.name ?? r.Name }));
          },
          error: () => { this.rolesByDepartment[dept] = []; }
        });
      });

      if (this.popupData.dealerCode) {
        this.loadDealerInfo(this.popupData.dealerCode);
        this.loadDealerLocations(this.popupData.dealerCode);
      }
    const savedLoc = this.popupData.locationCode;
    this.selectedLocations = savedLoc
      ? String(savedLoc).split(',').map((c: string) => c.trim()).filter(Boolean)
      : [];
      this.isEditMode = true;

      setTimeout(() => {
        this.onStateChange();
        this.employeeData.city = this.popupData.city;
      }, 300);
    }

    // =====================================
    // ADD MODE — LOGGED-IN DEALER
    // =====================================
    else {
      this.employeeData.createLogin = false;
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
  // LOAD DEALER INFO BY CODE (info only)
  // =====================================
  loadDealerInfo(dealerCode: string): void {
    this.dealerMasterService.getByDealerCode(dealerCode).subscribe({
      next: (response) => { this.dealerInfo = response; },
      error: () => { this.dealerInfo = null; }
    });
  }

  // =====================================
  // LOAD LOGGED-IN DEALER
  // =====================================
  loadLoggedInDealer(): void {
    const dealerCode = localStorage.getItem('dealerCode');   // e.g. "CUS0435"
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
  // LOAD DEALER LOCATIONS
  // =====================================
  loadDealerLocations(dealerCode: string): void {
    this.locationService.getAllLocationByDealerCode(dealerCode).subscribe({
      next: (response: any[]) => {

        this.dealerLocations = (response ?? []).map(l => ({
          locCode: String(l.locCode ?? l.loccode ?? l.Loccode ?? '').trim(),
          locName: l.locName ?? l.locname ?? l.Locname ?? ''
        }));

        const saved =
          this.isEditMode && this.popupData?.locationCode != null
            ? String(this.popupData.locationCode).trim()
            : '';

        if (saved) {
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
  // DEPARTMENT OPTIONS (top-level checkboxes)
  // =====================================
  loadDepartmentOptions(): void {
    this.departmentService.get().subscribe({
      next: (res: any[]) => {
        this.departmentOptions = (res ?? [])
          .filter(d => d.isActive)
          .map(d => ({ id: String(d.departmentId), name: d.departmentName }));
      },
      error: (e) => console.error('Department options load error', e)
    });
  }

  // =====================================
  // ALL ROLES (from AspNetRoles)
  // =====================================
  loadAllRoles(): void {
    this.roleService.getRoles().subscribe({
      next: (res: any[]) => {
        this.allRoles = (res ?? []).map(r => ({ name: r.name ?? r.Name }));
      },
      error: (e) => console.error('Role load error', e)
    });
  }

  // =====================================
  // DEPARTMENT CHECKBOX HELPERS
  // =====================================
  isDepartmentSelected(dept: string): boolean {
    return this.selectedDepartments.includes(dept);
  }

  onDepartmentToggle(dept: string, event: any): void {
  if (event.target.checked) {
    if (!this.selectedDepartments.includes(dept)) this.selectedDepartments.push(dept);

    // pull roles mapped to this category from RoleCategoryMapping
    this.roleService.getByCategory(dept).subscribe({
      next: (res: any[]) => {
        this.rolesByDepartment[dept] = (res ?? []).map(r => ({ name: r.name ?? r.Name }));
      },
      error: () => { this.rolesByDepartment[dept] = []; }
    });
  } else {
    this.selectedDepartments = this.selectedDepartments.filter(d => d !== dept);

    const removed = (this.rolesByDepartment[dept] ?? []).map(r => r.name);
    delete this.rolesByDepartment[dept];
    this.selectedRoles = this.selectedRoles.filter(r => !removed.includes(r));
  }
}

  // =====================================
  // ROLE CHECKBOX HELPERS
  // =====================================
  isRoleSelected(role: string): boolean {
    return this.selectedRoles.includes(role);
  }

  toggleRole(role: string, event: any): void {
    if (event.target.checked) {
      if (!this.selectedRoles.includes(role)) this.selectedRoles.push(role);
    } else {
      this.selectedRoles = this.selectedRoles.filter(r => r !== role);
    }
  }
  onlyDigits(event: any, field: 'mobile' | 'pincode', maxLen: number): void {
    let value = String(event.target.value || '').replace(/\D/g, '');  // remove non-digits
    if (value.length > maxLen) {
      value = value.slice(0, maxLen);
    }
    this.employeeData[field] = value;
    event.target.value = value;   // keep the input box in sync
  }

  // =====================================
  // VALIDATION
  // FIX: extended to cover every field isFormValid() already requires,
  // each with its own inline message instead of relying solely on a
  // disabled Save button (which gives no explanation of what's missing).
  //
  // FIX 2: Email / Password / Category are no longer mandatory when
  // "Create Login Account" is checked. If the user leaves them blank, the
  // employee is simply saved without a login (handled server-side). If
  // something IS entered, we still validate its format/strength so we
  // don't save garbage. Role is only required if a Category was actually
  // picked, since a role with no category makes no sense.
  // =====================================
  validateForm(): boolean {
    this.errors = {};
    let valid = true;
    const d = this.employeeData;

    if (!d.firstName?.trim()) {
      this.errors.firstName = 'First name is required.';
      valid = false;
    }

    if (!d.lastName?.trim()) {
      this.errors.lastName = 'Last name is required.';
      valid = false;
    }

    if (!d.gender) {
      this.errors.gender = 'Gender is required.';
      valid = false;
    }

    const mobile = String(d.mobile ?? '').trim();
    if (!mobile) {
      this.errors.mobile = 'Mobile number is required.';
      valid = false;
    } else if (!/^\d{10}$/.test(mobile)) {
      this.errors.mobile = 'Mobile number must be exactly 10 digits.';
      valid = false;
    }

    if (!d.dateOfJoin) {
      this.errors.dateOfJoin = 'Date of joining is required.';
      valid = false;
    }

    if (this.selectedLocations.length === 0) {
      this.errors.location = 'Select at least one dealer location.';
      valid = false;
    }

    if (!d.department) {
      this.errors.department = 'Department is required.';
      valid = false;
    }

    if (!d.designation) {
      this.errors.designation = 'Designation is required.';
      valid = false;
    }

    if (!d.state) {
      this.errors.state = 'State is required.';
      valid = false;
    }

    if (!d.city) {
      this.errors.city = 'City is required.';
      valid = false;
    }

    const pincode = String(d.pincode ?? '').trim();
    if (!pincode) {
      this.errors.pincode = 'Pincode is required.';
      valid = false;
    } else if (!/^\d{6}$/.test(pincode)) {
      this.errors.pincode = 'Pincode must be exactly 6 digits.';
      valid = false;
    }

    // Login-only fields — Email, Password and Category are now OPTIONAL.
    // We only validate format/strength when the user actually typed
    // something in; a blank value no longer blocks Save/Update.
    if (d.createLogin) {
      const email = String(d.emailId ?? '').trim();
      if (email && !this.emailPattern.test(email)) {
        this.errors.emailId = 'Enter a valid email address.';
        valid = false;
      }

      const pwd = String(d.password ?? '');
      if (pwd && !this.strongPasswordPattern.test(pwd)) {
        this.errors.password =
          'Password must be at least 6 characters and include uppercase, lowercase, a digit, and a special character.';
        valid = false;
      }

      // Role is only required if a category was actually checked —
      // no category means there's nothing to attach a role to.
      if (this.selectedDepartments.length > 0 && this.selectedRoles.length === 0) {
        this.errors.role = 'Select at least one role.';
        valid = false;
      }
    }

    return valid;
  }

  // true only when all required fields are filled and valid
  get isFormValid(): boolean {
    const d = this.employeeData;

    // core required fields
    const coreFilled =
      !!d.firstName?.trim() &&
      !!d.lastName?.trim() &&
      !!d.gender &&
      /^\d{10}$/.test(String(d.mobile ?? '')) &&
      !!d.dateOfJoin &&
      this.selectedLocations.length > 0 && 
      !!d.department &&
      !!d.designation &&
      !!d.state &&
      !!d.city &&
      /^\d{6}$/.test(String(d.pincode ?? ''));

    if (!coreFilled) return false;

    // If creating a login: Email/Password/Category are optional. Only
    // validate format when something was actually entered, and only
    // require a role when a category was actually picked.
    if (d.createLogin) {
      const email = String(d.emailId ?? '').trim();
      const pwd = String(d.password ?? '');

      const emailOk = !email || this.emailPattern.test(email);
      const strongPwd = !pwd || this.strongPasswordPattern.test(pwd);
      const roleOk = this.selectedDepartments.length === 0 || this.selectedRoles.length > 0;

      if (!emailOk || !strongPwd || !roleOk) return false;
    }

    return true;
  }

  // =====================================
  // SAVE / UPDATE
  // =====================================
  onSubmit(form: any): void {

    // validate before building the payload — populates this.errors so the
    // template can show which field(s) are the problem
    if (!this.validateForm()) {
      return;
    }

    // build category→role pairs from what's actually checked under each category
    const roleMappings: { category: string; roleName: string }[] = [];
    this.selectedDepartments.forEach(dept => {
      (this.rolesByDepartment[dept] ?? []).forEach(r => {
        if (this.selectedRoles.includes(r.name)) {
          roleMappings.push({ category: dept, roleName: r.name });
        }
      });
    });

    const employeeObj = {
      id: this.employeeData.id || 0,
      employeeCode: this.employeeData.employeeCode,
      firstName: this.employeeData.firstName,
      lastName: this.employeeData.lastName,
      gender: this.employeeData.gender,
      mobile: this.employeeData.mobile,

      // only send login credentials when "Create Login Account" is checked
      emailId: this.employeeData.createLogin ? this.employeeData.emailId : null,
      password: this.employeeData.createLogin ? this.employeeData.password : null,

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
      locationCode: this.selectedLocations.join(','),              

      createdBy: 'admin',
      createdDate: new Date(),
      updatedBy: 'admin',
      updatedDate: new Date(),

      // login toggle
      createLogin: this.employeeData.createLogin ?? false,

      // flat lists (still used to drive checkbox ticking on edit)
      selectedDepartments: this.employeeData.createLogin ? this.selectedDepartments : [],
      roles: this.employeeData.createLogin ? this.selectedRoles : [],

      // exact category→role pairs (only the checked combinations)
      roleMappings: this.employeeData.createLogin ? roleMappings : []
    };

    if (this.isEditMode) {
      this.employeeService.updateEmployee(employeeObj).subscribe({
        next: () => {
          alert('Employee Updated Successfully');
          this.afterSave();
        },
        error: (err) => {
          console.error('Update error', err);
          alert('Failed to update employee');
        }
      });
    } else {
      this.employeeService.saveEmployee(employeeObj).subscribe({
        next: () => {
          alert('Employee Saved Successfully');
          this.afterSave();
        },
        error: (err) => {
          console.error('Save error', err);
          alert('Failed to save employee');
        }
      });
    }
  }

  // navigate to the list (or close the modal if used as a popup)
  private afterSave(): void {
    if (this.isPopupMode) {
      this.closed.emit();
    } else {
      this.router.navigate(['/employee']);
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
  // LOAD DEPARTMENTS (for the Department dropdown)
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
  // SALES/SERVICE → SUPERVISOR LOCK
  // =====================================

  get selectedDepartmentName(): string {
    const dept = this.departments.find(
      (d: any) => String(d.departmentId) === String(this.employeeData.department)
    );
    return (dept?.departmentName ?? '').trim().toLowerCase();
  }

  get isSupervisorDisabled(): boolean {
    return this.selectedDepartmentName === 'sales';
  }

  onDepartmentFieldChange(): void {
    if (this.isSupervisorDisabled) {
      this.employeeData.supervisor = '';
    }
  }

  // =====================================
  // BACK
  // =====================================
 backToList(): void {
  if (this.isPopupMode) {
    this.closed.emit();                  // edit modal: close it (list handles refresh)
  } else {
    this.router.navigate(['/employee']); // add page: navigate to list
  }
}

  // =====================================
  // AUTO EMPLOYEE CODE
  // =====================================
  generateEmployeeCode(dealerCode: string): void {
    const baseCode = dealerCode;   // pure dealer code, e.g. "CUS0435"

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

  // =====================================
  // DATE FORMATTER
  // =====================================

isLocationSelected(code: string): boolean {
    return this.selectedLocations.includes(code);
  }

  onLocationToggle(code: string, event: any): void {
    if (event.target.checked) {
      if (!this.selectedLocations.includes(code)) this.selectedLocations.push(code);
    } else {
      this.selectedLocations = this.selectedLocations.filter(c => c !== code);
    }
  }

  // SELECT ALL — true only when every location is checked
  get allLocationsSelected(): boolean {
    return this.dealerLocations.length > 0
      && this.selectedLocations.length === this.dealerLocations.length;
  }

  // tri-state: some but not all checked (for the indeterminate dash)
  get someLocationsSelected(): boolean {
    return this.selectedLocations.length > 0 && !this.allLocationsSelected;
  }

  toggleAllLocations(event: any): void {
    if (event.target.checked) {
      // select every location
      this.selectedLocations = this.dealerLocations.map(l => l.locCode);
    } else {
      // clear all
      this.selectedLocations = [];
    }
  }
}