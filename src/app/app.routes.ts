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
import { HsnCodeMaster } from './components/hsn-code-master/hsn-code-master';
import { TaxCodeMasterComponent } from './components/taxcode-master/taxcode-master';


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
          { path: 'itemmaster-fg', component: ItemmasterFG },
          { path: 'form22master', component: Form22master }
        ]
      },

      // WORKSHOP MODULE
      {
        path: 'workshop',
        children: [
          { path: 'item-master', component: ItemMaster }
        ]
      },

      // MASTER MODULE (COMMON)
      { path: 'dealer-master', component: DealerMaster },
      { path: 'dealer-account-master', component: DealerAccountMaster },
      { path: 'upload', component: DealerMasterBulkDataDipatch },
      { path: 'location-master', component: LocationMasterComponent },
      { path: 'color', loadComponent: () => import('./components/color/color').then(m => m.Color) },
      { path: 'api-tracking', loadComponent: () => import('./components/api-tracking/api-tracking').then(m => m.ApiTracking) },
      { path: 'battery-capacity-master', component: BatteryCapacityMaster },
      { path: 'oemmodel-master', component: OemmodelMasterComponent },
      { path: 'kit-creation', loadComponent: () => import('./components/kit-creation/kit-creation').then(m => m.KitCreation) },
      { path: 'data-seed', loadComponent: () => import('./components/data-seed/data-seed').then(m => m.DataSeed) },
      { path: 'hsnCode-master', component: HsnCodeMaster },
      { path: 'taxcode-master', component: TaxCodeMasterComponent },

    ]
  }
];