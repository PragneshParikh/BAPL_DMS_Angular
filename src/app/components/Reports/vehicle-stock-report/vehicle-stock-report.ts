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

    ngOnInit(): void {

        this.loadReport();
    }

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
                        response.data;

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

    onSearch(): void {

        this.pageIndex = 1;

        this.loadReport();
    }

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

        this.pageIndex = 1;

        this.loadReport();
    }

    formatDate(date: any): string {

        if (!date) return '';

        return new Date(date)
            .toLocaleDateString('en-IN');
    }

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
            x.location,
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