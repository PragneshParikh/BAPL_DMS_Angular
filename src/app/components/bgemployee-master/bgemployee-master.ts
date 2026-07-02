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
import { ZoneMasterService }              from '../../core/services/zone-master.service';
import { RoleService }                    from '../../core/services/Deptrole';
import { ZoneViewModel, ZoneDealerViewModel } from '../../ViewModels/models/ZoneViewModel';

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

  states:         any[] = [];
  cities:         any[] = [];
  filteredCities: any[] = [];

  departments: any[] = [];

  dealerInfo:        any      = null;
  dealerLocations:   any[]    = [];
  selectedLocations: string[] = [];

  selectedFile:  File | null                 = null;
  imagePreview:  string | ArrayBuffer | null = null;

  // =====================================================
  // EMPLOYEE PROFILE MAPPING
  // =====================================================

  allProfiles:      any[]  = [];
  pendingProfileId: number = 0;

  // =====================================================
  // ZONE → DEALER CHECKBOX MAPPING
  // =====================================================

  zones:             ZoneViewModel[]       = [];
  selectedZone:      string             = '';
  zoneDealers:       ZoneDealerViewModel[] = [];
  selectedDealerIds: Set<number>       = new Set<number>();
  dealerSearchTerm:  string             = '';
  loadingDealers:    boolean            = false;

  // =====================================================
  // DEPARTMENT -> ROLES (cascading login access)
  // =====================================================

  departmentOptions:   { id: string; name: string }[] = [];
  selectedDepartments: string[] = [];
  allRoles:            { name: string }[] = [];
  rolesByDepartment:   { [dept: string]: { name: string }[] } = {};
  selectedRoles:       string[] = [];

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
    private zoneMasterService:            ZoneMasterService,
    private roleService:                  RoleService,
  ) {}

  // =====================================================
  // LIFECYCLE
  // =====================================================

  ngOnInit(): void {
    this.loadStates();
    this.loadCities();
    this.loadDepartments();
    this.loadAllProfiles();
    this.loadZones();
    this.loadDepartmentOptions();
    this.loadAllRoles();

    // ── POPUP EDIT ────────────────────────────────────────
    if (this.popupData) {
      this.initEditMode(this.popupData);
      return;
    }

    // ── ROUTE EDIT  /bgemployee-master/edit/:id ───────────
    const routeId = this.route.snapshot.paramMap.get('id');
    if (routeId) {
      this.bgEmployeeService.getEmployeeById(+routeId).subscribe({
        next: (data: any) => this.initEditMode(data),
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

    const rawProfileId = data.profileId ?? data.ProfileId ?? data.profile_id ?? 0;
    const savedProfileId = rawProfileId ? Number(rawProfileId) : 0;
    this.pendingProfileId = savedProfileId;
    setTimeout(() => { this.pendingProfileId = savedProfileId; }, 500);

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

    // ── RESTORE ZONE + DEALER CHECKBOX SELECTION ──────────
    this.selectedZone = data.mappedZones ?? '';

    if (this.selectedZone) {
      this.loadingDealers = true;
      this.zoneMasterService.getDealersByZone(this.selectedZone).subscribe({
        next: (res: ZoneDealerViewModel[]) => {
          this.zoneDealers     = res ?? [];
          this.loadingDealers = false;

          const savedIds = String(data.mappedZoneIds ?? '')
            .split(',')
            .map((id: string) => Number(id.trim()))
            .filter((id: number) => !isNaN(id));

          this.selectedDealerIds = new Set<number>(savedIds);
        },
        error: (err) => {
          console.error('Zone dealers load error (edit mode)', err);
          this.loadingDealers = false;
        },
      });
    }

    // ── RESTORE LOGIN ACCESS + DEPARTMENT/ROLE SELECTION ──
    this.employeeData.createLogin = !!data.emailId;
    this.selectedDepartments = data.selectedDepartments?.length ? [...data.selectedDepartments] : [];
    this.selectedRoles       = data.roles?.length             ? [...data.roles]             : [];

    this.selectedDepartments.forEach(dept => {
      this.roleService.getByCategory(dept).subscribe({
        next: (res: any[]) => {
          this.rolesByDepartment[dept] = (res ?? []).map(r => ({ name: r.name ?? r.Name }));
        },
        error: () => { this.rolesByDepartment[dept] = []; }
      });
    });
  }

  // =====================================================
  // INIT — ADD
  // =====================================================

  private initAddMode(): void {
    this.employeeData.isActive     = true;
    this.employeeData.employeeCode = 'Generating…';
    this.employeeData.createLogin  = false;
    this.generateEmployeeCode('');
    this.loadLoggedInDealer();
  }

  // =====================================================
  // DEALER (legacy single-dealer support, kept intact)
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
  // DEPARTMENTS (employee's own department dropdown)
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
        if (!res?.length) return;

        const normalised = res
          .map(p => ({
            id:          p.id          ?? p.Id          ?? 0,
            profileName: p.profileName ?? p.ProfileName ?? p.profile_name ?? '',
            sortOrder:   p.sortOrder   ?? p.SortOrder   ?? p.sort_order   ?? 0,
          }))
          .filter(p => p.id > 0 && !!p.profileName)
          .sort((a, b) => a.sortOrder - b.sortOrder);

        if (normalised.length) { this.allProfiles = normalised; }

        const saved = this.pendingProfileId;
        if (saved > 0) { setTimeout(() => { this.pendingProfileId = saved; }, 0); }
      },
      error: (err) => console.warn('EmployeeProfileMaster API error — using fallback:', err?.status),
    });
  }

  // =====================================================
  // ZONE → DEALER CHECKBOX MAPPING
  // =====================================================

  loadZones(): void {
    this.zoneMasterService.getZones().subscribe({
      next: (res: ZoneViewModel[]) => {
        this.zones = [...new Map((res ?? []).map(z => [z.zone, z])).values()];
      },
      error: (err) => console.error('Zone load error', err),
    });
  }

  onZoneChange(): void {
    this.zoneDealers       = [];
    this.selectedDealerIds = new Set<number>();
    this.dealerSearchTerm  = '';
    this.employeeData.mappedZones   = this.selectedZone;
    this.employeeData.mappedZoneIds = '';

    if (!this.selectedZone) return;

    this.loadingDealers = true;
    this.zoneMasterService.getDealersByZone(this.selectedZone).subscribe({
      next: (res: ZoneDealerViewModel[]) => {
        this.zoneDealers     = res ?? [];
        this.loadingDealers = false;
      },
      error: (err) => {
        console.error('Zone dealers load error', err);
        this.loadingDealers = false;
      },
    });
  }

  get filteredZoneDealers(): ZoneDealerViewModel[] {
    const term = this.dealerSearchTerm.trim().toLowerCase();
    if (!term) return this.zoneDealers;
    return this.zoneDealers.filter(d =>
      d.dealerName?.toLowerCase().includes(term) ||
      d.dealerCode?.toLowerCase().includes(term) ||
      d.cityName?.toLowerCase().includes(term)
    );
  }

  isDealerSelected(dealerId: number): boolean {
    return this.selectedDealerIds.has(dealerId);
  }

  toggleDealer(dealerId: number): void {
    if (this.selectedDealerIds.has(dealerId)) {
      this.selectedDealerIds.delete(dealerId);
    } else {
      this.selectedDealerIds.add(dealerId);
    }
    this.syncMappedFieldsFromSelection();
  }

  toggleSelectAll(event: any): void {
    const checked = event.target.checked;
    if (checked) {
      this.filteredZoneDealers.forEach(d => this.selectedDealerIds.add(d.dealerId));
    } else {
      this.filteredZoneDealers.forEach(d => this.selectedDealerIds.delete(d.dealerId));
    }
    this.syncMappedFieldsFromSelection();
  }

  get allFilteredSelected(): boolean {
    return this.filteredZoneDealers.length > 0 &&
      this.filteredZoneDealers.every(d => this.selectedDealerIds.has(d.dealerId));
  }

  private syncMappedFieldsFromSelection(): void {
    const selected = this.zoneDealers.filter(d => this.selectedDealerIds.has(d.dealerId));

    this.employeeData.mappedZones    = this.selectedZone;
    this.employeeData.mappedZoneIds = selected.map(d => d.dealerId).join(',');
    this.employeeData.dealerCode    = selected.map(d => d.dealerCode).join(',');

    this.selectedLocations = selected.map(d => d.dealerCode);
  }

  // =====================================================
  // DEPARTMENT -> ROLES (cascading)
  // =====================================================

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

  loadAllRoles(): void {
    this.roleService.getRoles().subscribe({
      next: (res: any[]) => {
        this.allRoles = (res ?? []).map(r => ({ name: r.name ?? r.Name }));
      },
      error: (e) => console.error('Role load error', e)
    });
  }

  isDepartmentSelected(dept: string): boolean {
    return this.selectedDepartments.includes(dept);
  }

  onDepartmentToggle(dept: string, event: any): void {
    if (event.target.checked) {
      if (!this.selectedDepartments.includes(dept)) this.selectedDepartments.push(dept);

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

    if (this.employeeData.createLogin && !this.isEditMode) {
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

  const checks = {
    firstName:     !!d.firstName?.trim(),
    lastName:      !!d.lastName?.trim(),
    gender:        !!d.gender,
    mobile:        /^\d{10}$/.test(String(d.mobile ?? '')),
    state:         !!d.state,
    city:          !!d.city,
    pincode:       /^\d{6}$/.test(String(d.pincode ?? '')),
    dateOfJoin:    !!d.dateOfJoin,
    dateOfBirth:   !!d.dateOfBirth,
    effectiveDate: !!d.effectiveDate,
    department:    !!d.department,
    zone:          !!this.selectedZone,
    dealers:       this.selectedDealerIds.size > 0,
  };

  console.log('[isFormValid] core checks:', checks);

  const coreFilled = Object.values(checks).every(v => v === true);

  if (!coreFilled) {
    console.log('[isFormValid] FAILED on core checks above ☝️');
    return false;
  }

  if (d.createLogin) {
    const strongPwd = this.isEditMode
      ? true
      : /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/.test(String(d.password ?? ''));

    const loginChecks = {
      emailOk:    !!d.emailId?.trim(),
      strongPwd:  strongPwd,
      categoryOk: this.selectedDepartments.length > 0,
      roleOk:     this.selectedRoles.length > 0,
    };

    console.log('[isFormValid] login checks (createLogin=true):', loginChecks);

    if (!loginChecks.emailOk || !loginChecks.strongPwd || !loginChecks.categoryOk || !loginChecks.roleOk) {
      console.log('[isFormValid] FAILED on login checks above ☝️');
      return false;
    }
  }

  console.log('[isFormValid] ALL PASSED — button should be enabled');
  return true;
}

  // =====================================================
  // SUBMIT
  // =====================================================

  onSubmit(form: any): void {
    if (!this.validateForm()) return;

    const roleMappings: { category: string; roleName: string }[] = [];
    this.selectedDepartments.forEach(dept => {
      (this.rolesByDepartment[dept] ?? []).forEach(r => {
        if (this.selectedRoles.includes(r.name)) {
          roleMappings.push({ category: dept, roleName: r.name });
        }
      });
    });

    const payload = {
      id:            this.employeeData.id || 0,
      employeeCode:  this.employeeData.employeeCode,
      firstName:     this.employeeData.firstName,
      lastName:      this.employeeData.lastName,
      gender:        this.employeeData.gender,
      mobile:        this.employeeData.mobile,

      emailId:       this.employeeData.createLogin ? this.employeeData.emailId : null,
      password:      this.employeeData.createLogin ? (this.employeeData.password || null) : null,

      state:         Number(this.employeeData.state),
      city:          Number(this.employeeData.city),
      pincode:       this.employeeData.pincode,
      dateOfJoin:    this.employeeData.dateOfJoin,
      dateOfBirth:   this.employeeData.dateOfBirth,
      effectiveDate: this.employeeData.effectiveDate,
      reportingTo:   this.employeeData.reportingTo,
      isActive:      this.employeeData.isActive ?? true,
      department:    this.employeeData.department,

      profileId:     this.pendingProfileId > 0 ? this.pendingProfileId : null,
      profileImage:  this.imagePreview as string,

      mappedZones:   this.employeeData.mappedZones   || '',
      mappedZoneIds: this.employeeData.mappedZoneIds || '',

      locationCode:  this.selectedLocations.join(','),
      dealerCode:    this.employeeData.dealerCode,

      // login toggle + department/role cascade
      createLogin:         this.employeeData.createLogin ?? false,
      selectedDepartments: this.employeeData.createLogin ? this.selectedDepartments : [],
      roles:               this.employeeData.createLogin ? this.selectedRoles       : [],
      roleMappings:        this.employeeData.createLogin ? roleMappings              : [],

      createdBy:     'admin',
      createdDate:   new Date(),
      updatedBy:     'admin',
      updatedDate:   new Date(),
    };

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
    const prefix = 'BGTag';

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