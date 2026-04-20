import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-access-control',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule],
  templateUrl: './access-control.html',
  styleUrl: './access-control.scss',
})
export class AccessControl {
  accessOptions = ['No Access', 'View Only', 'Modify Only', 'Full Access'];

  parents = [
    {
      name: 'Item 1',
      expanded: false,
      children: [
        { name: 'Item Master A1', access: 'Full Access' },
        { name: 'Item Master A2', access: 'View Only' }
      ]
    },
    {
      name: 'Item 2',
      expanded: false,
      children: [
        { name: 'Item Master B1', access: 'Read Only' },
        { name: 'Item Master B2', access: 'Full Access' }
      ]
    },

    {
      name: 'Parent Menu',
      expanded: false,
      children: [],
      access: 'Full Access'
    }
  ];

  toggleChild(index: number) {
    this.parents[index].expanded = !this.parents[index].expanded;
  }
}
