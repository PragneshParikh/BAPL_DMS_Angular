import { Routes } from '@angular/router';
import { LayoutComponent } from './layouts/layout.component';
import { ItemMaster } from './Component/Workshop/item-master/item-master';
import { ItemmasterFG } from './Component/Showroom/itemmaster-fg/itemmaster-fg';
import path from 'path';
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
          { path: 'item-master', component: ItemMaster }
        ]
      }
    ]
  },


];
