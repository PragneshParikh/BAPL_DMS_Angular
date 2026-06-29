import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { Gender } from '../../constant';
import { BgemployeeMasterService }       from '../../core/services/bgemployee-master.service';
import { DealerService }                 from '../../core/services/dealer-service';
import { LocationMasterService }         from '../../core/services/location-master-service';
import { DepartmentService }             from '../../core/services/department';
import { StateService }                  from '../../core/services/state';
import { EmployeeProfileMasterService }  from '../../core/services/employee-profile-master-service';

@Component({
  selector: 'app-bgemployee-master',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bgemployee-master.html',
  styleUrls: ['./bgemployee-master.scss'],
})
export class BgemployeeMaster implements OnInit {

  // =====================================================
  // POPUP INPUTS / OUTPUTS
  // =====================================================

  @Input()  popupData:   any;
  @Input()  isPopupMode: boolean = false;
  @Output() closed = new EventEmitter<void>();

  // =====================================================
  // CORE DATA
  // =====================================================

  genders       = Gender;
  employeeData: any     = {};
  isEditMode:   boolean = false;
  showPassword: boolean = false;

  // ---- States / Cities --------------------------------
  states:         any[] = [];
  cities:         any[] = [];
  filteredCities: any[] = [];

  // ---- Departments ------------------------------------
  departments: any[] = [];

  // ---- Dealer -----------------------------------------
  dealerInfo:        any      = null;
  dealerLocations:   any[]    = [];
  selectedLocations: string[] = [];

  // ---- Profile image ----------------------------------
  selectedFile:  File | null                 = null;
  imagePreview:  string | ArrayBuffer | null = null;

  // =====================================================
  // EMPLOYEE PROFILE MAPPING
  // =====================================================

  allProfiles:      any[]  = [];   // from EmployeeProfileMaster API
  pendingProfileId: number = 0;    // selected profile

  // =====================================================
  // VALIDATION
  // =====================================================

  errors: { mobile?: string; pincode?: string; password?: string } = {};

  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private bgEmployeeService:            BgemployeeMasterService,
    private router:                       Router,
    private route:                        ActivatedRoute,
    private dealerService:                DealerService,
    private locationService:              LocationMasterService,
    private departmentService:            DepartmentService,
    private stateService:                 StateService,
    private employeeProfileMasterService: EmployeeProfileMasterService,
  ) {}

  // =====================================================
  // LIFECYCLE
  // =====================================================

  ngOnInit(): void {
  this.loadStates();
  this.loadCities();
  this.loadDepartments();
  this.loadAllProfiles();

  // ── POPUP EDIT ────────────────────────────────────────
  if (this.popupData) {
    // DEBUG: log raw data to confirm profileId field name
    console.log('[BgEmployee] popupData raw:', this.popupData);
    console.log('[BgEmployee] profileId value:',
      this.popupData.profileId ?? this.popupData.ProfileId ?? 'NOT FOUND');
    this.initEditMode(this.popupData);
    return;
  }

  // ── ROUTE EDIT  /bgemployee-master/edit/:id ───────────
  const routeId = this.route.snapshot.paramMap.get('id');
  if (routeId) {
    this.bgEmployeeService.getEmployeeById(+routeId).subscribe({
      next: (data: any) => {
        // DEBUG: log raw API response
        console.log('[BgEmployee] getById raw:', data);
        console.log('[BgEmployee] profileId value:',
          data.profileId ?? data.ProfileId ?? 'NOT FOUND');
        this.initEditMode(data);
      },
      error: (err) => {
        console.error('Load employee error', err);
        this.router.navigate(['/bgemployee-master']);
      },
    });
    return;
  }

  // ── ROUTE ADD  /bgemployee-master/add ─────────────────
  this.initAddMode();
}

  // =====================================================
  // INIT — EDIT
  // =====================================================

private initEditMode(data: any): void {
  this.isEditMode   = true;
  this.employeeData = { ...data };

  this.employeeData.state      = data.state      != null ? String(data.state)      : '';
  this.employeeData.city       = data.city        != null ? String(data.city)       : '';
  this.employeeData.department = data.department  != null ? String(data.department) : '';

  this.employeeData.dateOfJoin    = this.formatDate(data.dateOfJoin);
  this.employeeData.dateOfBirth   = this.formatDate(data.dateOfBirth);
  this.employeeData.effectiveDate = this.formatDate(data.effectiveDate);

  this.imagePreview = data.profileImage ?? null;

  // ── KEY FIX: handle both camelCase and PascalCase from API ──
  const rawProfileId = data.profileId ?? data.ProfileId ?? data.profile_id ?? 0;
  const savedProfileId = rawProfileId ? Number(rawProfileId) : 0;

  // Set immediately
  this.pendingProfileId = savedProfileId;

  // Re-apply after profiles finish loading (handles async race)
  setTimeout(() => {
    this.pendingProfileId = savedProfileId;
  }, 500);

  // restore locations
  this.selectedLocations = data.locationCode
    ? String(data.locationCode).split(',').map((c: string) => c.trim()).filter(Boolean)
    : [];

  if (data.dealerCode) {
    this.loadDealerLocations(data.dealerCode);
  }

  setTimeout(() => {
    this.onStateChange();
    this.employeeData.city = data.city != null ? String(data.city) : '';
  }, 300);
}

  // =====================================================
  // INIT — ADD
  // =====================================================

  private initAddMode(): void {
    this.employeeData.isActive     = true;
    this.employeeData.employeeCode = 'Generating…';  // shown instantly
    this.generateEmployeeCode('');                    // prefix is fixed BGTag, no dealerCode needed
    this.loadLoggedInDealer();
  }

  // =====================================================
  // DEALER
  // =====================================================

  loadLoggedInDealer(): void {
    const dealerCode = localStorage.getItem('dealerCode');
    if (!dealerCode) return;

    this.employeeData.dealerCode = dealerCode;

    this.dealerService.getByDealerCode(dealerCode).subscribe({
      next: (res: any) => {
        this.dealerInfo              = res;
        this.employeeData.dealerCode = res.dealerCode ?? dealerCode;
        this.loadDealerLocations(res.dealerCode ?? dealerCode);
      },
      error: () => this.loadDealerLocations(dealerCode),
    });
  }

  loadDealerLocations(dealerCode: string): void {
    this.locationService.getAllLocationByDealerCode(dealerCode).subscribe({
      next: (res: any[]) => {
        this.dealerLocations = (res ?? []).map(l => ({
          locCode: String(l.locCode ?? l.loccode ?? l.Loccode ?? '').trim(),
          locName: l.locName ?? l.locname ?? l.Locname ?? '',
        }));
      },
      error: (err) => console.error('Dealer location load error', err),
    });
  }

  // =====================================================
  // STATES & CITIES
  // =====================================================

  loadStates(): void {
    this.stateService.get().subscribe({
      next: (res: any[]) => { this.states = res ?? []; },
      error: (err) => console.error('State load error', err),
    });
  }

  loadCities(): void {
    this.bgEmployeeService.getCities().subscribe({
      next: (res: any[]) => { this.cities = res ?? []; },
      error: (err) => console.error('City load error', err),
    });
  }

  onStateChange(): void {
    const stateId = Number(this.employeeData.state);
    this.filteredCities = this.cities.filter((c: any) => c.stateId === stateId);
    this.employeeData.city = '';
  }

  // =====================================================
  // DEPARTMENTS
  // =====================================================

  loadDepartments(): void {
    this.departmentService.get().subscribe({
      next: (res: any[]) => { this.departments = res ?? []; },
      error: (err) => console.error('Department load error', err),
    });
  }

  // =====================================================
  // EMPLOYEE PROFILE MASTER — dropdown
  // =====================================================

  // Fallback profiles matching the 5 seeded DB rows (SortOrder order)
  private readonly defaultProfiles = [
    { id: 5, profileName: 'City Head',     sortOrder: 1 },
    { id: 4, profileName: 'District Head', sortOrder: 2 },
    { id: 2, profileName: 'Zone Head',     sortOrder: 3 },
    { id: 3, profileName: 'State Head',    sortOrder: 4 },
    { id: 1, profileName: 'National Head', sortOrder: 5 },
  ];

loadAllProfiles(): void {
  this.allProfiles = [...this.defaultProfiles];

  this.employeeProfileMasterService.getAll().subscribe({
    next: (res: any[]) => {
      if (!res?.length) {
        console.warn('EmployeeProfileMaster API returned empty — using fallback profiles.');
        return;
      }

      const normalised = res
        .map(p => ({
          id:          p.id          ?? p.Id          ?? 0,
          profileName: p.profileName ?? p.ProfileName ?? p.profile_name ?? '',
          sortOrder:   p.sortOrder   ?? p.SortOrder   ?? p.sort_order   ?? 0,
        }))
        .filter(p => p.id > 0 && !!p.profileName)
        .sort((a, b) => a.sortOrder - b.sortOrder);

      if (normalised.length) {
        this.allProfiles = normalised;
      }

      // ── KEY FIX: re-apply after profiles replace fallback ──
      // Angular re-renders <option> list; force re-select the saved value
      const saved = this.pendingProfileId;
      if (saved > 0) {
        setTimeout(() => { this.pendingProfileId = saved; }, 0);
      }
    },
    error: (err) => {
      console.warn('EmployeeProfileMaster API error — using fallback:', err?.status);
    },
  });
}
  // =====================================================
  // DIGIT-ONLY INPUT HELPER
  // =====================================================

  onlyDigits(event: any, field: 'mobile' | 'pincode', maxLen: number): void {
    let value = String(event.target.value || '').replace(/\D/g, '');
    if (value.length > maxLen) value = value.slice(0, maxLen);
    this.employeeData[field] = value;
    event.target.value       = value;
  }

  // =====================================================
  // VALIDATION
  // =====================================================

  private validateForm(): boolean {
    this.errors = {};
    let valid   = true;

    const mobile = String(this.employeeData.mobile ?? '').trim();
    if (!mobile) {
      this.errors.mobile = 'Mobile number is required.';
      valid = false;
    } else if (!/^\d{10}$/.test(mobile)) {
      this.errors.mobile = 'Mobile number must be exactly 10 digits.';
      valid = false;
    }

    const pincode = String(this.employeeData.pincode ?? '').trim();
    if (!pincode) {
      this.errors.pincode = 'Pincode is required.';
      valid = false;
    } else if (!/^\d{6}$/.test(pincode)) {
      this.errors.pincode = 'Pincode must be exactly 6 digits.';
      valid = false;
    }

    // password only required on Add; optional on Edit
    if (!this.isEditMode) {
      const pwd    = String(this.employeeData.password ?? '');
      const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;
      if (!strong.test(pwd)) {
        this.errors.password =
          'Password must be at least 6 chars with uppercase, lowercase, digit & special character.';
        valid = false;
      }
    }

    if (!valid) {
      const messages = [this.errors.mobile, this.errors.pincode, this.errors.password].filter(Boolean);
      alert(messages.join('\n'));
    }

    return valid;
  }

  get isFormValid(): boolean {
    const d = this.employeeData;
    return (
      !!d.firstName?.trim()                     &&
      !!d.lastName?.trim()                      &&
      !!d.gender                                &&
      /^\d{10}$/.test(String(d.mobile ?? ''))  &&
      !!d.state                                 &&
      !!d.city                                  &&
      /^\d{6}$/.test(String(d.pincode ?? ''))  &&
      !!d.dateOfJoin                            &&
      !!d.dateOfBirth                           &&
      !!d.effectiveDate                         &&
      !!d.department                            &&
      !!d.emailId?.trim()                       &&
      (this.isEditMode
        ? true
        : /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/.test(String(d.password ?? '')))
    );
  }

  // =====================================================
  // SUBMIT
  // =====================================================

  onSubmit(form: any): void {
  if (!this.validateForm()) return;

  const payload = {
    id:            this.employeeData.id || 0,
    employeeCode:  this.employeeData.employeeCode,
    firstName:     this.employeeData.firstName,
    lastName:      this.employeeData.lastName,
    gender:        this.employeeData.gender,
    mobile:        this.employeeData.mobile,
    emailId:       this.employeeData.emailId,
    password:      this.employeeData.password || null,
    state:         Number(this.employeeData.state),
    city:          Number(this.employeeData.city),
    pincode:       this.employeeData.pincode,
    dateOfJoin:    this.employeeData.dateOfJoin,
    dateOfBirth:   this.employeeData.dateOfBirth,
    effectiveDate: this.employeeData.effectiveDate,
    reportingTo:   this.employeeData.reportingTo,
    isActive:      this.employeeData.isActive ?? true,
    department:    this.employeeData.department,

    // ── send null when nothing selected, not 0 ──
    profileId:     this.pendingProfileId > 0 ? this.pendingProfileId : null,

    profileImage:  this.imagePreview as string,
    locationCode:  this.selectedLocations.join(','),
    dealerCode:    this.employeeData.dealerCode,
    createdBy:     'admin',
    createdDate:   new Date(),
    updatedBy:     'admin',
    updatedDate:   new Date(),
  };

  console.log('[BgEmployee] submit payload:', payload); // DEBUG

  const save$ = this.isEditMode
    ? this.bgEmployeeService.updateEmployee(payload)
    : this.bgEmployeeService.saveEmployee(payload);

  save$.subscribe({
    next: () => {
      alert(this.isEditMode ? 'Employee Updated Successfully' : 'Employee Saved Successfully');
      this.afterSave();
    },
    error: (err) => {
      console.error('Save error', err);
      alert(this.isEditMode ? 'Failed to update employee.' : 'Failed to save employee.');
    },
  });
}

  private afterSave(): void {
    if (this.isPopupMode) {
      this.closed.emit();
    } else {
      this.router.navigate(['/bgemployee-master']);
    }
  }

  // =====================================================
  // FILE SELECT
  // =====================================================

  onFileSelect(event: any): void {
    this.selectedFile = event.target.files[0];
    if (this.selectedFile) {
      const reader  = new FileReader();
      reader.onload = (e) => { this.imagePreview = e.target?.result!; };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  // =====================================================
  // AUTO-GENERATE EMPLOYEE CODE
  // =====================================================

  generateEmployeeCode(dealerCode: string): void {
    const prefix = 'BGTag';   // fixed prefix for all BG employees

    this.bgEmployeeService.getEmployees().subscribe({
      next: (employees: any[]) => {
        let maxSeq = 0;
        (employees ?? []).forEach(e => {
          const code: string = e?.employeeCode ?? '';
          if (code.startsWith(prefix)) {
            const num = parseInt(code.substring(prefix.length), 10);
            if (!isNaN(num) && num > maxSeq) maxSeq = num;
          }
        });
        this.employeeData.employeeCode =
          prefix + (maxSeq + 1).toString().padStart(4, '0');
      },
      error: () => {
        // API error — default to BGTag0001 so form is not blocked
        this.employeeData.employeeCode = prefix + '0001';
      },
    });
  }

  // =====================================================
  // DATE FORMATTER
  // =====================================================

  formatDate(value: any): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // =====================================================
  // BACK / CANCEL
  // =====================================================

  backToList(): void {
    if (this.isPopupMode) {
      this.closed.emit();
    } else {
      this.router.navigate(['/bgemployee-master']);
    }
  }
}