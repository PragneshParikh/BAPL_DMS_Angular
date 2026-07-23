import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { environment } from '../../../environments/environment';
import { EstimateService, JobTypeDropdownItem } from '../../core/services/estimate.service';
import { ReportService } from '../../core/services/report.service';
import { Observable } from 'rxjs';

interface PartyDetails {
  partyName: string;
  partyMobile: string;
  address1: string;
  address2: string;
  state?: string;
  city?: string;
  email?: string;
  pin?: string;
}

interface BatteryDetail {
  serialNo?: number;
  batteryNo?: string;
}

interface ComponentDetail {
  serialNo?: number;
  componentNo?: string;
}

interface VehicleDetails {
  chassisNo: string;
  regNo: string;
  modelName: string;
  colorName: string;
  batteries?: BatteryDetail[];
  chargers?: ComponentDetail[];
  motors?: ComponentDetail[];
}

interface VehicleInfoResponse {
  partyDetails: PartyDetails;
  vehicleDetails: VehicleDetails;
}

@Component({
  selector: 'app-estimate',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './estimate.html'
})
export class Estimate implements OnInit {

  form!: FormGroup;

  isSearching = false;
  isSaving = false;
  searchError = '';
  saveError = '';
  customerFound = false;

  jobTypeList: JobTypeDropdownItem[] = [];

  // ── Edit mode ──
  isEditMode = false;
  estimateId: number | null = null;

  // ── Chassis autosuggest ──
  chassisList: string[] = [];
  filteredChassisList: string[] = [];
  showChassisDropdown = false;
  private static readonly MAX_CHASSIS_SUGGESTIONS = 20;

  // ── Read-only vehicle attributes, sourced live from chassis search ──
  batteryNos: string[] = [];
  motorNos: string[] = [];
  chargerNos: string[] = [];

  // ── Per-row Parts/Labour code autosuggest ──
  rowSuggestions: { [index: number]: any[] } = {};
  rowShowDropdown: { [index: number]: boolean } = {};
  private searchDebounce: any = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private estimateService: EstimateService,
    private reportService: ReportService
  ) {
    this.form = this.fb.group({
      estimationNo: [{ value: '', disabled: true }],
      estimateDate: [this.getTodayIso()],
      searchNo: [''],
      chassisNo: [''],
      customerName: [''],
      customerAddress: [''],
      customerMobile: [''],
      customerPin: [''],
      customerEmail: [''],
      customerCity: [''],
      customerState: [''],
      kms: [null],
      jobTypeId: [null],
      details: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadJobTypes();
    this.loadChassisList();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.estimateId = +idParam;
      this.loadEstimateForEdit(this.estimateId);
    } else {
      this.loadNextEstimationNo();
    }
  }

  get detailsArray(): FormArray {
    return this.form.get('details') as FormArray;
  }

  get pageTitle(): string {
    return this.isEditMode ? 'Edit Estimate' : 'New Estimate';
  }

  private loadNextEstimationNo(): void {
    this.estimateService.getNextEstimationNo().subscribe({
      next: (no) => this.form.get('estimationNo')?.setValue(no),
      error: (err) => console.error('Failed to fetch next estimation no', err)
    });
  }

  private loadJobTypes(): void {
    this.estimateService.getJobTypes().subscribe({
      next: (list) => this.jobTypeList = list,
      error: (err) => console.error('Failed to fetch job types', err)
    });
  }

  private loadChassisList(): void {
    this.reportService.getChassisList().subscribe({
      next: (list) => this.chassisList = list,
      error: (err) => console.error('Failed to fetch chassis list', err)
    });
  }

  private getTodayIso(): string {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // ═══════════════════════════════════════════════════════════════════
  // EDIT MODE — load existing estimate
  // ═══════════════════════════════════════════════════════════════════

  private loadEstimateForEdit(id: number): void {
    this.estimateService.getById(id).subscribe({
      next: (res) => {
        this.form.patchValue({
          estimationNo: res.estimationNo,
          estimateDate: res.estimateDate ? res.estimateDate.substring(0, 10) : this.getTodayIso(),
          searchNo: res.chassisNo,
          chassisNo: res.chassisNo,
          customerName: res.customerName,
          customerAddress: res.customerAddress,
          customerMobile: res.customerMobile,
          customerPin: res.customerPin,
          customerEmail: res.customerEmail,
          customerCity: res.customerCity,
          customerState: res.customerState,
          kms: res.kms,
          jobTypeId: res.jobTypeId
        });

        this.customerFound = true;

        this.detailsArray.clear();
        (res.details || []).forEach(d => {
          const row = this.newDetailRow(d.itemType as 'Part' | 'Labour', d.id);
          row.patchValue({
            itemCode: d.itemCode,
            itemDescription: d.itemDescription,
            qty: d.qty,
            rate: d.rate,
            discountPercent: d.discountPercent,
            cgstPercent: d.cgstPercent,
            sgstPercent: d.sgstPercent,
            igstPercent: d.igstPercent
          });
          this.detailsArray.push(row);
        });

        // Best-effort: re-fetch battery/motor/charger reference info for the
        // saved chassis. Non-critical — failure here shouldn't block
        // viewing/editing the rest of the estimate.
        if (res.chassisNo) {
          this.loadVehicleReferenceData(res.chassisNo);
        }
      },
      error: (err) => {
        this.saveError = err?.error?.message || 'Failed to load estimate for editing.';
      }
    });
  }

  private loadVehicleReferenceData(chassisNo: string): void {
    this.http.get<VehicleInfoResponse>(`${environment.apiUrl}/VehicleInfo`, {
      params: { chassisNo, regNo: chassisNo }
    }).subscribe({
      next: (res) => {
        this.batteryNos = (res.vehicleDetails?.batteries ?? [])
          .map(b => b.batteryNo).filter((v): v is string => !!v);
        this.motorNos = (res.vehicleDetails?.motors ?? [])
          .map(m => m.componentNo).filter((v): v is string => !!v);
        this.chargerNos = (res.vehicleDetails?.chargers ?? [])
          .map(c => c.componentNo).filter((v): v is string => !!v);
      },
      error: () => {
        // Silent — reference-only fields, not critical to viewing/editing.
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // CHASSIS AUTOSUGGEST
  // ═══════════════════════════════════════════════════════════════════

  onChassisInput(): void {
    this.updateChassisSuggestions();
  }

  onChassisFocus(): void {
    this.updateChassisSuggestions();
  }

  onChassisBlur(): void {
    setTimeout(() => {
      this.showChassisDropdown = false;
    }, 150);
  }

  selectChassisSuggestion(chassis: string): void {
    this.form.patchValue({ searchNo: chassis });
    this.showChassisDropdown = false;
    this.searchVehicle();
  }

  private updateChassisSuggestions(): void {
    const text = (this.form.get('searchNo')?.value ?? '').toString().trim().toUpperCase();

    const source = text
      ? this.chassisList.filter(c => c.toUpperCase().includes(text))
      : this.chassisList;

    this.filteredChassisList = source.slice(0, Estimate.MAX_CHASSIS_SUGGESTIONS);
    this.showChassisDropdown = true;
  }

  // ═══════════════════════════════════════════════════════════════════
  // VEHICLE / CUSTOMER SEARCH
  // ═══════════════════════════════════════════════════════════════════

  onSearchEnter(event: Event): void {
    event.preventDefault();
    this.showChassisDropdown = false;
    this.searchVehicle();
  }

  searchVehicle(): void {
    const value = (this.form.get('searchNo')?.value ?? '').trim();

    if (!value) {
      this.searchError = 'Enter a chassis or registration number to search.';
      this.customerFound = false;
      return;
    }

    this.isSearching = true;
    this.searchError = '';

    this.http.get<VehicleInfoResponse>(`${environment.apiUrl}/VehicleInfo`, {
      params: { chassisNo: value, regNo: value }
    }).subscribe({
      next: (res) => {
        this.isSearching = false;
        this.customerFound = true;

        this.form.patchValue({
          chassisNo: res.vehicleDetails?.chassisNo ?? value,
          customerName: res.partyDetails?.partyName ?? '',
          customerAddress: [res.partyDetails?.address1, res.partyDetails?.address2]
            .filter(Boolean).join(', '),
          customerMobile: res.partyDetails?.partyMobile ?? '',
          customerPin: res.partyDetails?.pin ?? '',
          customerEmail: res.partyDetails?.email ?? '',
          customerCity: res.partyDetails?.city ?? '',
          customerState: res.partyDetails?.state ?? ''
        });

        this.batteryNos = (res.vehicleDetails?.batteries ?? [])
          .map(b => b.batteryNo).filter((v): v is string => !!v);
        this.motorNos = (res.vehicleDetails?.motors ?? [])
          .map(m => m.componentNo).filter((v): v is string => !!v);
        this.chargerNos = (res.vehicleDetails?.chargers ?? [])
          .map(c => c.componentNo).filter((v): v is string => !!v);
      },
      error: (err) => {
        this.isSearching = false;
        this.customerFound = false;
        this.batteryNos = [];
        this.motorNos = [];
        this.chargerNos = [];
        this.searchError = err?.status === 404
          ? 'No vehicle found for this chassis/registration number.'
          : (err?.error?.Message || 'Error searching vehicle.');
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // PARTS & LABOUR — rows
  // ═══════════════════════════════════════════════════════════════════

  private newDetailRow(itemType: 'Part' | 'Labour', id: number = 0): FormGroup {
    return this.fb.group({
      id: [id],
      itemType: [itemType],
      itemCode: [''],
      itemDescription: [''],
      qty: [1],
      rate: [0],
      discountPercent: [0],
      cgstPercent: [0],
      sgstPercent: [0],
      igstPercent: [0]
    });
  }
  addPart(): void {
    this.detailsArray.push(this.newDetailRow('Part'));
    const newIndex = this.detailsArray.length - 1;
    this.performItemSearch(newIndex, 100);
  }

  addLabour(): void {
    this.detailsArray.push(this.newDetailRow('Labour'));
    const newIndex = this.detailsArray.length - 1;
    this.performItemSearch(newIndex, 100);
  }

  removeDetail(index: number): void {
    this.detailsArray.removeAt(index);
    this.rowSuggestions = {};
    this.rowShowDropdown = {};
  }

  getRowAmount(index: number): number {
    const row = this.detailsArray.at(index).value;
    const qty = Number(row.qty) || 0;
    const rate = Number(row.rate) || 0;
    const base = qty * rate;
    const discount = base * (Number(row.discountPercent) || 0) / 100;
    const taxable = base - discount;
    const gstPercent = (Number(row.cgstPercent) || 0)
                     + (Number(row.sgstPercent) || 0)
                     + (Number(row.igstPercent) || 0);
    const gst = taxable * gstPercent / 100;
    return Math.round((taxable + gst) * 100) / 100;
  }

    get subTotalParts(): number {
    let total = 0;
    for (const i of this.partIndices) {
      total += this.getRowAmount(i);
    }
    return Math.round(total * 100) / 100;
  }

  get subTotalLabour(): number {
    let total = 0;
    for (const i of this.labourIndices) {
      total += this.getRowAmount(i);
    }
    return Math.round(total * 100) / 100;
  }
  get grandTotal(): number {
    let total = 0;
    for (let i = 0; i < this.detailsArray.length; i++) {
      total += this.getRowAmount(i);
    }
    return Math.round(total * 100) / 100;
  }

  // ═══════════════════════════════════════════════════════════════════
  // PARTS & LABOUR — per-row code autosuggest
  // ═══════════════════════════════════════════════════════════════════

  onItemCodeInput(index: number): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.performItemSearch(index), 250);
  }

  onItemCodeFocus(index: number): void {
    this.performItemSearch(index);
  }

  onItemCodeBlur(index: number): void {
    setTimeout(() => {
      this.rowShowDropdown[index] = false;
    }, 150);
  }

  triggerItemSearch(index: number): void {
    this.performItemSearch(index);
  }

    private performItemSearch(index: number, maxResults: number = 20): void {
      const row = this.detailsArray.at(index);
      const itemType = row.get('itemType')?.value;
      const query = (row.get('itemCode')?.value ?? '').toString().trim();

      const search$: Observable<any[]> = itemType === 'Part'
        ? this.estimateService.searchParts(query, maxResults)
        : this.estimateService.searchLabour(query, maxResults);

      search$.subscribe({
        next: (results: any[]) => {
          this.rowSuggestions[index] = results;
          this.rowShowDropdown[index] = true;
        },
        error: () => {
          this.rowSuggestions[index] = [];
          this.rowShowDropdown[index] = true;
        }
      });
    }

  selectItemSuggestion(index: number, item: any): void {
    const row = this.detailsArray.at(index);
    const itemType = row.get('itemType')?.value;

    if (itemType === 'Part') {
      row.patchValue({
        itemCode: item.itemCode,
        itemDescription: item.itemDescription,
        rate: item.rate,
        cgstPercent: item.cgstPercent,
        sgstPercent: item.sgstPercent,
        igstPercent: item.igstPercent
      });
    } else {
      row.patchValue({
        itemCode: item.labourCode,
        itemDescription: item.labourDescription,
        rate: item.rate,
        cgstPercent: item.cgstPercent,
        sgstPercent: item.sgstPercent,
        igstPercent: item.igstPercent
      });
    }

    this.rowShowDropdown[index] = false;
  }

  clearItemSelection(index: number): void {
    const row = this.detailsArray.at(index);
    row.patchValue({
      itemCode: '',
      itemDescription: '',
      rate: 0,
      cgstPercent: 0,
      sgstPercent: 0,
      igstPercent: 0
    });
    this.rowSuggestions[index] = [];
    this.rowShowDropdown[index] = false;
  }

  // ═══════════════════════════════════════════════════════════════════
  // SAVE (create or update)
  // ═══════════════════════════════════════════════════════════════════

  onSave(): void {
    this.isSaving = true;
    this.saveError = '';

    const raw = this.form.getRawValue();

    const model = {
      estimationNo: raw.estimationNo,
      estimateDate: raw.estimateDate,
      chassisNo: raw.chassisNo,
      customerName: raw.customerName,
      customerMobile: raw.customerMobile,
      customerAddress: raw.customerAddress,
      customerPin: raw.customerPin,
      customerEmail: raw.customerEmail,
      customerCity: raw.customerCity,
      customerState: raw.customerState,
      kms: raw.kms,
      jobTypeId: raw.jobTypeId,
      details: raw.details.map((d: any, i: number) => ({
        id: d.id || 0,
        itemType: d.itemType,
        itemCode: d.itemCode,
        itemDescription: d.itemDescription,
        qty: d.qty,
        rate: d.rate,
        discountPercent: d.discountPercent,
        cgstPercent: d.cgstPercent,
        sgstPercent: d.sgstPercent,
        igstPercent: d.igstPercent,
        amount: this.getRowAmount(i)
      }))
    };

    const save$: Observable<any> = this.isEditMode && this.estimateId
      ? this.estimateService.update(this.estimateId, model)
      : this.estimateService.create(model);

    save$.subscribe({
      next: (result: any) => {
        this.isSaving = false;
        alert(this.isEditMode ? 'Estimate updated successfully.' : `Estimate saved successfully (Id: ${result}).`);
        this.router.navigate(['/estimate']);
      },
      error: (err) => {
        this.isSaving = false;
        this.saveError = err?.error?.message || 'Failed to save estimate.';
      }
    });
  }


    get partIndices(): number[] {
      return this.detailsArray.controls
        .map((_, i) => i)
        .filter(i => this.detailsArray.at(i).value.itemType === 'Part');
    }

    get labourIndices(): number[] {
      return this.detailsArray.controls
        .map((_, i) => i)
        .filter(i => this.detailsArray.at(i).value.itemType === 'Labour');
    }
  onCreateJobCard(): void {
    const raw = this.form.getRawValue();
    this.router.navigate(['/job-card-addForm', 'new'], {
      state: {
        fromEstimate: true,
        estimateId: this.estimateId,
        chassisNo: raw.chassisNo,
        vehiclekms: raw.kms,
        jobtype: raw.jobTypeId,
        customerName: raw.customerName,
        customerMobile: raw.customerMobile,
        registerNo: this.form.get('chassisNo')?.value,
        modelName: null 
      }
    });
  }

    onPrint(): void {
    if (!this.estimateId) return;

    this.estimateService.downloadPdf(this.estimateId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
      error: (err) => {
        this.saveError = err?.error?.message || 'Failed to generate print PDF.';
      }
    });
  }
}