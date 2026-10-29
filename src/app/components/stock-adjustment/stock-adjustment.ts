import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { NgSelectModule } from '@ng-select/ng-select';
import { ItemMasterService } from '../../core/services/item-master-service';
import { LocationMasterService } from '../../core/services/location-master-service';
import { LoaderService } from '../../core/services/loader';
import { PrefixService } from '../../core/services/prefix';
import { StorageService } from '../../core/services/storage';
import { SharedModule } from '../../shared/shared.module';
import { ToastService } from '../../shared/toaster/toast-service';
import { ReportService } from '../../core/services/report.service';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { ViewChild, ElementRef } from '@angular/core';
import * as XLSX from 'xlsx';

interface PartBalanceStock {
  partNo: string;
  description: string;
  rateStock: number | null;
  currentStock: number | null;
}
interface StockAdjustmentItem {
  partNo: string;
  description: string;
  rateStock: number | null;
  currentStock: number;
  updateStock: number;
  upQty: number;
  finalQty: number;
  stg: number;
  remarks: string;
}

@Component({
  selector: 'app-stock-adjustment',
  standalone: true,
  imports: [SharedModule, FormsModule, CommonModule, NgSelectModule],
  templateUrl: './stock-adjustment.html',
  styleUrl: './stock-adjustment.scss'
})
export class StockAdjustment implements OnInit, OnDestroy {

  @ViewChild('excelFile')
  excelFile!: ElementRef;
  readonly SUBMENU_ID = 29;

  dealerCode = '';
  isAdmin = false;
  isSuperAdmin = false;
  serialNo = 0;

  fromDate = '';
  prefixNo = '';
  selectedLocation = 'ALL';
  lstLocations: any[] = [];
  isLoadingLocations = false;
  locationError = '';

  partNo = '';
  selectedPart: PartBalanceStock | null = null;
  description = '';
  rateStock: number | null = null;
  currentQty: number | null = null;
  updateQty: number | null = null;
  upQty: number | null = null;
  stg: number | null = null;
  finalQty: number | null = null;
  remarks = '';

  stockAdjustmentList: StockAdjustmentItem[] = [];
  editingIndex: number | null = null;
  partOptions: PartBalanceStock[] = [];
  isLoadingParts = false;
  partSearchError = '';
  isEditMode = false;
  editId = 0;

  private readonly partCache = new Map<string, PartBalanceStock[]>();
  private partRequest?: Subscription;
  private partRequestDealerCode = '';
  private prefixRequest?: Subscription;
  private stockRefreshRequest?: Subscription;
  private sessionDealerCode = '';

  constructor(
    private loader: LoaderService,
    private toast: ToastService,
    private storageService: StorageService,
    private locationMasterService: LocationMasterService,
    private itemMasterService: ItemMasterService,
    private prefixService: PrefixService,
    private reportService: ReportService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.queryParamMap.get('id');
    console.log('Query Param ID:', id);
    if (id) {
      this.loadEditData(+id);
    } else {
      this.fromDate = this.formatDateForInput(new Date());
    }
    const role = this.storageService
      .getRole()
      .trim()
      .toLowerCase()
      .replace(/[\s_-]/g, '');
    this.isAdmin = role === 'admin' || role === 'superadmin';
    this.isSuperAdmin = role === 'superadmin';
    this.sessionDealerCode = this.storageService.getDealerCode();
    this.dealerCode = this.sessionDealerCode;
    //this.loadPrefixNumber();
    this.prefixNo = 'SA/487/26-27/';
    this.loadWorkShopLocations();
    if (this.dealerCode) {
      this.loadPartOptions(this.dealerCode);
    }
  }

  ngOnDestroy(): void {
    this.partRequest?.unsubscribe();
    this.prefixRequest?.unsubscribe();
    this.stockRefreshRequest?.unsubscribe();
  }
  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  loadWorkShopLocations(): void {
    this.isLoadingLocations = true;
    this.locationError = '';
    this.loader.show();
    const locationRequest = this.isAdmin
      ? this.locationMasterService.getAllLocationMaster()
      : this.locationMasterService.getLocationByDealerCode(this.dealerCode);

    locationRequest
      .subscribe({
        next: (res: any) => {
          const responseLocations = Array.isArray(res) ? res : res?.data;
          if (!Array.isArray(responseLocations)) {
            this.isLoadingLocations = false;
            this.loader.hide();
            console.error('Unexpected location response.', res);
            this.locationError = 'Unable to read the location list.';
            this.toast.show(this.locationError, {
              classname: 'bg-danger text-light',
              delay: 5000
            });
            return;
          }
          console.log('Location API Response', res);
          this.lstLocations = this.getActiveLocations(responseLocations);
          this.isLoadingLocations = false;
          this.loader.hide();
        },
        error: (err: any) => {
          this.isLoadingLocations = false;
          this.loader.hide();
          console.error(err);
          this.locationError = 'Unable to load locations.';
          this.toast.show('Unable to load locations.', {
            classname: 'bg-danger text-light',
            delay: 5000
          });
        }
      });
  }

  private getActiveLocations(locations: any[]): any[] {
    const dealerCode = this.dealerCode.trim().toLowerCase();
    const seenLocationIds = new Set<string>();
    const seenLocationCodes = new Set<string>();
    const seenUnidentifiedLocationNames = new Set<string>();
    return locations.filter(location => {
      if (!location || typeof location !== 'object') {
        return false;
      }

      const active =
        location?.active ??
        location?.Active ??
        location?.isActive ??
        location?.IsActive ??
        location?.estatus ??
        location?.Estatus;
      if (
        active != null &&
        !['y', 'yes', 'true', '1', 'active'].includes(
          String(active).trim().toLowerCase()
        )
      ) {
        return false;
      }

      const locationDealerCode = String(
        location?.dealerCode ?? location?.dealercode ?? location?.DealerCode ?? ''
      ).trim().toLowerCase();
      if (!this.isAdmin && locationDealerCode && locationDealerCode !== dealerCode) {
        return false;
      }

      const locationId = String(
        location?.locationId ??
        location?.LocationId ??
        location?.locId ??
        location?.LocId ??
        location?.locid ??
        location?.id ??
        ''
      ).trim().toLowerCase();
      const code = this.getLocationCode(location).toLowerCase();
      const hasReliableIdentifier = Boolean(locationId || code);
      if (
        (locationId && seenLocationIds.has(locationId)) ||
        (code && seenLocationCodes.has(code))
      ) {
        return false;
      }
      if (locationId) {
        seenLocationIds.add(locationId);
      }
      if (code) {
        seenLocationCodes.add(code);
      }

      if (!hasReliableIdentifier) {
        const normalizedName = this.getLocationName(location)
          .trim()
          .replace(/\s+/g, ' ')
          .toLowerCase();
        if (normalizedName && seenUnidentifiedLocationNames.has(normalizedName)) {
          return false;
        }
        if (normalizedName) {
          seenUnidentifiedLocationNames.add(normalizedName);
        }
      }

      return true;
    });
  }

  onChangeLocation(event: Event): void {
    const locCode = (event.target as HTMLSelectElement).value;

    this.selectedLocation = locCode;

    this.clearItemFields();
    this.stockAdjustmentList = [];

    this.partSearchError = '';

    this.partCache.clear();

    this.loadPrefixNumber(this.getPrefixDealerCode(locCode));

    if (this.dealerCode) {
      this.loadPartOptions(this.dealerCode);
    }
  }

  getLocationCode(location: any): string {
    return String(
      location?.loccode ??
      location?.locCode ??
      location?.Loccode ??
      location?.locationCode ??
      location?.LocationCode ??
      ''
    ).trim();
  }

  private getLocationName(location: any): string {
    return String(
      location?.locname ??
      location?.locName ??
      location?.LocationName ??
      location?.locationName ??
      ''
    );
  }

  private getPrefixDealerCode(locationCode = 'ALL'): string {
    if (locationCode === 'ALL' || !locationCode) {
      return this.sessionDealerCode.trim();
    }

    const location = this.lstLocations.find(
      item => this.getLocationCode(item).toLowerCase() === locationCode.toLowerCase()
    );
    return String(
      location?.dealerCode ??
      location?.dealercode ??
      location?.DealerCode ??
      this.sessionDealerCode
    ).trim();
  }

  private loadPrefixNumber(dealerCode = this.sessionDealerCode): void {
    this.prefixRequest?.unsubscribe();
    this.prefixNo = '';
    const prefixDealerCode = dealerCode.trim();
    if (!prefixDealerCode) {
      this.showMissingPrefixConfiguration();
      return;
    }

    this.prefixRequest = this.prefixService
      .getPrefixByDealerByModule(prefixDealerCode, 'stock_adjustment')
      .subscribe({
        next: response => {
          const generatedNumber = this.readGeneratedPrefix(response);
          if (!generatedNumber) {
            this.showMissingPrefixConfiguration();
            return;
          }
          const parts = generatedNumber.split('/');

          this.prefixNo = parts.slice(0, 3).join('/') + '/';

          this.serialNo = Number(parts[3] || 0);
          console.log('PREFIX NO =>', this.prefixNo);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Unable to load Stock Adjustment prefix.', error);
          if (error.status === 404) {
            this.showMissingPrefixConfiguration();
            return;
          }
          this.toast.show(
            'Unable to load the Stock Adjustment document number.',
            { classname: 'bg-danger text-light', delay: 5000 }
          );
        }
      });
  }

  private readGeneratedPrefix(response: unknown): string {
    let parsedResponse: unknown = response;
    if (typeof response === 'string') {
      const value = response.trim();
      if (!value) {
        return '';
      }
      if (!value.startsWith('{') && !value.startsWith('"')) {
        return value;
      }
      try {
        parsedResponse = JSON.parse(value) as unknown;
      } catch (error) {
        console.error('Unable to parse Stock Adjustment prefix response.', error);
        return '';
      }
    }

    if (typeof parsedResponse === 'string') {
      return parsedResponse.trim();
    }
    if (typeof parsedResponse !== 'object' || parsedResponse === null) {
      return '';
    }

    const result = parsedResponse as Record<string, unknown>;
    const generatedNumber =
      result['generatedNumber'] ??
      result['GeneratedNumber'] ??
      result['generatednumber'] ??
      result['prefixNo'] ??
      result['PrefixNo'] ??
      result['prefix'] ??
      result['Prefix'] ??
      result['prefixValue'] ??
      result['PrefixValue'] ??
      result['documentNo'] ??
      result['DocumentNo'] ??
      result['sequenceCode'] ??
      result['SequenceCode'];
    return typeof generatedNumber === 'string' ? generatedNumber.trim() : '';
  }

  private showMissingPrefixConfiguration(): void {
    this.toast.show(
      'Stock Adjustment Number Sequence Configuration is not available for this dealer.',
      { classname: 'bg-warning text-dark', delay: 5000 }
    );
  }

  onDateRangeChange(): void {
    // The selected adjustment date is stored in fromDate.
  }

  onPartNoFocus(): void {
    if (this.dealerCode) {
      this.loadPartOptions(this.dealerCode);
    } else {
      this.partSearchError = 'Unable to identify the logged-in dealer.';
    }
  }

  retryPartSearch(): void {
    if (this.dealerCode) {
      this.partSearchError = '';
      this.loadPartOptions(this.dealerCode);
    }
  }

  customSearchFn(term: string, part: PartBalanceStock): boolean {
    const search = term.trim().toLowerCase();
    return part.partNo.toLowerCase().includes(search);
  }


  selectPart(part: PartBalanceStock | null): void {
    this.selectedPart = part;
    if (!part) {
      this.partNo = '';
      this.description = '';
      this.rateStock = null;
      this.currentQty = null;
      this.updateQty = null;
      this.upQty = null;
      this.stg = null;
      this.finalQty = null;
      return;
    }

    this.partNo = part.partNo;
    this.description = part.description;
    this.rateStock = part.rateStock;
    this.currentQty = part.currentStock ?? 0;
    this.updateQty = null;
    this.upQty = null;
    this.stg = null;
    this.finalQty = null;
    this.refreshSelectedPartStock(part.partNo);
  }
  private refreshSelectedPartStock(partNo: string): void {
    if (!this.dealerCode) {
      return;
    }
    
    this.stockRefreshRequest?.unsubscribe();
    this.stockRefreshRequest = this.reportService
      .getPartBalanceStockForAdjustment(
        this.dealerCode,
        this.selectedLocation
      )

      .subscribe({
        next: (response: unknown) => {
          let latestParts: PartBalanceStock[];
          try {
            latestParts = this.normalizePartResponse(response);
          } catch (error) {
            console.error('Invalid refreshed part-balance response.', error);
            this.toast.show('Unable to refresh stock for the selected part.', {
              classname: 'bg-danger text-light',
              delay: 5000
            });
            return;
          }

          this.partCache.set(this.dealerCode, latestParts);
          this.partOptions = latestParts;

          if (this.selectedPart?.partNo.toLowerCase() !== partNo.toLowerCase()) {
            return;
          }

          const latestPart = latestParts.find(
            item => item.partNo.toLowerCase() === partNo.toLowerCase()
          );
          if (!latestPart) {
            this.toast.show('Latest stock for the selected part was not found.', {
              classname: 'bg-danger text-light',
              delay: 5000
            });
            return;
          }

          const latestRate = latestPart.rateStock ?? this.rateStock;
          this.selectedPart = { ...latestPart, rateStock: latestRate };
          this.description = latestPart.description;
          this.rateStock = latestRate;
          this.currentQty = latestPart.currentStock ?? 0;
          this.onUpdateStockChange(this.updateQty);
        },
        error: (error: unknown) => {
          console.error('Unable to refresh selected part stock.', error);
          this.toast.show('Unable to refresh stock for the selected part.', {
            classname: 'bg-danger text-light',
            delay: 5000
          });
        }
      });
  }

  onUpdateStockChange(value: number | null): void {
    this.updateQty =
      typeof value === 'number' && Number.isFinite(value) ? value : null;
    this.upQty =
      this.updateQty !== null && this.currentQty !== null
        ? this.updateQty - this.currentQty
        : null;
    this.stg =
      this.upQty !== null && this.currentQty !== null
        ? this.upQty
        : null;

    this.finalQty =
      this.stg !== null && this.currentQty !== null
        ? this.currentQty + this.stg
        : null;
  }

  onCurrentStockChange(value: number | null): void {
    this.currentQty =
      typeof value === 'number' && Number.isFinite(value) ? value : null;
    this.onUpdateStockChange(this.updateQty);
  }

  addStockAdjustmentItem(): void {
    if (!this.partNo.trim() || !this.description.trim()) {
      this.showValidation('Please select a Part No. from the search results.');
      return;
    }

    if (this.currentQty === null || !Number.isFinite(this.currentQty)) {
      this.showValidation('Current stock is not available for this part.');
      return;
    }

    if (this.updateQty === null || !Number.isFinite(this.updateQty)) {
      this.showValidation('Please enter a valid Update Stock value.');
      return;
    }

    const exists = this.stockAdjustmentList.some(
      (item, index) =>
        index !== this.editingIndex &&
        item.partNo.toLowerCase() === this.partNo.trim().toLowerCase()
    );
    if (exists) {
      this.showValidation('This part is already added.');
      return;
    }

    const item: StockAdjustmentItem = {
      partNo: this.partNo.trim(),
      description: this.description.trim(),
      rateStock: this.rateStock,
      currentStock: this.currentQty,
      updateStock: this.updateQty,
      upQty: this.upQty ?? 0,
      stg: this.stg ?? 0,
      finalQty: this.finalQty ?? this.currentQty,
      remarks: this.remarks.trim()
    };

    if (this.editingIndex === null) {
      this.stockAdjustmentList.push(item);
    } else {
      this.stockAdjustmentList[this.editingIndex] = item;
    }

    this.clearItemFields();
  }

  editStockAdjustmentItem(index: number): void {
    const item = this.stockAdjustmentList[index];
    if (!item) {
      return;
    }

    this.editingIndex = index;
    this.selectedPart =
      this.partOptions.find(part => part.partNo === item.partNo) ?? {
        partNo: item.partNo,
        description: item.description,
        rateStock: item.rateStock,
        currentStock: item.currentStock
      };
    this.partNo = item.partNo;
    this.description = item.description;
    this.rateStock = item.rateStock;
    this.currentQty = item.currentStock;
    this.updateQty = item.updateStock;
    this.upQty = item.upQty;
    this.stg = item.stg;
    this.finalQty = item.finalQty;
    this.remarks = item.remarks;
  }

  removeStockAdjustmentItem(index: number): void {
    this.stockAdjustmentList.splice(index, 1);
    if (this.editingIndex === index) {
      this.clearItemFields();
    } else if (this.editingIndex !== null && this.editingIndex > index) {
      this.editingIndex -= 1;
    }
  }

  saveStockAdjustment(): void {
    if (!this.fromDate) {
      this.showValidation('Please select adjustment date.');
      return;
    }

    if (!this.selectedLocation || this.selectedLocation === 'ALL') {
      this.showValidation('Please select a specific location.');
      return;
    }

    if (this.stockAdjustmentList.length === 0) {
      this.showValidation('Please add at least one item.');
      return;
    }

    this.stockRefreshRequest?.unsubscribe();
    this.loader.show();
    this.stockRefreshRequest = this.reportService
      .getPartBalanceStockForAdjustment(
        this.dealerCode,
        this.selectedLocation

      )
      .subscribe({
        next: (response: unknown) => {
          let latestParts: PartBalanceStock[];
          try {
            latestParts = this.normalizePartResponse(response);
          } catch (error) {
            this.loader.hide();
            console.error('Invalid refreshed part-balance response.', error);
            this.toast.show('Unable to refresh current stock before saving.', {
              classname: 'bg-danger text-light',
              delay: 5000
            });
            return;
          }

          const latestPartsByNumber = new Map(
            latestParts.map(part => [part.partNo.toLowerCase(), part])
          );
          const refreshedItems: StockAdjustmentItem[] = [];
          for (const item of this.stockAdjustmentList) {
            const latestPart = latestPartsByNumber.get(item.partNo.toLowerCase());
            if (!latestPart) {
              this.loader.hide();
              this.toast.show(
                `Unable to refresh stock for part '${item.partNo}'. Please review the item list.`,
                { classname: 'bg-danger text-light', delay: 5000 }
              );
              return;
            }

            const currentStock = latestPart.currentStock ?? 0;
            const adjustmentQty = item.updateStock - currentStock;
            refreshedItems.push({
              ...item,
              description: latestPart.description || item.description,
              rateStock: latestPart.rateStock ?? item.rateStock,
              currentStock,
              upQty: adjustmentQty,
              stg: adjustmentQty,
              finalQty: item.updateStock
            });
          }

          this.stockAdjustmentList = refreshedItems;
          this.submitStockAdjustment();
        },
        error: (error: unknown) => {
          this.loader.hide();
          console.error('Unable to refresh stock before saving.', error);
          this.toast.show('Unable to refresh current stock before saving.', {
            classname: 'bg-danger text-light',
            delay: 5000
          });
        }
      });
  }

  private submitStockAdjustment(): void {
    debugger;
    console.log('====================');
    console.log('isEditMode =>', this.isEditMode);
    console.log('editId =>', this.editId);
    console.log('selectedLocation =>', this.selectedLocation);
    console.log('dealerCode =>', this.dealerCode);
    console.log('stockAdjustmentList =>', this.stockAdjustmentList);
    const payload = {
      id: this.isEditMode ? this.editId : null,
      adjustmentDate: this.fromDate,
      locationCode: this.selectedLocation,
      dealerCode: this.dealerCode,
      remarks: this.remarks,
      items: this.stockAdjustmentList.map(item => ({
        partNo: item.partNo,
        description: item.description,
        currentStock: item.currentStock,
        finalStock: item.finalQty,
        updateQty: item.updateStock,
        stockAdjustmentQty: item.stg,
        updateStock: item.updateStock,
        upQuantityStg: item.stg,
        finalQty: item.finalQty
      }))
    };
    console.log('FINAL PAYLOAD =>', payload);
    console.log('PAYLOAD ID =>', payload.id);
    console.log('====================');

    this.reportService.saveStockAdjustment(payload).subscribe({
      next: (res: any) => {
        this.loader.hide();

        this.toast.show(
          `Stock Adjustment Saved Successfully. Ref No : ${res?.prefixNo ?? ''}`,
          {
            classname: 'bg-success text-light',
            delay: 5000
          }
        );

        this.stockAdjustmentList = [];
        this.clearItemFields();
        this.remarks = '';
      },
      error: (err: any) => {
        this.loader.hide();
        console.error('Unable to save Stock Adjustment.', err);
        this.toast.show(
          err?.error?.message ?? 'Unable to save Stock Adjustment.',
          {
            classname: 'bg-danger text-light',
            delay: 5000
          }
        );
      }
    });
  }

  clearItemFields(): void {
    this.partNo = '';
    this.selectedPart = null;
    this.description = '';
    this.rateStock = null;
    this.currentQty = null;
    this.updateQty = null;
    this.upQty = null;
    this.stg = null;
    this.finalQty = null;
    this.partSearchError = '';
    this.editingIndex = null;
  }

  cancelStockAdjustment(): void {
    this.clearItemFields();
    this.remarks = '';
    this.stockAdjustmentList = [];
    this.selectedLocation = 'ALL';
  }

  private loadPartOptions(dealerCode: string): void {
    const cachedOptions = this.partCache.get(dealerCode);
    if (cachedOptions) {
      this.partOptions = cachedOptions;
      return;
    }

    if (this.isLoadingParts && this.partRequestDealerCode === dealerCode) {
      return;
    }

    this.partRequest?.unsubscribe();
    this.isLoadingParts = true;
    this.partRequestDealerCode = dealerCode;
    this.partSearchError = '';
    this.partRequest = this.reportService
      .getPartBalanceStockForAdjustment(dealerCode, this.selectedLocation)
      .subscribe({
        next: (response: unknown) => {
          try {
            const options = this.normalizePartResponse(response);
            this.partCache.set(dealerCode, options);
            if (dealerCode === this.dealerCode) {
              this.partOptions = options;
            }
          } catch (error) {
            console.error('Invalid part-balance response.', error);
            if (dealerCode === this.dealerCode) {
              this.partSearchError =
                'The part stock response could not be read. Please contact support.';
              this.toast.show(this.partSearchError, {
                classname: 'bg-danger text-light',
                delay: 5000
              });
            }
          } finally {
            if (this.partRequestDealerCode === dealerCode) {
              this.isLoadingParts = false;
              this.partRequestDealerCode = '';
            }
          }
        },
        error: (error: unknown) => {
          console.error('Unable to load part balance stock.', error);
          if (dealerCode === this.dealerCode) {
            this.partSearchError =
              'Unable to load part numbers. Please try again.';
            this.toast.show(this.partSearchError, {
              classname: 'bg-danger text-light',
              delay: 5000
            });
          }
          if (this.partRequestDealerCode === dealerCode) {
            this.isLoadingParts = false;
            this.partRequestDealerCode = '';
          }
        }
      });
  }

  private normalizePartResponse(response: unknown): PartBalanceStock[] {
    const records = this.findPartRecords(response);
    const parts = records
      .filter((record): record is Record<string, unknown> =>
        typeof record === 'object' && record !== null && !Array.isArray(record)
      )
      .map(record => {
        const partNo = this.readStringField(record, [
          'partno',
          'partnumber',
          'partcode',
          'itemcode'
        ]);
        if (!partNo) {
          return null;
        }

        return {
          partNo,
          description:
            this.readStringField(record, [
              'description',
              'partdescription',
              'itemdescription',
              'itemdesc'
            ]) ?? '',
          rateStock: this.readNumberField(record, [
            'custprice',
            'salerate',
            'listprice',
            'partrate',
            'dlrprice',
            'itemrate',
            'rate',
            'ratestock'
          ]),
          currentStock: this.readNumberField(record, [
            'currentstock',
            'currentqty',
            'availablestock',
            'balancestock',
            'batchclosingqty',
            'availableqty',
            'availablequantity',
            'balanceqty',
            'stock',
            'stockqty',
            'quantity',
            'qty',
            'closingqty',
            'closingstock'
          ]) ?? 0
        };
      })
      .filter((part): part is PartBalanceStock => part !== null);

    if (records.length && !parts.length) {
      throw new Error('Part numbers were not present in the response.');
    }
    return parts;
  }

  private findPartRecords(value: unknown): unknown[] {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value !== 'object' || value === null) {
      throw new Error('Expected a list of part stock records.');
    }

    const envelope = value as Record<string, unknown>;
    for (const key of ['data', 'result', 'items', 'parts', 'records']) {
      const nested = this.readField(envelope, [key]);
      if (Array.isArray(nested)) {
        return nested;
      }
      if (nested && typeof nested === 'object') {
        return this.findPartRecords(nested);
      }
    }
    throw new Error('Expected a list of part stock records.');
  }

  private readStringField(
    record: Record<string, unknown>,
    fieldNames: string[]
  ): string | null {
    const value = this.readField(record, fieldNames);
    if (typeof value === 'string' || typeof value === 'number') {
      const text = String(value).trim();
      return text || null;
    }
    return null;
  }

  private readNumberField(
    record: Record<string, unknown>,
    fieldNames: string[]
  ): number | null {
    const value = this.readField(record, fieldNames);
    if (typeof value !== 'number' && typeof value !== 'string') {
      return null;
    }
    if (typeof value === 'string' && !value.trim()) {
      return null;
    }
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  private readField(
    record: Record<string, unknown>,
    fieldNames: string[]
  ): unknown {
    const fields = new Map(
      Object.entries(record).map(([key, value]) => [
        key.toLowerCase().replace(/[^a-z0-9]/g, ''),
        value
      ])
    );
    for (const fieldName of fieldNames) {
      const key = fieldName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (fields.has(key)) {
        return fields.get(key);
      }
    }
    return undefined;
  }

  loadEditData(id: number): void {


    this.isEditMode = true;
    this.editId = id;

    this.reportService
      .getStockAdjustmentById(id)
      .subscribe({

        next: (res: any) => {
          debugger
          console.log('EDIT RESPONSE', res);

          this.fromDate = this.formatDateForInput(
            new Date(res.adjustmentDate)
          );

          this.selectedLocation = res.locationCode;
          this.prefixNo = (res.prefixNo ?? '')
            .split('0')
            .slice(0, 1)
            .join('/');

          this.serialNo = Number(
            (res.prefixNo ?? '').split('/').pop()
          );
          this.remarks = res.remarks ?? '';
          const details = res.items ?? [];
          this.stockAdjustmentList = details.map((x: any) => {
            const partMaster = this.partOptions.find(
              p => p.partNo?.toLowerCase() === x.partNo?.toLowerCase()
            );

            const currentStock =
              x.currentStock ??
              partMaster?.currentStock ??
              0;

            const updateStock = Number(
              x.updateStock ??
              x.finalStock ??
              0
            );

            const diff = updateStock - currentStock;

            return {
              partNo: x.partNo,
              description:
                x.description ??
                partMaster?.description ??
                '',
              rateStock:
                x.rateStock ??
                partMaster?.rateStock ??
                0,
              currentStock: currentStock,
              updateStock: updateStock,
              upQty: diff,
              stg: diff,
              finalQty: updateStock,
              remarks: x.remarks ?? ''
            };
          });

          console.log('STOCK LIST =>', this.stockAdjustmentList);

          if (this.stockAdjustmentList.length > 0) {

            const first = this.stockAdjustmentList[0];

            this.partNo = first.partNo;
            this.description = first.description;
            this.rateStock = first.rateStock;
            this.currentQty = first.currentStock;
            this.updateQty = first.updateStock;
            this.upQty = first.upQty;
            this.stg = first.stg;
            this.finalQty = first.finalQty;

            // IMPORTANT
            this.selectedPart = {
              partNo: first.partNo,
              description: first.description,
              rateStock: first.rateStock,
              currentStock: first.currentStock
            };

            this.editingIndex = 0;
          }

        },

        error: (err: any) => {
          console.error(err);
        }

      });
  }

  importExcel(event: any): void {
    debugger;
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    this.reportService
      .importStockAdjustmentExcel(file)
      .subscribe({
        next: (res: any) => {

          console.log('IMPORT RESPONSE', res);
          debugger;
          this.stockAdjustmentList =
            (res ?? []).map((x: any) => ({

              partNo: x.partNo,
              description: x.description,
              rateStock: x.rateStock,

              currentStock: x.currentStock,
              updateStock: x.updateStock,

              upQty: x.upQuantityStg,
              stg: x.upQuantityStg,

              finalQty: x.finalQty,

              remarks: ''
            }));

        },

        error: (err) => {
          console.log(err);
          alert(JSON.stringify(err.error));

          this.toast.show(
            'Excel Import Failed',
            {
              classname: 'bg-danger text-light',
              delay: 5000
            }
          );
        }
      });
  }

  downloadExcel(): void {

    this.reportService
      .exportStockAdjustmentExcel(
        this.fromDate,
        this.fromDate,
        this.selectedLocation
      )
      .subscribe({
        next: (blob: Blob) => {

          const file = new Blob(
            [blob],
            {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }
          );

          const url = window.URL.createObjectURL(file);

          const a = document.createElement('a');
          a.href = url;
          a.download = 'StockAdjustment.xlsx';

          document.body.appendChild(a);
          a.click();

          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          console.error(err);

          this.toast.show(
            'Unable to download Excel.',
            {
              classname: 'bg-danger text-light',
              delay: 5000
            }
          );
        }
      });
  }
  openReportList(): void {

    this.router.navigate(
      ['/stock-bill-list']
    );

  }
  exportGridToExcel(): void {

    const excelData = this.stockAdjustmentList.map((item, index) => ({

      'Sr No': index + 1,
      'Part No': item.partNo,
      'rate': item.rateStock,
      'Current Stock': item.currentStock,
      'Update Stock': item.updateStock,
    }));

    const worksheet = XLSX.utils.json_to_sheet(
      excelData.length > 0
        ? excelData
        : [{
          'Sr No': '',
          'Part No': '',
          'Rate': '',
          'Current Stock': '',
          'Update Stock': '',

        }]
    );

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'Stock Adjustment'
    );

    XLSX.writeFile(
      workbook,
      'StockAdjustment.xlsx'
    );
  }

  private showValidation(message: string): void {
    this.toast.show(message, {
      classname: 'bg-warning text-dark',
      delay: 4000
    });
  }
}
