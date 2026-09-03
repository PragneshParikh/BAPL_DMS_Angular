import {
    Component,
    OnInit
} from '@angular/core';
 
import {
    CommonModule
} from '@angular/common';
 
import {
    FormsModule,
    ReactiveFormsModule,
    FormBuilder,
    FormGroup
} from '@angular/forms';
 
import {
    ReportService
} from '../../../core/services/report.service';
 
import {
    VehicleStockReportViewModel
} from '../../../ViewModels/models/vehicle-stock-report.model';
import { MenuAccessService } from '../../../core/services/menu-access.service';
@Component({
    selector: 'app-vehicle-stock-report',
 
    standalone: true,
 
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule
    ],
 
    templateUrl:
        './vehicle-stock-report.html',
})
export class VehicleStockReportComponent
    implements OnInit {
        readonly SUBMENU_ID = 46;
        canDownload = false;
 
    filterForm: FormGroup;
 
    reportData:
        VehicleStockReportViewModel[] = [];
 
    dealerList: any[] = [];
 
    modelList: any[] = [];
 
    chassisList: string[] = [];
 
    // NEW — SuperAdmins can browse this report across every dealer, so they
    // keep the "Dealer Name" picker. Everyone else is always restricted
    // server-side to their own dealer's data now (see
    // ReportController.GetCurrentStockReport), so the picker can't actually
    // change what comes back — hide it and skip the dealer-list API call
    // entirely rather than show a control that does nothing.
    isSuperAdmin = false;
 
    // =====================================================
    // CHASSIS SEARCH SUGGESTIONS
    // Replaces the native <datalist> popup (unstyled, browser-rendered,
    // overlaps page content) with a custom app-styled dropdown rendered
    // directly below the search box. filteredChassisList is capped at 20
    // matches so it stays fast/readable even with a large chassisList.
    // =====================================================
    filteredChassisList: string[] = [];
    showChassisDropdown = false;
 
    private static readonly MAX_CHASSIS_SUGGESTIONS = 20;
 
    isLoading: boolean = false;
 
    // NEW — surfaced when loadReport() fails, so a broken request shows
    // something actionable instead of an indefinite "Loading..." with
    // nothing in the console for the user themselves to see.
    loadError: string | null = null;
 
    totalRecords: number = 0;
 
    pageIndex: number = 1;
 
    pageSize: number = 20;
 
get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalRecords / this.pageSize));
}
 
get pageStartRecord(): number {
    return this.totalRecords === 0 ? 0 : ((this.pageIndex - 1) * this.pageSize) + 1;
}
 
get pageEndRecord(): number {
    return Math.min(this.pageIndex * this.pageSize, this.totalRecords);
}
get pageNumbers(): number[] {
    const total = this.totalPages;
    const current = this.pageIndex;
    const windowSize = 5;
 
    let start = Math.max(1, current - Math.floor(windowSize / 2));
    let end = Math.min(total, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);
 
    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
}
    constructor(private fb: FormBuilder, private reportService: ReportService, private menuAccess: MenuAccessService) {
        // FIXED: this is the actual bug. filterForm must be built here (or at
        // the very top of ngOnInit, before any async call) so it's a real
        // FormGroup by the time the template's [formGroup]="filterForm" and
        // formControlName bindings run their first change-detection pass, and
        // before loadReport() ever reads `.value` off it.
        //
        // colorCode/isBilled have no UI control yet, but colorCode IS read
        // server-side (ReportRepo.GetCurrentStockReportAsync uses
        // filter.ColorCode), and onReset() already resets both — so both are
        // included here to match the filter model this component was clearly
        // meant to support.
        this.filterForm = this.fb.group({
            dealerCode: [''],
            modelCode: [''],
            colorCode: [''],
            chassisNo: [''],
            stockStatus: [''],
            isBilled: [false],
            fromDate: [null],
            toDate: [null]
        });
    }
 
    ngOnInit(): void {
    this.isSuperAdmin = this.checkIsSuperAdmin();
    this.canDownload = this.menuAccess.canDownload(this.SUBMENU_ID);
    this.loadDropdowns();
    this.loadReport();
    }
 
    /**
     * ASSUMPTION — I don't have this project's actual auth/token service, so
     * this reads the role the same flat way the Login API's JSON response
     * shape suggests it might be stored (`role` in localStorage). If this
     * app already keeps auth state in a shared AuthService/TokenService
     * instead, replace the body of this one method with a call into that
     * (e.g. `return this.authService.hasRole('SuperAdmin');`) — nothing else
     * in this component needs to change, since everything else here just
     * depends on `isSuperAdmin` being set correctly.
     *
     * NOTE — this is now duplicated in the D2D report and Vehicle Sale
     * Report components too. Worth pulling into one shared service/helper
     * once the real auth check is wired in, so it only needs fixing once.
     */
    private checkIsSuperAdmin(): boolean {
        const role = localStorage.getItem('role');
        return role === 'SuperAdmin';
    }
 
    // =====================================================
    // LOAD DROPDOWNS
    // =====================================================
 
    loadDropdowns(): void {
 
    // ============================================
    // DEALER LIST — SuperAdmin only (see isSuperAdmin above)
    // ============================================
 
    if (this.isSuperAdmin) {
        this.reportService
            .getDealerList()
            .subscribe({
 
                next: (response: any[]) => {
 
                    this.dealerList =
                        response.map(x => ({
 
                            dealerCode:
                                x.dealerCode,
 
                            dealerName:
                                x.dealerName
                        }));
                },
 
                error: (error) => {
 
                    console.error(error);
                }
            });
    }
 
    // ============================================
    // MODEL LIST
    // ============================================
 
    this.reportService
        .getModelList()
        .subscribe({
 
            next: (response: any[]) => {
 
                this.modelList =
                    response.map(x => ({
 
                        modelCode:
                            x.modelCode,
 
                        modelName:
                            x.modelName
                    }));
            },
 
            error: (error) => {
 
                console.error(error);
            }
        });
 
    // ============================================
    // CHASSIS LIST
    // ============================================
 
    this.reportService
        .getChassisList()
        .subscribe({
 
            next: (response: string[]) => {
 
                this.chassisList = response;
            },
 
            error: (error) => {
 
                console.error(error);
            }
        });
}
 
    // =====================================================
    // CHASSIS SEARCH — custom dropdown handlers
    // =====================================================
 
    onChassisInput(): void {
        this.updateChassisSuggestions();
    }
 
    onChassisFocus(): void {
        // Show suggestions immediately on focus too — an empty box shows
        // the first 20 chassis numbers rather than nothing, so the dropdown
        // isn't blank until the user starts typing.
        this.updateChassisSuggestions();
    }
 
    onChassisBlur(): void {
        // Delayed hide: a suggestion button's (mousedown) fires before this
        // blur completes, but not before a plain click would — the timeout
        // gives that handler a chance to run first instead of the dropdown
        // disappearing out from under the click.
        setTimeout(() => {
            this.showChassisDropdown = false;
        }, 150);
    }
 
    selectChassis(chassis: string): void {
        this.filterForm.patchValue({ chassisNo: chassis });
        this.showChassisDropdown = false;
    }
 
    private updateChassisSuggestions(): void {
        const text = (this.filterForm.get('chassisNo')?.value ?? '')
            .toString()
            .trim()
            .toUpperCase();
 
        const source = text
            ? this.chassisList.filter(c => c.toUpperCase().includes(text))
            : this.chassisList;
 
        this.filteredChassisList = source.slice(
            0,
            VehicleStockReportComponent.MAX_CHASSIS_SUGGESTIONS
        );
 
        this.showChassisDropdown = true;
    }
 
    // =====================================================
    // LOAD REPORT
    // =====================================================
 
    loadReport(): void {
 
        this.isLoading = true;
        this.loadError = null;
 
        // FIXED: wrapped in try/catch. Previously, if building `filter`
        // threw for any reason (as it did when filterForm was undefined),
        // the exception happened before .subscribe() ever ran — so neither
        // the next nor error callback (the only places that reset
        // isLoading) ever fired, and the page was stuck on "Loading..."
        // forever with no feedback. Now any such failure still clears
        // isLoading and surfaces a message instead of hanging silently.
        try {
            const filter = {
 
                ...this.filterForm.value,
 
                pageIndex: this.pageIndex,
 
                pageSize: this.pageSize
            };
 
            this.reportService
                .getVehicleStockReport(filter)
                .subscribe({
 
                    next: (response) => {
 
                    this.reportData =
                             response.data.map(
                                (x: any, index: number) => ({
 
                                    ...x,
 
                                    srNo:
                                        ((this.pageIndex - 1)
                                            * this.pageSize)
                                            + index + 1
                                })
 
                            );
 
                        this.totalRecords =
                            response.totalRecords;
 
                        this.isLoading = false;
                    },
 
                    error: (error) => {
 
                        console.error(error);
 
                        this.loadError = 'Failed to load the report. Please try again.';
                        this.isLoading = false;
                    }
                });
        } catch (error) {
            console.error(error);
            this.loadError = 'Failed to load the report. Please try again.';
            this.isLoading = false;
        }
    }
 
    // =====================================================
    // SEARCH
    // =====================================================
 
    onSearch(): void {
 
        this.pageIndex = 1;
 
        this.loadReport();
    }
 
    goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.pageIndex) return;
    this.pageIndex = page;
    this.loadReport();
}
 
previousPage(): void {
    this.goToPage(this.pageIndex - 1);
}
 
nextPage(): void {
    this.goToPage(this.pageIndex + 1);
}
    // =====================================================
    // RESET
    // =====================================================
 
    onReset(): void {
 
        this.filterForm.reset({
 
            dealerCode: '',
 
            modelCode: '',
 
            colorCode: '',
 
            chassisNo: '',
 
            stockStatus: '',
 
            isBilled: false,
 
            fromDate: null,
 
            toDate: null
        });
 
        this.modelList = [];
 
        this.filteredChassisList = [];
        this.showChassisDropdown = false;
 
        this.pageIndex = 1;
 
        this.loadReport();
    }
 
    // =====================================================
    // FORMAT DATE
    // =====================================================
 
    formatDate(date: any): string {
 
        if (!date)
            return '';
 
        return new Date(date)
            .toLocaleDateString('en-IN');
    }
 
    // =====================================================
    // EXPORT CSV
    // =====================================================
 
    exportToCSV(): void {
 
        const headers = [
 
            'SR NO',
            'DEALER CODE',
            'DEALER NAME',
            'MODEL CODE',
            'MODEL NAME',
            'OEM MODEL',
            'COLOR',
            'CHASSIS NO',
            'MOTOR NO',
            'BATTERY NO',
            'INVOICE NO',
            'DISPATCH DATE',
            'RECEIVE DATE',
            'STOCK STATUS',
            'VEHICLE STATUS',
            'LOCATION',
            'DAYS IN STOCK'
        ];
 
        const rows = this.reportData.map(x => [
 
            x.srNo,
            x.dealerCode,
            x.dealerName,
            x.modelCode,
            x.modelName,
            x.oemModelName,
            x.colorName,
            x.chassisNo,
            x.motorNo,
            x.batteryNo,
            x.invoiceNo,
            this.formatDate(x.dispatchDate),
            this.formatDate(x.receiveDate),
            x.stockStatus,
            x.vehicleStatus,
            x.currentLocation,
            x.daysInStock
        ]);
 
        const csvContent = [
            headers,
            ...rows
        ]
            .map(e => e.join(','))
            .join('\n');
 
        const blob = new Blob(
            [csvContent],
            {
                type:
                    'text/csv;charset=utf-8;'
            }
        );
 
        const link =
            document.createElement('a');
 
        const url =
            URL.createObjectURL(blob);
 
        link.setAttribute('href', url);
 
        link.setAttribute(
            'download',
            'vehicle-stock-report.csv'
        );
 
        link.click();
    }
}