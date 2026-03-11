import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dealer-account-master',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dealer-account-master.html',
  styleUrls: ['./dealer-account-master.scss']
})
export class DealerAccountMaster {

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

}