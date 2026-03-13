import { link } from 'fs';
import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [
  {
    id: 1,
    label: 'MENUITEMS.MENU.TEXT',
    isTitle: true
  },
  {
    id: 2,
    label: 'Master',
    icon: 'ri-dashboard-2-line',
    isCollapsed: true,
    subItems: [
      {
        id: 3,
        label: 'Color Master',
        link: '/color',
        parentId: 2,
        module: 'showroom'
      },
      {
        id: 4,
        label: 'Location Master',
        link: '/location-master',
        parentId: 2,
        module: 'showroom'
      },
      {
        id: 5,
        label: 'Dealer Master',
        link: '/dealer-master',
        parentId: 2,
        module: 'workshop'
      },
      {
        id: 6,
        label: 'Item Master Spares',
        link: '/workshop/item-master',
        parentId: 2,
        module: 'workshop'
      },
      {
        id: 7,
        label: 'Item Master FG',
        link: '/showroom/itemmaster-fg',
        parentId: 2,
        module: 'showroom'
      },
      {
        id: 8,
        label: 'API Tracking',
        link: '/api-tracking',
        parentId: 2,
        module: 'workshop'
      },
      {
        id: 9,
        label: 'KIT Creation',
        link: '/kit-creation',
        parentId: 2,
        module: 'workshop'
      }
    ]
  }
];