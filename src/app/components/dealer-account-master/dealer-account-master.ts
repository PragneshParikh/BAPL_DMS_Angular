// src\app\components\dealer-account-master\dealer-account-master.ts
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MenuAccessService } from '../../core/services/menu-access.service';

@Component({
  selector: 'app-dealer-account-master',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dealer-account-master.html',
  styleUrls: ['./dealer-account-master.scss']
})
export class DealerAccountMaster {

  readonly SUBMENU_ID = 128;
  canEdit = false;   // ADDED — gates the Save button once it's wired to a real backend call

  selectedGroup: any = '';
  searchGroup = '';
  dropdownOpen = false;

  groups: any[] = [
    { name: 'Other', selected: false },
    { name: 'Others', selected: false },
    { name: 'Outside Labour', selected: false },
    { name: 'Packing', selected: false },
    { name: 'Paid Service', selected: false },
    { name: 'Parts', selected: false },
    { name: 'Patent, Trademark & Copyright', selected: false }
  ];

  constructor(private menuAccess: MenuAccessService) {   // ADDED
    this.canEdit = this.menuAccess.canEdit(this.SUBMENU_ID);
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectAll() {
    this.groups.forEach(g => g.selected = true);
  }

  clearAll() {
    this.groups.forEach(g => g.selected = false);
  }

  filteredGroups() {
    return this.groups.filter(g =>
      g.name.toLowerCase().includes(this.searchGroup.toLowerCase())
    );
  }

  getSelectedNames() {
    return this.groups
      .filter(g => g.selected)
      .map(g => g.name)
      .join(', ');
  }

  // ADDED — stub so the Save button has something to bind to. No backend
  // service call exists for this page yet; replace this body once one does.
  onSave() {
    console.warn('DealerAccountMaster.onSave() called — no backend wiring exists yet.');
  }
}