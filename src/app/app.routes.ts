import { Routes } from '@angular/router';
import { LayoutComponent } from './layouts/layout.component';
import { ItemMaster } from './Component/Workshop/item-master/item-master';
import { ItemmasterFG } from './Component/Showroom/itemmaster-fg/itemmaster-fg';
import path from 'path'; import { DealerMaster } from './components/dealer-master/dealer-master';
import { DealerAccountMaster } from './components/dealer-account-master/dealer-account-master';
import { DealerMasterBulkDataDipatch } from './components/dealer-master-bulk-data-dipatch/dealer-master-bulk-data-dipatch';
import { LocationMasterComponent } from './components/location-master/location-master';

export const routes: Routes = [
  {
    path: '', component: LayoutComponent,
    //   children :[{
    //     path:'item-master',component : ItemMaster
    //   }]
    //  },
    // SHOWROOM MODULE
    children: [
      {
        path: 'showroom',
        children: [
          { path: 'itemmaster-fg', component: ItemmasterFG }
        ]
      },
      // WORKSHOP MODULE
      {
        path: 'workshop',
        children: [
          { path: 'item-master', component: ItemMaster },
          { path: 'dealer-master', component: DealerMaster },
          { path: 'dealer-account-master', component: DealerAccountMaster },
          { path: 'upload', component: DealerMasterBulkDataDipatch },
          { path: 'location-master', component: LocationMasterComponent }
        ]
      }
    ]
  },


];