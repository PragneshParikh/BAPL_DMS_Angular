// src\app\components\bgemployee-master\bgemployee-master.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';
import { Gender } from '../../constant';
import { BgemployeeMasterService }       from '../../core/services/bgemployee-master.service';
import { DealerService }                 from '../../core/services/dealer-service';
import { LocationMasterService }         from '../../core/services/location-master-service';
import { DepartmentService }             from '../../core/services/department';
import { StateService }                  from '../../core/services/state';
import { EmployeeProfileMasterService }  from '../../core/services/employee-profile-master-service';
import { ZoneMasterService }             from '../../core/services/zone-master.service';
import { RoleService }                   from '../../core/services/Deptrole';
import { ZoneViewModel, ZoneDealerViewModel } from '../../ViewModels/models/ZoneViewModel';
import { MenuAccessService } from '../../core/services/menu-access.service';
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

  readonly SUBMENU_ID = 76;
  canCreate = false;
  canEdit = false;

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
  departments:    any[] = [];

  dealerInfo:        any      = null;
  dealerLocations:   any[]    = [];
  selectedLocations: string[] = [];

  selectedFile:  File | null                 = null;
  imagePreview:  string | ArrayBuffer | null = null;

  // =====================================================
  // TSM ERP LOOKUP
  // =====================================================

  tsmCode:         string  = '';
  tsmFetchLoading: boolean = false;
  tsmFetchError:   string  = '';
  tsmFetchSuccess: boolean = false;

  // =====================================================
  // EMPLOYEE PROFILE MAPPING
  // =====================================================

  allProfiles:      any[]  = [];
  pendingProfileId: number = 0;

  // =====================================================
  // ZONE → DEALER — MULTI-ZONE STATE
  // =====================================================

  zones:            ZoneViewModel[]       = [];
  selectedZone:     string               = '';
  zoneDealers:      ZoneDealerViewModel[] = [];
  loadingDealers:   boolean              = false;
  dealerSearchTerm: string               = '';

  zoneSelectionMap: Map<string, Set<number>> = new Map();
  addedDealers: any[] = [];

  // =====================================================
  // ASSIGNED-ELSEWHERE TRACKING
  // =====================================================

  assignedDealersMap: Map<string, { employeeCode: string; employeeName: string }> = new Map();
  private originalAssignedDealersMap: Map<string, { employeeCode: string; employeeName: string }> = new Map();
  removedDueToReassignment: { dealerName: string; assignedTo: string }[] = [];

  // =====================================================
  // DEPARTMENT -> ROLES
  // =====================================================

  departmentOptions:   { id: string; name: string }[] = [];
  selectedDepartments: string[] = [];
  allRoles:            { name: string }[] = [];
  rolesByDepartment:   { [dept: string]: { name: string }[] } = {};
  selectedRoles:       string[] = [];
  reportingToOptions: any[] = [];

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
    private http:                         HttpClient,
    private menuAccess:                   MenuAccessService
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
    this.loadReportingToOptions();
    this.canCreate = this.menuAccess.canCreate(this.SUBMENU_ID);
    this.canEdit = this.menuAccess.canEdit(this.SUBMENU_ID);

    if (this.popupData) {
      this.initEditMode(this.popupData);
      return;
    }

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

    this.initAddMode();
  }

  // =====================================================
  // TSM ERP LOOKUP
  // =====================================================

  fetchTsmDetails(): void {
    const code = (this.tsmCode || '').trim();
    if (!code) {
      this.tsmFetchError = 'Enter a TSM Code first.';
      return;
    }

    this.tsmFetchLoading = true;
    this.tsmFetchError   = '';
    this.tsmFetchSuccess = false;

    this.http.get<any>(`${environment.apiUrl}/BgEmployee/TsmLookup/${encodeURIComponent(code)}`).subscribe({
      next: (data) => {
        this.applyTsmData(data);
        this.tsmFetchLoading = false;
        this.tsmFetchSuccess = true;
      },
      error: (err) => {
        console.error('TSM fetch error', err);
        this.tsmFetchError   = 'TSM Code not found or the lookup service is unavailable.';
        this.tsmFetchLoading = false;
      },
    });
  }

  private applyTsmData(data: any): void {
    if (!data) return;

    const fullName = String(data.tsmname ?? '').trim();
    if (fullName) {
      const spaceIdx = fullName.indexOf(' ');
      if (spaceIdx > -1) {
        this.employeeData.firstName = fullName.slice(0, spaceIdx);
        this.employeeData.lastName  = fullName.slice(spaceIdx + 1);
      } else {
        this.employeeData.firstName = fullName;
        this.employeeData.lastName  = '';
      }
    }

    if (data.mobileno) this.employeeData.mobile = String(data.mobileno);
    if (data.email)    this.employeeData.email  = data.email;

    // Gender: try direct match against genders list ('M'/'F' options),
    // fall back to mapped full word ('Male'/'Female' options)
    if (data.gender) {
      const code = String(data.gender).trim().toUpperCase();
      const genderMap: { [key: string]: string } = { M: 'Male', F: 'Female' };
      const directMatch = this.genders.find((g: any) =>
        String(g.value ?? g).toUpperCase() === code
      );
      this.employeeData.gender = directMatch
        ? (directMatch.value ?? directMatch)
        : (genderMap[code] ?? data.gender);
    }

    if (data.doa) this.employeeData.dateOfJoin    = this.parseDDMMYYYY(data.doa);
    if (data.dob) this.employeeData.dateOfBirth   = this.parseDDMMYYYY(data.dob);
    if (data.doe) this.employeeData.effectiveDate = this.parseDDMMYYYY(data.doe);

    if (data.state) {
      const matchedState = this.states.find(s =>
        String(s.stateName ?? '').trim().toUpperCase() === String(data.state).trim().toUpperCase()
      );
      if (matchedState) {
        this.employeeData.state = String(matchedState.stateId);
        this.onStateChange();

        if (data.city) {
          setTimeout(() => {
            const matchedCity = this.filteredCities.find(c =>
              String(c.cityName ?? '').trim().toUpperCase() === String(data.city).trim().toUpperCase()
            );
            if (matchedCity) this.employeeData.city = String(matchedCity.cityId);
          }, 0);
        }
      }
    }

    if (data.tsmheadcode) {
      const match = this.reportingToOptions.find(opt =>
        String(opt.label ?? '').includes(`(${data.tsmheadcode})`)
      );
      if (match) this.employeeData.reportingTo = match.id;
    }

    if (data.estatus) this.employeeData.isActive = data.estatus !== 'N';

    if (data.Photo) this.imagePreview = data.Photo;

    // Stored for save payload — persisted via BgEmployeeViewModel.AreaOfficeId
    if (data.areaoffidno) this.employeeData.areaOfficeId = data.areaoffidno;
  }

  private parseDDMMYYYY(value: string): string {
    const parts = String(value ?? '').split('/');
    if (parts.length !== 3) return '';
    const [dd, mm, yyyy] = parts;
    if (!dd || !mm || !yyyy) return '';
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
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
    this.loadAssignedDealers();
    this.loadReportingToOptions();
  }

  // =====================================================
  // INIT — EDIT
  // =====================================================

  private initEditMode(data: any): void {
    this.isEditMode   = true;
    this.employeeData = { ...data };
    this.removedDueToReassignment = [];

    this.employeeData.state      = data.state      != null ? String(data.state)      : '';
    this.employeeData.city       = data.city        != null ? String(data.city)       : '';
    this.employeeData.department = data.department  != null ? String(data.department) : '';

    this.employeeData.dateOfJoin    = this.formatDate(data.dateOfJoin);
    this.employeeData.dateOfBirth   = this.formatDate(data.dateOfBirth);
    this.employeeData.effectiveDate = this.formatDate(data.effectiveDate);

    this.imagePreview = data.profileImage ?? null;

    const rawProfileId   = data.profileId ?? data.ProfileId ?? data.profile_id ?? 0;
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

    this.addedDealers = [];
    this.zoneSelectionMap.clear();
    this.restoreZoneDealerSelections(data);

    this.loadAssignedDealers();
    this.loadReportingToOptions();

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
  // DEALER (legacy single-dealer support)
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

  loadReportingToOptions(): void {
    this.bgEmployeeService.getEmployees().subscribe({
      next: (res: any[]) => {
        const currentId = this.employeeData?.id || 0;
        this.reportingToOptions = (res ?? [])
          .filter(e => e.id !== currentId && e.isActive)
          .map(e => ({
            id: e.id,
            label: `${e.firstName} ${e.lastName} (${e.employeeCode})`,
          }));
      },
      error: (err) => console.error('Reporting-to load error', err),
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
  // EMPLOYEE PROFILE MASTER
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
  // ZONE → DEALER MULTI-ZONE SELECTION
  // =====================================================

  loadZones(): void {
    this.zoneMasterService.getZones().subscribe({
      next: (res: ZoneViewModel[]) => {
        this.zones = [...new Map((res ?? []).map(z => [z.zone, z])).values()];
      },
      error: (err) => console.error('Zone load error', err),
    });
  }

  get currentZoneSelection(): Set<number> {
    if (!this.selectedZone) return new Set();
    if (!this.zoneSelectionMap.has(this.selectedZone)) {
      this.zoneSelectionMap.set(this.selectedZone, new Set());
    }
    return this.zoneSelectionMap.get(this.selectedZone)!;
  }

  isDealerSelected(dealerId: number): boolean {
    return this.currentZoneSelection.has(dealerId);
  }

  toggleDealer(dealerId: number): void {
    const sel = this.currentZoneSelection;
    sel.has(dealerId) ? sel.delete(dealerId) : sel.add(dealerId);
  }

  toggleSelectAll(event: any): void {
    const sel = this.currentZoneSelection;
    if (event.target.checked) {
      this.filteredZoneDealers.forEach(d => sel.add(d.dealerId));
    } else {
      this.filteredZoneDealers.forEach(d => sel.delete(d.dealerId));
    }
  }

  get allFilteredSelected(): boolean {
    const sel = this.currentZoneSelection;
    return this.filteredZoneDealers.length > 0
        && this.filteredZoneDealers.every(d => sel.has(d.dealerId));
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

  get currentZoneCheckedCount(): number {
    return this.currentZoneSelection.size;
  }

  onZoneChange(): void {
    this.zoneDealers      = [];
    this.dealerSearchTerm = '';

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

  onAddZoneDealers(): void {
    if (!this.selectedZone) return;

    const sel = this.currentZoneSelection;
    if (sel.size === 0) return;

    const zone = this.selectedZone;

    this.addedDealers = this.addedDealers.filter(row => row.zone !== zone);

    this.zoneDealers
      .filter(d => sel.has(d.dealerId))
      .forEach(d => {
        this.addedDealers.push({
          zone,
          dealerId:   d.dealerId,
          dealerName: d.dealerName,
          dealerCode: d.dealerCode,
          cityName:   d.cityName ?? d.city,
        });

        this.assignedDealersMap.delete((d.dealerCode || '').trim());
      });

    this.syncPayloadFromAddedDealers();
  }

  removeAddedDealer(dealerId: number, zone: string): void {
    const removedRow = this.addedDealers.find(r => r.dealerId === dealerId && r.zone === zone);

    this.addedDealers = this.addedDealers
      .filter(r => !(r.dealerId === dealerId && r.zone === zone));
    this.zoneSelectionMap.get(zone)?.delete(dealerId);

    if (removedRow) {
      const code = (removedRow.dealerCode || '').trim();
      const original = this.originalAssignedDealersMap.get(code);
      if (original) {
        this.assignedDealersMap.set(code, original);
      }
    }

    this.syncPayloadFromAddedDealers();
  }

  private pruneStaleAssignments(): void {
    if (!this.addedDealers.length || this.assignedDealersMap.size === 0) return;

    const stillValid: any[] = [];

    this.addedDealers.forEach(row => {
      const code     = (row.dealerCode || '').trim();
      const conflict = this.assignedDealersMap.get(code);

      if (conflict) {
        this.zoneSelectionMap.get(row.zone)?.delete(row.dealerId);
        this.removedDueToReassignment.push({
          dealerName: row.dealerName,
          assignedTo: conflict.employeeName || conflict.employeeCode,
        });
      } else {
        stillValid.push(row);
      }
    });

    if (this.removedDueToReassignment.length) {
      this.addedDealers = stillValid;
      this.syncPayloadFromAddedDealers();
    }
  }

  private syncPayloadFromAddedDealers(): void {
    const zones = [...new Set(this.addedDealers.map(r => r.zone))];
    this.employeeData.mappedZones    = zones.join(',');
    this.employeeData.mappedZoneIds  = this.addedDealers.map(r => r.dealerId).join(',');
    this.employeeData.dealerCode     = this.addedDealers.map(r => r.dealerCode).join(',');
    this.selectedLocations           = this.addedDealers.map(r => r.dealerCode);
  }

  private restoreZoneDealerSelections(data: any): void {
    if (!data.mappedZones || !data.mappedZoneIds) return;

    const savedZones = String(data.mappedZones)
      .split(',').map((z: string) => z.trim()).filter(Boolean);
    const savedIds = String(data.mappedZoneIds)
      .split(',').map((id: string) => Number(id.trim())).filter(Boolean);

    savedZones.forEach(zone => {
      this.zoneMasterService.getDealersByZone(zone).subscribe({
        next: (res: ZoneDealerViewModel[]) => {
          const matched = (res ?? []).filter(d => savedIds.includes(d.dealerId));

          this.zoneSelectionMap.set(zone, new Set<number>(matched.map(d => d.dealerId)));

          matched.forEach(d => {
            if (!this.addedDealers.some(r => r.dealerId === d.dealerId && r.zone === zone)) {
              this.addedDealers.push({
                zone,
                dealerId:   d.dealerId,
                dealerName: d.dealerName,
                dealerCode: d.dealerCode,
                cityName:   d.cityName ?? d.city,
              });
            }
          });

          this.syncPayloadFromAddedDealers();
          this.pruneStaleAssignments();
        },
      });
    });
  }

  // =====================================================
  // ASSIGNED DEALERS
  // =====================================================

  loadAssignedDealers(): void {
    const excludeId = this.employeeData?.id || 0;

    this.bgEmployeeService.getAssignedDealers(excludeId).subscribe({
      next: (res: any[]) => {
        this.assignedDealersMap.clear();
        this.originalAssignedDealersMap.clear();

        (res ?? []).forEach(a => {
          const code = String(a.dealerCode ?? a.DealerCode ?? '').trim();
          if (!code) return;

          const info = {
            employeeCode: a.employeeCode ?? a.EmployeeCode ?? '',
            employeeName: a.employeeName ?? a.EmployeeName ?? '',
          };

          this.assignedDealersMap.set(code, info);
          this.originalAssignedDealersMap.set(code, info);
        });

        this.pruneStaleAssignments();
      },
      error: (err) => console.error('Assigned dealers load error', err),
    });
  }

  getDealerAssignment(dealerCode: string): { employeeCode: string; employeeName: string } | null {
    return this.assignedDealersMap.get((dealerCode || '').trim()) ?? null;
  }

  // =====================================================
  // DEPARTMENT -> ROLES
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

    const coreFilled =
      !!d.firstName?.trim() &&
      !!d.lastName?.trim() &&
      !!d.gender &&
      /^\d{10}$/.test(String(d.mobile ?? '')) &&
      !!d.state && !!d.city &&
      /^\d{6}$/.test(String(d.pincode ?? '')) &&
      !!d.dateOfJoin && !!d.dateOfBirth && !!d.effectiveDate && !!d.department &&
      this.addedDealers.length > 0;

    if (!coreFilled) return false;

    if (d.createLogin) {
      const strongPwd = this.isEditMode
        ? true
        : /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/.test(String(d.password ?? ''));

      const emailOk    = !!d.emailId?.trim();
      const categoryOk = this.selectedDepartments.length > 0;
      const roleOk     = this.selectedRoles.length > 0;

      if (!emailOk || !strongPwd || !categoryOk || !roleOk) return false;
    }

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

    const zones       = [...new Set(this.addedDealers.map(r => r.zone))];
    const dealerIds   = this.addedDealers.map(r => r.dealerId);
    const dealerCodes = this.addedDealers.map(r => r.dealerCode);

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

      profileId:    this.pendingProfileId > 0 ? this.pendingProfileId : null,
      profileImage: this.imagePreview as string,

      mappedZones:   zones.join(','),
      mappedZoneIds: dealerIds.join(','),
      dealerCode:    dealerCodes.join(','),
      locationCode:  dealerCodes.join(','),

      createLogin:         this.employeeData.createLogin ?? false,
      selectedDepartments: this.employeeData.createLogin ? this.selectedDepartments : [],
      roles:               this.employeeData.createLogin ? this.selectedRoles       : [],
      roleMappings:        this.employeeData.createLogin ? roleMappings              : [],

      // NEW — TSM traceability fields
      tsmCode:      this.tsmCode || null,
      areaOfficeId: this.employeeData.areaOfficeId || null,

      createdBy:   'admin',
      createdDate: new Date(),
      updatedBy:   'admin',
      updatedDate: new Date(),
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