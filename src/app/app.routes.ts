import { Routes } from '@angular/router';
import { LayoutComponent } from './layouts/layout.component';
import { DealerMaster } from './components/dealer-master/dealer-master';
import { DealerAccountMaster } from './components/dealer-account-master/dealer-account-master';
import { DealerMasterBulkDataDipatch } from './components/dealer-master-bulk-data-dipatch/dealer-master-bulk-data-dipatch';
import { LocationMasterComponent } from './components/location-master/location-master';
import { BatteryCapacityMaster } from './components/battery-capacity-master/battery-capacity-master';
import { Form22master } from './components/Showroom/form22master/form22master';
import { ItemMaster } from './components/Workshop/item-master/item-master';
import { ItemmasterFG } from './components/Showroom/itemmaster-fg/itemmaster-fg';
import { OemmodelMasterComponent } from './components/oemmodel-master/oemmodel-master';
import { AuthGuard } from './core/guards/auth.guard';
import { TaxCodeMasterComponent } from './components/taxcode-master/taxcode-master';
import { HsnCodeMaster } from './components/hsn-code-master/hsn-code-master';
import { Hsnwisetaxcode } from './components/hsnwisetaxcode/hsnwisetaxcode';
import { AgreegateTaxCodeMaster } from './components/agreegate-tax-code-master/agreegate-tax-code-master';
import { Lotinspection } from './components/lotinspection/lotinspection';
import { LotInspectionDetails } from './components/lotinspection/lot-inspection-details/lot-inspection-details/lot-inspection-details';
import { ReceiptEntry } from './components/receipt-entry/receipt-entry';
import { AddReceiptEntry } from './components/receipt-entry/add-receipt-entry/add-receipt-entry';
import { JobCard } from './components/job-card/job-card';
import { VehiclePO } from './components/vehicle-po/vehicle-po';
import { VehiclePoList } from './components/vehicle-po-list/vehicle-po-list';
import { JobCardAddForm } from './components/job-card/job-card-addForm/job-card-add-form/job-card-add-form';
import { AddVehicleSaleBill } from './components/vehicle-sale-bill/add-vehicle-sale-bill/add-vehicle-sale-bill';
import { PartsPoList } from './components/parts-po-list/parts-po-list';
import { PartsPo } from './components/parts-po/parts-po';
import { VehicleSaleBill } from './components/vehicle-sale-bill/vehicle-sale-bill';
import { OemmodelWarranty } from './components/oemmodel-warranty/oemmodel-warranty';
import { AddOemmodelWarranty } from './components/oemmodel-warranty/add-oemmodel-warranty/add-oemmodel-warranty';
import { CityMaster } from './components/city-master/city-master';
import { AddCityMaster } from './components/city-master/add-city-master/add-city-master';
import { ModelwiseServiceSchedule } from './components/modelwise-service-schedule/modelwise-service-schedule';
import { PdiChecklistmaster } from './components/pdi-checklistmaster/pdi-checklistmaster';
import { PerformaInvoice } from './components/Reports/performa-invoice/performa-invoice';
import { ProformaInvoice } from './components/proforma-invoice/proforma-invoice';
import { Form22Certificate } from './components/Reports/form22-certificate/form22-certificate';
import { DeliveryChecklist } from './components/Reports/delivery-checklist/delivery-checklist';
import { DeliverySlip } from './components/Reports/delivery-slip/delivery-slip';
import { SaleLetter } from './components/Reports/sale-letter/sale-letter';
import { WorkInProgress } from './components/work-in-progress/work-in-progress';
import { EmployeeMasterComponent } from './components/employee-master/employee-master';
import { Ffirlisting } from './components/ffir/ffirlisting/ffirlisting';
import { FFIR } from './components/ffir/ffir';
import { HSRPOrder } from './components/hsrp-order/hsrp-order';
import { HSRPOrderList } from './components/hsrp-order/hsrporder-list/hsrporder-list';
import { HsrpInward } from './components/hsrp-order/hsrp-inward/hsrp-inward';


export const routes: Routes = [
      { path: 'login', loadComponent: () => import('./components/account/login/login').then(m => m.Login) },
      { path: 'forgot-password', loadComponent: () => import('./components/account/forgot-password/forgot-password').then(m => m.ForgotPassword) },
      { path: 'reset-password', loadComponent: () => import('./components/account/reset-password/reset-password').then(m => m.ResetPassword) },
      {
            path: '', component: LayoutComponent,
            canActivateChild: [AuthGuard],
            children: [
                  { path: 'color', data: [2], loadComponent: () => import('./components/color/color').then(m => m.Color) },
                  { path: 'location-master', data: [3], component: LocationMasterComponent },
                  { path: 'dealer-master', data: [4], component: DealerMaster },
                  { path: 'dealer-account-master', data: [4], component: DealerAccountMaster },
                  { path: 'workshop/item-master', data: [5], component: ItemMaster },
                  { path: 'showroom/itemmaster-fg', data: [6], component: ItemmasterFG },
                  { path: 'api-tracking', data: [7], loadComponent: () => import('./components/api-tracking/api-tracking').then(m => m.ApiTracking) },
                  { path: 'battery-capacity-master', data: [8], component: BatteryCapacityMaster },
                  { path: 'showroom/form22master', data: [10], component: Form22master },
                  { path: 'oemmodel-master', data: [11], component: OemmodelMasterComponent },
                  { path: 'agreegate-tax-code-master', data: [12], component: AgreegateTaxCodeMaster },
                  { path: 'hsnCode-master', data: [13], component: HsnCodeMaster },
                  { path: 'taxcode-master', data: [14], component: TaxCodeMasterComponent },
                  { path: 'access-control', data: [15], loadComponent: () => import('./components/access-control/access-control').then(m => m.AccessControl) },
                  { path: 'hsnwisetaxcode', data: [16], component: Hsnwisetaxcode },
                  { path: 'vehicle-po', data: [17], component: VehiclePO },
                  { path: 'vehicle-po/:ponumber', data: [17], component: VehiclePO },
                  { path: 'vehicle-po-list', data: [17], component: VehiclePoList },
                  { path: 'lotinspection', data: [18], component: Lotinspection },
                  { path: 'lot-inspection-details/:invoiceNo', data: [18], component: LotInspectionDetails },
                  { path: 'receipt-entry', data: [19], component: ReceiptEntry },
                  { path: 'receipt-entry/add', data: [19], component: AddReceiptEntry },
                  { path: 'receipt-entry/edit/:id', data: [19], component: AddReceiptEntry },
                  { path: 'customer-ledger', data: [20], loadComponent: () => import('./components/customer-ledger/customer-ledger-list/customer-ledger-list').then(m => m.CustomerLedgerList) },
                  { path: 'customer-ledger/:id', data: [20], loadComponent: () => import('./components/customer-ledger/customer-ledger').then(m => m.CustomerLedger) },
                  { path: 'delivery-certificate', data: [22], loadComponent: () => import('./components/Reports/delivery-certificate/delivery-certificate').then(m => m.DeliveryCertificate) },
                  { path: 'add-vehicle-sale-bill/delivery-certificate/:id', data: [22], loadComponent: () => import('./components/Reports/delivery-certificate/delivery-certificate').then(m => m.DeliveryCertificate) },
                  { path: 'job-card', data: [23], component: JobCard },
                  { path: 'job-card-addForm/:test', data: [23], component: JobCardAddForm },
                  { path: 'kit-creation', data: [24], loadComponent: () => import('./components/kit-creation/kit-creation').then(m => m.KitCreation) },
                  { path: 'kit-creation/:id', data: [24], loadComponent: () => import('./components/kit-creation/kit-creation-details/kit-creation-details').then(m => m.KitCreationDetails) },
                  { path: 'prefix', data: [26], loadComponent: () => import('./components/prefix-master/prefix-master').then(m => m.PrefixMaster) },
                  { path: 'prefix/:id', data: [26], loadComponent: () => import('./components/prefix-master/prefix-master-details/prefix-master-details').then(m => m.PrefixMasterDetails) },
                  { path: 'vehicle-sale-bill/edit/:id', data: [27], component: AddVehicleSaleBill },
                  { path: 'vehicle-sale-bill/add', data: [27], component: AddVehicleSaleBill },
                  { path: 'vehicle-sale-bill', data: [27], component: VehicleSaleBill },
                  { path: 'material-transfer', data: [29], loadComponent: () => import('./components/material-transfer/material-transfer').then(m => m.MaterialTransfer) },
                  { path: 'material-transfer/:id', data: [29], loadComponent: () => import('./components/material-transfer/material-transfer-detail/material-transfer-detail').then(m => m.MaterialTransferDetail) },
                  { path: 'parts-po-list', data: [33], component: PartsPoList },
                  { path: 'parts-po', data: [33], component: PartsPo },
                  { path: 'parts-po/:ponumber', data: [33], component: PartsPo },
                  { path: 'oemmodel-warranty', data: [34], component: OemmodelWarranty },
                  { path: 'oemmodel-warranty/add', data: [34], component: AddOemmodelWarranty },
                  { path: 'oemmodel-warranty/edit/:id', data: [34], component: AddOemmodelWarranty },
                  { path: 'city-master', data: [35], component: CityMaster },
                  { path: 'city-master/add', data: [35], component: AddCityMaster },
                  { path: 'city-master/edit/:id', data: [35], component: AddCityMaster },
                  { path: 'modelwise-service-schedule', data: [36], component: ModelwiseServiceSchedule },
                  { path: 'extended-battery-warranty', data: [37], loadComponent: () => import('../app/components/extended-battery-warranty/extended-battery-warranty-list/extended-battery-warranty-list').then(m => m.ExtendedBatteryWarrantyList) },
                  { path: 'extended-battery-warranty/:id', data: [37], loadComponent: () => import('../app/components/extended-battery-warranty/extended-battery-warranty').then(m => m.ExtendedBatteryWarranty) },
                  { path: 'pdiChecklistmaster', data: [38], component: PdiChecklistmaster },
                  { path: 'chassis-search', data: [39], loadComponent: () => import('../app/components/chassis-search/chassis-search').then(m => m.ChassisSearch) },
                  { path: 'ffir', data: [40], component: FFIR },
                  { path: 'ffir/:id', data: [40], component: FFIR },
                  { path: 'ffirlisting', data: [40], component: Ffirlisting },
                  { path: 'stock-report', data: [41], loadComponent: () => import('./components/stock-reports/stock-report').then(m => m.StockReportComponent) },
                  { path: 'job-card-report', data: [42], loadComponent: () => import('./components/Reports/job-report/job-report').then(m => m.JobReportComponent) },
                  { path: 'hsrp-order', component: HSRPOrder, data: [48] },
                  { path: 'hsrp-order-list', component: HSRPOrderList, data: [48] },
                  { path: 'hsrp-order/:id', component: HSRPOrder, data: [48] },
                  { path: 'hsrp-inward', component: HsrpInward, data: [48] },
                  { path: 'upload', component: DealerMasterBulkDataDipatch, data: [] },

                  { path: 'proforma-invoice', data: [22], component: ProformaInvoice },
                  { path: 'form22-certificate/:chassisNo', data: [22], component: Form22Certificate },
                  { path: 'delivery-checkList', data: [22], component: DeliveryChecklist },
                  { path: 'delivery-slip', data: [22], component: DeliverySlip },
                  { path: 'sale-Letter/:saleBillNo', data: [22], component: SaleLetter },
                  { path: 'add-vehicle-sale-bill/performaInvoice/:saleBillNo', data: [23], component: PerformaInvoice }
            ]
      },
      { path: '**', component: WorkInProgress }
];
