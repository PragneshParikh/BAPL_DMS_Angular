import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { Gender } from '../../constant';
import { EmployeeMasterService } from '../../core/services/employee-master';
import { DealerService } from '../../core/services/dealer-service';
import { LocationMasterService } from '../../core/services/location-master-service';
import { DepartmentService } from '../../core/services/department';
import { DesignationService } from '../../core/services/designation';
import { RoleService } from '../../core/services/Deptrole';

interface MenuAccessItem {
  subMenuId: number;
  menuName: string;
  pathName?: string;
  isGranted: boolean;
}
interface MenuAccessGroup {
  topMenuId: number;
  topMenuName: string;
  items: MenuAccessItem[];
}

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

  departmentOptions: { id: string; name: string }[] = [];
  selectedDepartments: string[] = [];
  menuGroupsByDepartment: { [dept: string]: MenuAccessGroup[] } = {};
  expandedAddForDept: { [dept: string]: boolean } = {};
  resolvingRoles: boolean = false;

  // NEW — the location the *currently logged-in* user signed in from (via
  // Location Login — see AuthController.LocationLogin / login.ts on the
  // frontend). Purely informational here: unrelated to selectedLocations
  // below, which is which location(s) the *employee being edited* is
  // assigned to. Read unconditionally in ngOnInit so it's available in both
  // Add and Edit mode, not just when editing.
  locationCode: string | null = null;

  // NEW — the employee's currently-saved roleId per category, kept alive for
  // the whole edit session (not just during ngOnInit). This is what lets
  // unchecking-then-rechecking a category restore its original grants
  // instead of wiping them — nothing is actually removed from the database
  // until the form is submitted.
  private roleIdByCategory: { [category: string]: string } = {};

  // NEW — existing Role Master roles per category, for the prefill dropdown
  existingRolesByDepartment: { [dept: string]: { roleId: string; roleName: string }[] } = {};
  selectedExistingRoleByDepartment: { [dept: string]: string } = {};

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
    locationLoginId?: string; // NEW
    locationPassword?: string; // NEW
  } = {};

  private readonly emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private readonly strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;

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

    // FIX: read unconditionally, before the Add/Edit branch below — this was
    // previously only set inside the popupData (Edit) branch, so a brand-new
    // employee form always left it null even though the info is available
    // either way.
    this.locationCode = localStorage.getItem('locationCode');

    this.loadStates();
    this.loadCities();
    this.loadDepartments();
    this.loadDesignations();
    this.loadDepartmentOptions();

    if (this.popupData) {

      this.employeeData = { ...this.popupData };

      this.employeeData.department =
        this.popupData.department != null ? String(this.popupData.department) : '';

      this.employeeData.designation =
        this.popupData.designation != null ? String(this.popupData.designation) : '';

      this.employeeData.location =
        this.popupData.locationCode != null ? String(this.popupData.locationCode).trim() : '';

      this.employeeData.dateOfJoin = this.formatDate(this.popupData.dateOfJoin);
      this.imagePreview = this.popupData.profileImage;
      this.employeeData.createLogin = !!this.popupData.emailId;

      // NEW — location login: prefill the ID only. The password is never
      // sent back from the API, so it always starts blank; leaving it blank
      // on Update means "keep the current password" (same UX as the main
      // Email/Password login below).
      this.employeeData.locationLoginId = this.popupData.locationLoginId ?? '';
      this.employeeData.locationPassword = '';

      this.selectedDepartments = this.popupData.selectedDepartments?.length
        ? [...this.popupData.selectedDepartments] : [];

      // FIX: category -> roleId, taken directly from EmployeeRoleMapping.RoleId
      // (returned by GetEmployeeById as popupData.roleMappings). Stored on
      // the component (not a local var) so onDepartmentToggle can reuse it
      // later when a category is re-checked mid-session — that's what lets
      // uncheck-then-recheck restore the original grants instead of wiping
      // them out, without touching anything in the database until Save.
      this.roleIdByCategory = {};
      (this.popupData.roleMappings ?? []).forEach((rm: any) => {
        if (rm.category && rm.roleId) this.roleIdByCategory[rm.category] = rm.roleId;
      });

      this.selectedDepartments.forEach(dept => {
        this.loadCategoryChecklist(dept, this.roleIdByCategory[dept]);
        this.loadExistingRolesForCategory(dept);
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
    else {
      this.employeeData.createLogin = false;
      this.employeeData.locationLoginId = ''; // NEW
      this.employeeData.locationPassword = ''; // NEW
      this.loadLoggedInDealer();
    }
  }

  formatDate(value: any): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  loadDealerInfo(dealerCode: string): void {
    this.dealerMasterService.getByDealerCode(dealerCode).subscribe({
      next: (response) => { this.dealerInfo = response; },
      error: () => { this.dealerInfo = null; }
    });
  }

  loadLoggedInDealer(): void {
    // FIX: this was accidentally passed a second argument
    // (`response.locationCode ?? ''`) referencing a `response` variable that
    // doesn't exist in this scope — localStorage.getItem() only takes the
    // key. Restored to the plain single-argument call.
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

  loadStates(): void {
    this.employeeService.getStates().subscribe({
      next: (response) => { this.states = response; }
    });
  }

  loadCities(): void {
    this.employeeService.getCities().subscribe({
      next: (response) => { this.cities = response; }
    });
  }

  onStateChange(): void {
    const selectedStateId = Number(this.employeeData.state);
    this.filteredCities = this.cities.filter((x: any) => x.stateId === selectedStateId);
  }

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

  isDepartmentSelected(dept: string): boolean {
    return this.selectedDepartments.includes(dept);
  }

  onDepartmentToggle(dept: string, event: any): void {
    if (event.target.checked) {
      if (!this.selectedDepartments.includes(dept)) this.selectedDepartments.push(dept);
      // FIX: restore from this employee's previously saved role for this
      // category if one exists — same prefill the initial page load does.
      // Falls back to blank automatically if this category never had a
      // saved role (roleIdByCategory[dept] is undefined).
      this.loadCategoryChecklist(dept, this.roleIdByCategory[dept]);
      this.loadExistingRolesForCategory(dept);
    } else {
      this.selectedDepartments = this.selectedDepartments.filter(d => d !== dept);
      delete this.menuGroupsByDepartment[dept];
      delete this.expandedAddForDept[dept];
      delete this.existingRolesByDepartment[dept];
      delete this.selectedExistingRoleByDepartment[dept];
      // NOTE: roleIdByCategory[dept] is deliberately left alone here.
      // Deleting it here would make an uncheck permanent even before Save;
      // keeping it is what lets a re-check bring the original grants back.
      // It only stops mattering once the form is actually submitted with
      // this category left unchecked — at that point the backend's
      // RemoveRange + re-Add in SaveEmployeeRoleMappings drops the row for
      // real, and the next GetEmployeeById simply won't return it anymore.
    }
  }

  // FIX: prefill now goes straight through Role Master's own menu-access
  // endpoint using a real roleId — not through category+name lookups
  // against RoleCategoryMapping. No dependency on that table's rows still
  // existing or names still matching what's stored on the employee side.
  private loadCategoryChecklist(dept: string, prefillRoleId?: string): void {
    this.roleService.getMenuTemplate().subscribe({
      next: (res: any) => {
        const groups: MenuAccessGroup[] = res.groups ?? [];

        if (prefillRoleId) {
          this.roleService.getMenuAccess(prefillRoleId).subscribe({
            next: (accessRes: any) => {
              const grantedIds = new Set<number>(
                (accessRes.groups ?? [])
                  .flatMap((g: any) => g.items)
                  .filter((i: any) => i.isGranted)
                  .map((i: any) => i.subMenuId)
              );
              this.menuGroupsByDepartment[dept] = groups.map(g => ({
                ...g,
                items: g.items.map(i => ({ ...i, isGranted: grantedIds.has(i.subMenuId) }))
              }));
            },
            error: () => { this.menuGroupsByDepartment[dept] = groups; }
          });
        } else {
          this.menuGroupsByDepartment[dept] = groups;
        }
      },
      error: () => { this.menuGroupsByDepartment[dept] = []; }
    });
  }

  // NEW — populates the "prefill from existing role" dropdown for a category.
  // Calls RoleService.getByCategory — NOT getRolesByCategory, which doesn't
  // exist (an earlier, broken version of this method was removed from
  // Deptrole.ts after it was found to double up the /role/ path segment).
  private loadExistingRolesForCategory(dept: string): void {
    this.roleService.getByCategory(dept).subscribe({
      next: (res: any[]) => { this.existingRolesByDepartment[dept] = res ?? []; },
      error: () => { this.existingRolesByDepartment[dept] = []; }
    });
  }

  // NEW — handles the existing-role checkbox list. Checkboxes behave like a
  // radio group: checking one calls onExistingRoleSelected to prefill from
  // it, which updates selectedExistingRoleByDepartment[dept] — since every
  // checkbox's [checked] is bound to "is this the tracked role", the
  // previously-checked box automatically shows unchecked once that state
  // changes, with no need to manually loop and uncheck the others.
  // Unchecking a box does NOT clear the menu checkboxes below — this is
  // still just a one-time starting point, exactly like the old dropdown's
  // "-- Select --" option never reset anything either.
  onExistingRoleCheckboxToggle(dept: string, roleId: string, event: any): void {
    if (event.target.checked) {
      this.onExistingRoleSelected(dept, roleId);
    } else if (this.selectedExistingRoleByDepartment[dept] === roleId) {
      this.selectedExistingRoleByDepartment[dept] = '';
    }
  }

  // Shared prefill logic — called by onExistingRoleCheckboxToggle above.
  // Overwrites the current checkbox state with that role's granted items;
  // still fully editable afterward — this is a one-time prefill, not a
  // lock. Nothing is saved until the form is submitted.
  onExistingRoleSelected(dept: string, roleId: string): void {
    this.selectedExistingRoleByDepartment[dept] = roleId;
    if (!roleId) return;

    this.roleService.getMenuAccess(roleId).subscribe({
      next: (accessRes: any) => {
        const grantedIds = new Set<number>(
          (accessRes.groups ?? [])
            .flatMap((g: any) => g.items)
            .filter((i: any) => i.isGranted)
            .map((i: any) => i.subMenuId)
        );
        const groups = this.menuGroupsByDepartment[dept] ?? [];
        this.menuGroupsByDepartment[dept] = groups.map(g => ({
          ...g,
          items: g.items.map(i => ({ ...i, isGranted: grantedIds.has(i.subMenuId) }))
        }));
      },
      error: () => { /* leave current checkbox state untouched on failure */ }
    });
  }

  getProcessGroup(dept: string): MenuAccessGroup | undefined {
    return (this.menuGroupsByDepartment[dept] ?? []).find(g => g.topMenuName === 'Process');
  }

  getReportsGroup(dept: string): MenuAccessGroup | undefined {
    return (this.menuGroupsByDepartment[dept] ?? []).find(g => g.topMenuName === 'Reports');
  }

  hasAnyCheckedItem(dept: string): boolean {
    return (this.menuGroupsByDepartment[dept] ?? []).some(g => g.items.some(i => i.isGranted));
  }

  isAddMenuExpanded(dept: string): boolean {
    return !!this.expandedAddForDept[dept];
  }

  toggleAddMenu(dept: string): void {
    this.expandedAddForDept[dept] = !this.expandedAddForDept[dept];
  }

  getGrantedProcessItems(dept: string): MenuAccessItem[] {
    return (this.getProcessGroup(dept)?.items ?? []).filter(i => i.isGranted);
  }
  getGrantedReportsItems(dept: string): MenuAccessItem[] {
    return (this.getReportsGroup(dept)?.items ?? []).filter(i => i.isGranted);
  }

  getAvailableProcessItems(dept: string): MenuAccessItem[] {
    return (this.getProcessGroup(dept)?.items ?? []).filter(i => !i.isGranted);
  }
  getAvailableReportsItems(dept: string): MenuAccessItem[] {
    return (this.getReportsGroup(dept)?.items ?? []).filter(i => !i.isGranted);
  }

  // ===== SELECT ALL — MENU ACCESS (Process / Reports, per category) =====
  // One generic pair reused across all four columns (Granted-Process,
  // Granted-Reports, Add-Process, Add-Reports). In "Granted", unchecking
  // bulk-revokes that column's items; in "Add Menu Item", checking
  // bulk-grants them. Mutating item.isGranted here is safe — the arrays
  // passed in are filtered views over the same underlying objects held in
  // menuGroupsByDepartment, so the change is picked up everywhere else
  // that reads them (hasAnyCheckedItem, onSubmit, etc.).
  isAllMenuItemsSelected(items: MenuAccessItem[]): boolean {
    return items.length > 0 && items.every(i => i.isGranted);
  }

  toggleAllMenuItems(items: MenuAccessItem[], event: any): void {
    const checked = event.target.checked;
    items.forEach(i => i.isGranted = checked);
  }

  // NEW — surfaces the same rule isFormValid enforces, so the Update button
  // being disabled doesn't look unexplained. Lists every currently-checked
  // category that has zero granted menu items.
  get categoriesMissingMenuItems(): string[] {
    if (!this.employeeData.createLogin) return [];
    return this.selectedDepartments.filter(dept => !this.hasAnyCheckedItem(dept));
  }

  onlyDigits(event: any, field: 'mobile' | 'pincode', maxLen: number): void {
    let value = String(event.target.value || '').replace(/\D/g, '');
    if (value.length > maxLen) {
      value = value.slice(0, maxLen);
    }
    this.employeeData[field] = value;
    event.target.value = value;
  }

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

    // NEW — Location Login: required whenever at least one dealer location
    // is selected, independent of whether "Create Login Account" is checked.
    // This is a separate credential from the email/password login below.
    if (this.selectedLocations.length > 0) {
      const locLoginId = String(d.locationLoginId ?? '').trim();
      if (!locLoginId) {
        this.errors.locationLoginId = 'Location Login ID is required.';
        valid = false;
      }

      const locPwd = String(d.locationPassword ?? '');
      if (!this.isEditMode && !locPwd) {
        this.errors.locationPassword = 'Location Password is required.';
        valid = false;
      } else if (locPwd && !this.strongPasswordPattern.test(locPwd)) {
        this.errors.locationPassword =
          'Password must be at least 6 characters and include uppercase, lowercase, a digit, and a special character.';
        valid = false;
      }
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

      if (this.selectedDepartments.length > 0) {
        const anyDeptEmpty = this.selectedDepartments.some(dept => !this.hasAnyCheckedItem(dept));
        if (anyDeptEmpty) {
          this.errors.role = 'Select at least one menu item for each selected category.';
          valid = false;
        }
      }
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
      !!d.dateOfJoin &&
      this.selectedLocations.length > 0 &&
      !!d.department &&
      !!d.designation &&
      !!d.state &&
      !!d.city &&
      /^\d{6}$/.test(String(d.pincode ?? ''));

    if (!coreFilled) return false;

    // NEW — mirrors the Location Login validation above: required whenever
    // a location is selected, password optional on edit (blank = unchanged).
    if (this.selectedLocations.length > 0) {
      const locLoginId = String(d.locationLoginId ?? '').trim();
      const locPwd = String(d.locationPassword ?? '');

      const locLoginIdOk = !!locLoginId;
      const locPwdOk = this.isEditMode
        ? (!locPwd || this.strongPasswordPattern.test(locPwd))
        : (!!locPwd && this.strongPasswordPattern.test(locPwd));

      if (!locLoginIdOk || !locPwdOk) return false;
    }

    if (d.createLogin) {
      const email = String(d.emailId ?? '').trim();
      const pwd = String(d.password ?? '');

      const emailOk = !email || this.emailPattern.test(email);
      const strongPwd = !pwd || this.strongPasswordPattern.test(pwd);
      const rolesOk = this.selectedDepartments.length === 0
        || this.selectedDepartments.every(dept => this.hasAnyCheckedItem(dept));

      if (!emailOk || !strongPwd || !rolesOk) return false;
    }

    return true;
  }

  onSubmit(form: any): void {

    if (!this.validateForm()) {
      return;
    }

    if (!this.employeeData.createLogin || this.selectedDepartments.length === 0) {
      this.finalizeSubmit([]);
      return;
    }

    this.resolvingRoles = true;

    const resolutions = this.selectedDepartments.map(dept => {
      const group = this.menuGroupsByDepartment[dept] ?? [];
      const subMenuIds = group.flatMap(g => g.items).filter(i => i.isGranted).map(i => i.subMenuId);

      if (subMenuIds.length === 0) return of(null);

      return this.roleService.resolveRoleForItems(dept, subMenuIds).pipe(
        // FIX: capture roleId from the resolution response too — this is
        // what gets persisted on EmployeeRoleMapping and used for every
        // future prefill, replacing name-based matching entirely.
        map((res: any) => ({ category: dept, roleName: res.roleName, roleId: res.roleId })),
        catchError(() => of(null))
      );
    });

    forkJoin(resolutions).subscribe({
      next: (results) => {
        this.resolvingRoles = false;
        const roleMappings = results.filter(r => !!r) as { category: string; roleName: string; roleId: string }[];
        this.finalizeSubmit(roleMappings);
      },
      error: () => {
        this.resolvingRoles = false;
        alert('Could not resolve one or more roles from your menu selections. Please try again.');
      }
    });
  }

  private finalizeSubmit(roleMappings: { category: string; roleName: string; roleId?: string }[]): void {
    const employeeObj = {
      id: this.employeeData.id || 0,
      employeeCode: this.employeeData.employeeCode,
      firstName: this.employeeData.firstName,
      lastName: this.employeeData.lastName,
      gender: this.employeeData.gender,
      mobile: this.employeeData.mobile,

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

      // NEW — location login fields. locationPasswordHash carries a
      // *plaintext* password to the API (named to match
      // EmployeeMaster.LocationPasswordHash for model binding) only when one
      // was typed; the backend hashes it before saving, and on update leaves
      // the stored hash alone if this comes through blank/null.
      locationLoginId: this.selectedLocations.length > 0 ? (this.employeeData.locationLoginId ?? null) : null,
      locationPasswordHash: this.selectedLocations.length > 0 ? (this.employeeData.locationPassword || null) : null,

      createdBy: 'admin',
      createdDate: new Date(),
      updatedBy: 'admin',
      updatedDate: new Date(),

      createLogin: this.employeeData.createLogin ?? false,

      selectedDepartments: this.employeeData.createLogin ? this.selectedDepartments : [],
      roles: this.employeeData.createLogin ? roleMappings.map(r => r.roleName) : [],

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

  private afterSave(): void {
    if (this.isPopupMode) {
      this.closed.emit();
    } else {
      this.router.navigate(['/employee']);
    }
  }

  onFileSelect(event: any): void {
    this.selectedFile = event.target.files[0];
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => { this.imagePreview = e.target?.result!; };
      reader.readAsDataURL(this.selectedFile);
    }
  }

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

  backToList(): void {
    if (this.isPopupMode) {
      this.closed.emit();
    } else {
      this.router.navigate(['/employee']);
    }
  }

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

  get allLocationsSelected(): boolean {
    return this.dealerLocations.length > 0
      && this.selectedLocations.length === this.dealerLocations.length;
  }

  get someLocationsSelected(): boolean {
    return this.selectedLocations.length > 0 && !this.allLocationsSelected;
  }

  toggleAllLocations(event: any): void {
    if (event.target.checked) {
      this.selectedLocations = this.dealerLocations.map(l => l.locCode);
    } else {
      this.selectedLocations = [];
    }
  }
}