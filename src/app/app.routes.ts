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


export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./components/account/login/login').then(m => m.Login) },
  { path: 'forgot-password', loadComponent: () => import('./components/account/forgot-password/forgot-password').then(m => m.ForgotPassword) },
  { path: 'reset-password', loadComponent: () => import('./components/account/reset-password/reset-password').then(m => m.ResetPassword) },
  {
    path: '', component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [

      // SHOWROOM MODULE
      {
        path: 'showroom',
        children: [
          { path: 'itemmaster-fg', component: ItemmasterFG, data: [6] },
          { path: 'form22master', component: Form22master, data: [10] }
        ]
      },

      // WORKSHOP MODULE
      {
        path: 'workshop',
        children: [
          { path: 'item-master', component: ItemMaster, data: [5] }
        ]
      },

      // MASTER MODULE (COMMON)
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
      { path: 'data-seed', data: [9], loadComponent: () => import('./components/data-seed/data-seed').then(m => m.DataSeed) },
      { path: 'hsnCode-master', component: HsnCodeMaster, data: [13] },
      { path: 'taxcode-master', component: TaxCodeMasterComponent, data: [14] },
      { path: 'access-control', data: [9], loadComponent: () => import('./components/access-control/access-control').then(m => m.AccessControl) },
      { path: 'agreegate-tax-code-master', component: AgreegateTaxCodeMaster, data: [12] },
      { path: 'hsnwisetaxcode', component: Hsnwisetaxcode, data: [16] },
      { path: 'lotinspection', component: Lotinspection, data: [18] },
      { path: 'lot-inspection-details/:invoiceNo', component: LotInspectionDetails, data: [18] },
      { path: 'receipt-entry', component: ReceiptEntry, data: [15] },
      { path: 'receipt-entry/add', component: AddReceiptEntry, data: [15] },
      { path: 'receipt-entry/edit/:id', component: AddReceiptEntry, data: [15] },
      { path: 'receipt-entry/test', component: AddVehicleSaleBill, data: [15] },
      { path: 'customer-ledger', data: [20], loadComponent: () => import('./components/customer-ledger/customer-ledger-list/customer-ledger-list').then(m => m.CustomerLedgerList) },
      { path: 'customer-ledger/:id', data: [20], loadComponent: () => import('./components/customer-ledger/customer-ledger').then(m => m.CustomerLedger) },
      { path: 'delivery-certificate', data: [22], loadComponent: () => import('./components/Reports/delivery-certificate/delivery-certificate').then(m => m.DeliveryCertificate) },
      { path: 'job-card', component: JobCard, data: [23] },
      { path: 'job-card-addForm/:test', component: JobCardAddForm, data: [23] },
      { path: 'vehicle-po', component: VehiclePO, data: [17] },
      { path: 'vehicle-po/:ponumber', component: VehiclePO, data: [17] },
      { path: 'vehicle-po-list', component: VehiclePoList, data: [17] },
      { path: 'prefix', data: [26], loadComponent: () => import('./components/prefix-master/prefix-master').then(m => m.PrefixMaster) },
      { path: 'prefix/:id', data: [26], loadComponent: () => import('./components/prefix-master/prefix-master-details/prefix-master-details').then(m => m.PrefixMasterDetails) }

    ]
  }
];