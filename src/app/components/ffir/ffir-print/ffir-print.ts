import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { DealerService } from '../../../core/services/dealer-service';
import { FFIRService } from '../../../core/services/ffirservice';
import { JobCardService } from '../../../core/services/job-card-service';
import { B2BJobcardService } from '../../b2b-jobcard/services/b2b-jobcard.service';

@Component({
  selector: 'app-ffir-print',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ffir-print.html',
  styleUrl: './ffir-print.scss'
})
export class FFIRPrint implements OnInit, OnDestroy {
  ffir: any;
  jobCard: any;
  dealer: any;
  history: any[] = [];
  loading = true;
  errorMessage = '';
  private printTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly ffirService: FFIRService,
    private readonly jobCardService: JobCardService,
    private readonly b2bJobCardService: B2BJobcardService,
    private readonly dealerService: DealerService
  ) { }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.failToLoad('Invalid FFIR number.');
      return;
    }

    this.ffirService.getFFIRPrintDetails(id).pipe(
      switchMap((ffir) => {
        this.ffir = ffir;
        const b2bJobCardId = this.readProperty(ffir, 'b2bJobCardId');
        const jobCardRequest = b2bJobCardId
          ? this.b2bJobCardService.getById(String(b2bJobCardId))
          : this.jobCardService.getCIRJobCardDetails(Number(this.readProperty(ffir, 'jobCardHeaderId')));

        return jobCardRequest.pipe(
          switchMap((jobCard) => {
            this.jobCard = this.normalizeJobCard(jobCard, Boolean(b2bJobCardId));
            const chassisNo = this.jobCard.chassisNo || this.readProperty(ffir, 'ffirChassisNo');
            const historyRequest = !chassisNo
              ? of([])
              : b2bJobCardId
                ? this.b2bJobCardService.getVehicle(chassisNo, this.readProperty(ffir, 'dealerCode'))
                  .pipe(map((vehicleCard) => vehicleCard?.history ?? []))
                : this.ffirService.getJobCardHistory(chassisNo);

            return forkJoin({
              dealerResponse: this.dealerService.getDealerDropdown(this.readProperty(ffir, 'dealerCode')),
              history: historyRequest
            });
          })
        );
      })
    ).subscribe({
      next: ({ dealerResponse, history }) => {
        this.dealer = dealerResponse?.data?.[0] ?? null;
        this.history = (history ?? []).map((row: any) => this.normalizeHistoryRow(row));
        this.loading = false;
        this.printTimer = setTimeout(() => this.print(), 500);
      },
      error: (error) => {
        console.error('Failed to load FFIR print details', error);
        this.failToLoad(error?.error?.message || 'Could not load the FFIR print report.');
      }
    });
  }

  ngOnDestroy(): void {
    if (this.printTimer) clearTimeout(this.printTimer);
  }

  print(): void {
    if (typeof window !== 'undefined') window.print();
  }

  backToList(): void {
    void this.router.navigate(['/ffirlisting']);
  }

  readProperty(source: any, property: string): any {
    if (!source || typeof source !== 'object') return undefined;
    const key = Object.keys(source).find((candidate) => candidate.toLowerCase() === property.toLowerCase());
    return key ? source[key] : undefined;
  }

  get ffirNumber(): string {
    return `${this.readProperty(this.ffir, 'ffirPrefix') || ''}${this.readProperty(this.ffir, 'cirNo') ?? ''}`;
  }

  get mainParts(): any[] {
    return this.readProperty(this.ffir, 'mainParts') ?? [];
  }

  get mainPartsText(): string {
    return this.mainParts
      .map((part) => this.readProperty(part, 'partAffectedName')
        || this.readProperty(part, 'partAffectedDescription'))
      .filter(Boolean)
      .join(', ') || '-';
  }

  get complaints(): any[] {
    return this.jobCard?.complaints ?? [];
  }

  formatValue(value: unknown): string {
    return value === null || value === undefined || String(value).trim() === '' ? '-' : String(value);
  }

  private normalizeJobCard(source: any, isB2B: boolean): any {
    const vehicle = isB2B ? this.readProperty(source, 'vehicle') : source;
    const customer = isB2B ? this.readProperty(source, 'customer') : source;
    const complaints = this.readProperty(source, 'complaints');
    const complaintRows = Array.isArray(complaints) ? complaints : [];
    const normalizedComplaints = complaintRows.map((item: any) => typeof item === 'string'
      ? {
          customerVoice: this.readProperty(source, 'customerVoice'),
          complaint: item
        }
      : item);
    const battery = this.readProperty(source, 'battery');

    return {
      jobNo: this.readProperty(source, isB2B ? 'jobCardNumber' : 'jobNo'),
      jobDate: this.readProperty(source, isB2B ? 'createdAt' : 'jobDate'),
      chassisNo: this.readProperty(vehicle, isB2B ? 'chassisNo' : 'chassisNo'),
      registerNo: this.readProperty(vehicle, isB2B ? 'regNo' : 'registerNo'),
      modelName: this.readProperty(vehicle, isB2B ? 'model' : 'modelName'),
      variant: this.readProperty(vehicle, 'variant'),
      color: this.readProperty(vehicle, 'color'),
      customerName: this.readProperty(customer, isB2B ? 'name' : 'customerName'),
      customerMobile: this.readProperty(customer, isB2B ? 'mobile' : 'customerMobile'),
      saleDate: this.readProperty(vehicle, isB2B ? 'purchaseDate' : 'vehicleSaleDate'),
      currentKms: this.readProperty(source, isB2B ? 'odometerAtCheckIn' : 'vehiclekms'),
      motorNo: this.readProperty(vehicle, 'motorNo'),
      batteryNo: this.readProperty(vehicle, 'batteryNo'),
      batteryType: isB2B
        ? this.readProperty(vehicle, 'batteryType')
        : this.readProperty(battery, 'batteryChemical') || this.readProperty(battery, 'batteryMake'),
      chargerNo: this.readProperty(vehicle, 'chargerNo'),
      serviceHead: this.readProperty(source, isB2B ? 'serviceHeadName' : 'serviceHead'),
      serviceType: isB2B
        ? this.readProperty(source, 'serviceTypeName') || this.readProperty(source, 'serviceType')
        : this.readProperty(source, 'serviceType'),
      technician: isB2B
        ? this.readProperty(source, 'technicianName') || this.readProperty(source, 'assignedTechnicianName')
        : this.readProperty(source, 'technician'),
      customerVoice: isB2B
        ? this.readProperty(source, 'customerVoice')
        : normalizedComplaints.map((item: any) => this.readProperty(item, 'customerVoice')).filter(Boolean).join('; '),
      complaints: normalizedComplaints
    };
  }

  private normalizeHistoryRow(row: any): any {
    return {
      jobCardNo: this.readProperty(row, 'jobCardNo') ?? this.readProperty(row, 'jobCardNumber'),
      jobCardDate: this.readProperty(row, 'jobCardDate') ?? this.readProperty(row, 'createdAt'),
      odometer: this.readProperty(row, 'vehicleJourney') ?? this.readProperty(row, 'odometerAtCheckIn'),
      observation: this.readProperty(row, 'observation') ?? this.readProperty(row, 'complaints'),
      remarks: this.readProperty(row, 'remarks') ?? this.readProperty(row, 'serviceHead')
    };
  }

  private failToLoad(message: string): void {
    this.loading = false;
    this.errorMessage = message;
    void Swal.fire('Unable to print FFIR', message, 'error').then(() => this.backToList());
  }
}
