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

    filterForm!: FormGroup;

    reportData:
        VehicleStockReportViewModel[] = [];

    dealerList: any[] = [];

    modelList: any[] = [];

    chassisList: string[] = [];

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

    totalRecords: number = 0;

    pageIndex: number = 1;

    pageSize: number = 20;

    constructor(
        private fb: FormBuilder,
        private reportService: ReportService
    ) {

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

    // =====================================================
    // INIT
    // =====================================================

    ngOnInit(): void {

        this.loadDropdowns();

        this.loadReport();
    }

    // =====================================================
    // LOAD DROPDOWNS
    // =====================================================

    loadDropdowns(): void {

    // ============================================
    // DEALER LIST
    // ============================================

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

                    this.isLoading = false;
                }
            });
    }

    // =====================================================
    // SEARCH
    // =====================================================

    onSearch(): void {

        this.pageIndex = 1;

        this.loadReport();
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