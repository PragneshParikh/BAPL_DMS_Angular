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
import { RepairBillList } from './components/repair-bill/repair-bill-list/repair-bill-list';
import { HsrpInward } from './components/hsrp-order/hsrp-inward/hsrp-inward';
import { HSRPOrderList } from './components/hsrp-order/hsrporder-list/hsrporder-list';
import { HSRPOrder } from './components/hsrp-order/hsrp-order';
import { EmployeeMasterList } from './components/employee-master/employee-master-list/employee-master-list';
import { RepairBillPerforma } from './components/Reports/repair-bill-performa/repair-bill-performa';
import { ComplaintMaster } from './components/complaint-master/complaint-master';
import { AddVehicleStockTransfer } from './components/vehicle-stock-transfer/add-vehicle-stock-transfer';
import { VehicleStockTransferList } from './components/vehicle-stock-transfer/vehicle-stock-transfer-list/vehicle-stock-transfer-list';
import { GroupMaster } from './components/group-master/group-master';
import { TermConditionMaster } from './components/term-condition-master/term-condition-master';
import { OccupationMaster } from './components/occupation-master/occupation-master';
import { VehicleInfoUpdate } from './components/vehicle-info-update/vehicle-info-update';
import { DepartmentMasterList } from './components/department-master/department-master-list/department-master-list';
import { DepartmentMaster } from './components/department-master/department-master';
import { DesignationMasterList } from './components/designation-master/designation-master-list/designation-master-list';
import { DesignationMaster } from './components/designation-master/designation-master';
import { JobTypeMaster } from './components/job-type-master/job-type-master';
import { ServiceHeadMaster } from './components/service-head-master/service-head-master';
import { ServiceTypeMaster } from './components/service-type-master/service-type-master';
import { JobSourceMaster } from './components/job-source-master/job-source-master';
import { RoleMasterList } from './components/role-master/role-list-master/role-list-master';
import { RoleMaster } from './components/role-master/role-master';
import { BgemployeeMaster } from './components/bgemployee-master/bgemployee-master';
import { BgemployeeMasterList } from './components/bgemployee-master/bgemployee-master-list/bgemployee-master-list';
import { WarrantyJobCardClaim } from './components/warranty-job-card-claim/warranty-job-card-claim';
import { CounterBill } from './components/counter-bill/counter-bill';
import { AddCounterBill } from './components/counter-bill/add-counter-bill/add-counter-bill';
import { CounterBillPrint } from './components/Reports/counter-bill-print/counter-bill-print';
import { RepoBilling } from './components/repo-billing/repo-billing';
import { VehicleOpenStock } from './components/vehicle-open-stock/vehicle-open-stock';
import { VehicleQuotation } from './components/vehicle-quotation/vehicle-quotation';
import { VehicleQuotationListComponent } from './components/vehicle-quotation/vehicle-quotation-list/vehicle-quotation-list';
import { PartInward } from './components/part-inward/part-inward';
import { PartInwardList } from './components/part-inward/part-inward-list/part-inward-list';



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

      { path: 'add-vehicle-sale-bill/delivery-certificate/:id', data: [22], loadComponent: () => import('./components/Reports/delivery-certificate/delivery-certificate').then(m => m.DeliveryCertificate) },
      { path: 'add-vehicle-sale-bill/performaInvoice/:saleBillNo', component: PerformaInvoice, data: [23] },
      { path: 'chassis-search', data: [39], loadComponent: () => import('../app/components/chassis-search/chassis-search').then(m => m.ChassisSearch) },
      { path: 'proforma-invoice', component: ProformaInvoice, data: [22] },
      { path: 'form22-certificate/:saleBillId/:chassisNo', component: Form22Certificate, data: [22] },
      { path: 'delivery-checkList/:saleBillId', component: DeliveryChecklist, data: [22] },
      { path: 'delivery-slip', component: DeliverySlip, data: [22] },
      { path: 'sale-Letter/:saleBillNo', component: SaleLetter, data: [22] },



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
      { path: 'parts-po-list', component: PartsPoList, data: [33] },
      { path: 'parts-po', component: PartsPo, data: [33] },
      { path: 'parts-po/:ponumber', component: PartsPo, data: [33] },
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
      { path: 'repair-bill-list', component: RepairBillList, data: [51] },
      { path: 'repair-bill/:id', component: RepairBill, data: [51] },
      { path: 'labour-master-import', component: LabourMaster, data: [54] },
      { path: 'labour-rate-master', component: LabourRateMaster, data: [55] },

      { path: 'employee', data: [49], component: EmployeeMasterList },
      { path: 'employee/add', component: EmployeeMasterComponent, data: [49] },
      { path: 'employee/edit/:id', component: EmployeeMasterComponent, data: [49] },

      { path: 'bgemployee-master', component: BgemployeeMasterList, data: [76] },
      { path: 'bgemployee-master/add', component: BgemployeeMaster, data: [76] },
      { path: 'bgemployee-master/edit/:id', component: BgemployeeMaster, data: [76] },

      { path: 'hsrp-order', component: HSRPOrder, data: [48] },
      { path: 'hsrp-order/:id', component: HSRPOrder, data: [48] },
      { path: 'hsrp-order-list', component: HSRPOrderList, data: [48] },
      { path: 'hsrp-inward', component: HsrpInward, data: [48] },



      { path: 'vehicle-sale-report', data: [43], loadComponent: () => import('./components/Reports/vehicle-sale-report/vehicle-sale-report').then(m => m.VehicleSaleReportComponent) },
      { path: 'vehicle-stocks-report', data: [46], loadComponent: () => import('./components/Reports/vehicle-stock-report/vehicle-stock-report').then(m => m.VehicleStockReportComponent) },
      { path: 'po-tracking-report', data: [47], loadComponent: () => import('./components/Reports/po-tracking-report/po-tracking-report').then(m => m.POTrackingReportComponent) },
      { path: 'parts-dispatch-report', data: [50], loadComponent: () => import('./components/Reports/parts-dispatch-report/parts-dispatch-report').then(m => m.PartsDispatchReport) },
      { path: 'part-dispatch-kit-report', data: [51], loadComponent: () => import('./components/Reports/part-dispatch-kit-report/part-dispatch-kit-report').then(m => m.PartDispatchKitReport) },
      { path: 'vehicle-sale-d2d-report', data: [61], loadComponent: () => import('./components/Reports/vehicle-sale-d2d-report/vehicle-sale-d2d-report').then(m => m.VehicleSaleD2dReport) },
      { path: 'total-sale-dealer-wise', data: [81], loadComponent: () => import('./components/Reports/total-sale-report/total-sale-report').then(m => m.TotalSaleDealerWiseComponent) },

      { path: 'model-wise-variant-stock', data: [66], loadComponent: () => import('./components/Reports/model-wise-variant-report/model-wise-variant-report').then(m => m.ModelWiseVariantStockComponent) },
      { path: 'comparison-report', data: [90], loadComponent: () => import('./components/Reports/comparision-report/comparision-report').then(m => m.ComparisonReportComponent) },
      { path: 'material-transfer-report', data: [91], loadComponent: () => import('./components/Reports/material-transfer-report/material-transfer-report').then(m => m.MaterialTransferReportComponent) },
      { path: 'repair-bill-report', data: [92], loadComponent: () => import('./components/Reports/repair-bill-report/repair-bill-report').then(m => m.RepairBillReportComponent) },
      { path: 'circular', data: [53], loadComponent: () => import('./components/circular/circular').then(m => m.Circular) },

      { path: 'repair-bill-performa/:repairBillId', component: RepairBillPerforma, data: [51] },

      { path: 'repair-bill-invoice/:id', loadComponent: () => import('./components/repair-bill-invoice/repair-bill-invoice').then(m => m.RepairBillInvoiceComponent), data: [51] },

      { path: 'complaint-master', component: ComplaintMaster, data: [56] },

      { path: 'add-vehicle-stock-transfer', component: AddVehicleStockTransfer, data: [57] },
      { path: 'vehicle-stock-transfer', component: VehicleStockTransferList, data: [57] },
      { path: 'vehicle-stock-transfer/edit/:id', component: AddVehicleStockTransfer, data: [57] },
      { path: 'group-master', component: GroupMaster, data: [59] },
      { path: 'term-condition-master', component: TermConditionMaster, data: [60] },
      { path: 'vehicle-sale-d2d-report', data: [61], loadComponent: () => import('./components/Reports/vehicle-sale-d2d-report/vehicle-sale-d2d-report').then(m => m.VehicleSaleD2dReport) },
      // { path: 'vehicle-sale-bill-report', data: [61], loadComponent: () => import('./components/Reports/vehicle-sale-bill-report/vehicle-sale-bill-report').then(m => m.VehicleSaleBillReport) },
      { path: 'vehicle-inward-report', data: [78], loadComponent: () => import('./components/Reports/vehicle-inward-report/vehicle-inward-report').then(m => m.VehicleInwardReport) },
      { path: 'model-wise-sale-report', data: [79], loadComponent: () => import('./components/Reports/model-wise-sale-report/model-wise-sale-report').then(m => m.ModelWiseSaleReportComponent) },
      { path: 'model-wise-current-stock', data: [80], loadComponent: () => import('./components/Reports/model-wise-current-stock/model-wise-current-stock').then(m => m.ModelWiseCurrentStockComponent) },
      { path: 'occupation-master', component: OccupationMaster, data: [62] },
      { path: 'department-master', component: DepartmentMasterList, data: [63] },
      { path: 'department-master/add', component: DepartmentMaster, data: [63] },
      { path: 'department-master/edit/:id', component: DepartmentMaster, data: [63] },
      { path: 'designation-master', component: DesignationMasterList, data: [64] },
      { path: 'designation-master/add', component: DesignationMaster, data: [64] },
      { path: 'designation-master/edit/:id', component: DesignationMaster, data: [64] },
      { path: 'role-master', component: RoleMasterList, data: [75] },
      { path: 'role-master/add', component: RoleMaster, data: [75] },
      { path: 'role-master/edit/:id', component: RoleMaster, data: [75] },

      { path: 'free-service-claim', data: [66], loadComponent: () => import('./components/free-service-claim/free-service-claim-list/free-service-claim-list').then(m => m.FreeServiceClaimList) },
      { path: 'free-service-claim/:id', data: [66], loadComponent: () => import('./components/free-service-claim/free-service-claim').then(m => m.FreeServiceClaim) },

      { path: 'free-service-rate', data: [67], loadComponent: () => import('./components/free-service-rate/free-service-rate-list/free-service-rate-list').then(m => m.FreeServiceRateList) },
      { path: 'free-service-rate/:id', data: [67], loadComponent: () => import('./components/free-service-rate/free-service-rate').then(m => m.FreeServiceRate) },

      { path: 'job-type-master', component: JobTypeMaster, data: [68] },
      { path: 'service-head-master', component: ServiceHeadMaster, data: [69] },
      { path: 'service-type-master', component: ServiceTypeMaster, data: [70] },
      { path: 'job-source-master', component: JobSourceMaster, data: [71] },
      { path: 'warranty-job-card-claim', component: WarrantyJobCardClaim, data: [74] },
      { path: 'vehicle-info', component: VehicleInfoUpdate, data: [73] },

      { path: 'counter-bill', component: CounterBill, data: [77] },
      { path: 'counter-bill/edit', component: AddCounterBill, data: [77] },
      { path: 'add-counter-bill', component: AddCounterBill, data: [77] },
      { path: 'print-counter-bill/:id', component: CounterBillPrint, data: [77] },
      { path: 'vehicle-open-stock', component: VehicleOpenStock, data: [89] },
      { path: 'repo-billing', component: RepoBilling, data: [88] },
      { path: 'vehicle-open-stock', component: VehicleOpenStock, data: [89] },
      { path: 'vehicle-quotation', component: VehicleQuotationListComponent, data: [87] },
      { path: 'vehicle-quotation/add', component: VehicleQuotation, data: [87] },
      { path: 'vehicle-quotation/edit/:id', component: VehicleQuotation, data: [87] },
      { path: 'parts-inward', data: [0], component: PartInwardList },
      { path: 'parts-inward/:invoiceNo', data: [0], component: PartInward },
      { path: 'parts-stock-details', data: [93], loadComponent: () => import('./components/Reports/parts-stock-details/parts-stock-details').then(m => m.PartsStockDetails) }
    ]
  },
  { path: '**', component: WorkInProgress }
];
