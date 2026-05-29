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
import { FFIR } from './components/ffir/ffir';
import { Ffirlisting } from './components/ffir/ffirlisting/ffirlisting';
import { RepairBill } from './components/repair-bill/repair-bill';
import { LabourMaster } from './components/labour-master-import/labour-master-import';
import { LabourRateMaster } from './components/labour-rate-master/labour-rate-master';


export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./components/account/login/login').then(m => m.Login) },
  { path: 'forgot-password', loadComponent: () => import('./components/account/forgot-password/forgot-password').then(m => m.ForgotPassword) },
  { path: 'reset-password', loadComponent: () => import('./components/account/reset-password/reset-password').then(m => m.ResetPassword) },
  {
    path: '', component: LayoutComponent,
    canActivateChild: [AuthGuard],
    children: [
      { path: 'showroom/itemmaster-fg', component: ItemmasterFG, data: [6] },
      { path: 'showroom/form22master', component: Form22master, data: [10] },
      { path: 'workshop/item-master', component: ItemMaster, data: [5] },
      { path: 'dealer-master', component: DealerMaster, data: [4] },
      { path: 'dealer-account-master', component: DealerAccountMaster, data: [4] },
      { path: 'upload', component: DealerMasterBulkDataDipatch, data: [] },
      { path: 'location-master', component: LocationMasterComponent, data: [3] },
      { path: 'color', data: [2], loadComponent: () => import('./components/color/color').then(m => m.Color) },
      { path: 'api-tracking', data: [7], loadComponent: () => import('./components/api-tracking/api-tracking').then(m => m.ApiTracking) },
      { path: 'battery-capacity-master', data: [8], component: BatteryCapacityMaster },
      { path: 'oemmodel-master', data: [11], component: OemmodelMasterComponent },
      { path: 'kit-creation', data: [24], loadComponent: () => import('./components/kit-creation/kit-creation').then(m => m.KitCreation) },
      { path: 'kit-creation/:id', data: [24], loadComponent: () => import('./components/kit-creation/kit-creation-details/kit-creation-details').then(m => m.KitCreationDetails) },
      //{ path: 'data-seed', data: [9], loadComponent: () => import('./components/data-seed/data-seed').then(m => m.DataSeed) },
      { path: 'hsnCode-master', component: HsnCodeMaster, data: [13] },
      { path: 'taxcode-master', component: TaxCodeMasterComponent, data: [14] },
      { path: 'access-control', data: [9], loadComponent: () => import('./components/access-control/access-control').then(m => m.AccessControl) },
      { path: 'agreegate-tax-code-master', component: AgreegateTaxCodeMaster, data: [12] },
      { path: 'hsnwisetaxcode', component: Hsnwisetaxcode, data: [16] },
      { path: 'lotinspection', component: Lotinspection, data: [18] },
      { path: 'lot-inspection-details/:invoiceNo', component: LotInspectionDetails, data: [18] },
      { path: 'receipt-entry', component: ReceiptEntry, data: [19] },
      { path: 'receipt-entry/add', component: AddReceiptEntry, data: [19] },
      { path: 'receipt-entry/edit/:id', component: AddReceiptEntry, data: [19] },
      { path: 'vehicle-sale-bill/edit/:id', component: AddVehicleSaleBill, data: [27] },
      { path: 'vehicle-sale-bill/add', component: AddVehicleSaleBill, data: [27] },
      { path: 'vehicle-sale-bill', component: VehicleSaleBill, data: [27] },
      { path: 'oemmodel-warranty', component: OemmodelWarranty, data: [34] },
      { path: 'oemmodel-warranty/add', component: AddOemmodelWarranty, data: [34] },
      { path: 'oemmodel-warranty/edit/:id', component: AddOemmodelWarranty, data: [34] },
      { path: 'customer-ledger', data: [20], loadComponent: () => import('./components/customer-ledger/customer-ledger-list/customer-ledger-list').then(m => m.CustomerLedgerList) },
      { path: 'customer-ledger/:id', data: [20], loadComponent: () => import('./components/customer-ledger/customer-ledger').then(m => m.CustomerLedger) },
      { path: 'delivery-certificate', data: [22], loadComponent: () => import('./components/Reports/delivery-certificate/delivery-certificate').then(m => m.DeliveryCertificate) },
      { path: 'stock-report', data: [41], loadComponent: () => import('./components/stock-reports/stock-report').then(m => m.StockReportComponent) },
      { path: 'job-card-report', data: [42], loadComponent: () => import('./components/Reports/job-report/job-report').then(m => m.JobReportComponent) },
      { path: 'add-vehicle-sale-bill/delivery-certificate/:id', data: [22], loadComponent: () => import('./components/Reports/delivery-certificate/delivery-certificate').then(m => m.DeliveryCertificate) },
      { path: 'job-card', component: JobCard, data: [23] },
      { path: 'job-card-addForm/:test', component: JobCardAddForm, data: [23] },
      { path: 'vehicle-po', component: VehiclePO, data: [17] },
      { path: 'vehicle-po/:ponumber', component: VehiclePO, data: [17] },
      { path: 'vehicle-po-list', component: VehiclePoList, data: [17] },
      { path: 'parts-po-list', component: PartsPoList, data: [32] },
      { path: 'parts-po', component: PartsPo, data: [32] },
      { path: 'parts-po/:ponumber', component: PartsPo, data: [32] },
      { path: 'prefix', data: [26], loadComponent: () => import('./components/prefix-master/prefix-master').then(m => m.PrefixMaster) },
      { path: 'prefix/:id', data: [26], loadComponent: () => import('./components/prefix-master/prefix-master-details/prefix-master-details').then(m => m.PrefixMasterDetails) },
      { path: 'material-transfer', data: [29], loadComponent: () => import('./components/material-transfer/material-transfer').then(m => m.MaterialTransfer) },
      { path: 'material-transfer/:id', data: [29], loadComponent: () => import('./components/material-transfer/material-transfer-detail/material-transfer-detail').then(m => m.MaterialTransferDetail) },
      { path: 'city-master', component: CityMaster, data: [19] },
      { path: 'city-master/add', component: AddCityMaster, data: [19] },
      { path: 'city-master/edit/:id', component: AddCityMaster, data: [19] },
      { path: 'modelwise-service-schedule', component: ModelwiseServiceSchedule, data: [36] },
      { path: 'pdiChecklistmaster', component: PdiChecklistmaster, data: [36] },
      { path: 'extended-battery-warranty', data: [37], loadComponent: () => import('../app/components/extended-battery-warranty/extended-battery-warranty-list/extended-battery-warranty-list').then(m => m.ExtendedBatteryWarrantyList) },
      { path: 'extended-battery-warranty/:id', data: [37], loadComponent: () => import('../app/components/extended-battery-warranty/extended-battery-warranty').then(m => m.ExtendedBatteryWarranty) },
      { path: 'modelwise-service-schedule', component: ModelwiseServiceSchedule, data: [36] },
      { path: 'add-vehicle-sale-bill/performaInvoice/:saleBillNo', component: PerformaInvoice, data: [23] },
      { path: 'ffir', component: FFIR, data: [23] },
      { path: 'ffir/:id', component: FFIR, data: [23] },
      { path: 'ffirlisting', component: Ffirlisting, data: [23] },
      { path: 'add-vehicle-sale-bill/performaInvoice/:saleBillNo', component: PerformaInvoice, data: [23] },
      { path: 'chassis-search', data: [39], loadComponent: () => import('../app/components/chassis-search/chassis-search').then(m => m.ChassisSearch) },
      { path: 'proforma-invoice', component: ProformaInvoice, data: [22] },
      { path: 'form22-certificate/:chassisNo', component: Form22Certificate, data: [22] },
      { path: 'delivery-checkList', component: DeliveryChecklist, data: [22] },
      { path: 'delivery-slip', component: DeliverySlip, data: [22] },
      { path: 'sale-Letter/:saleBillNo', component: SaleLetter, data: [22] },
      { path: 'repair-bill', component: RepairBill, data: [51] },
      { path: 'labour-master-import', component: LabourMaster, data: [54] },
      { path: 'labour-rate-master', component: LabourRateMaster, data: [55] },
    ]
  },
  { path: '**', component: WorkInProgress }
];
