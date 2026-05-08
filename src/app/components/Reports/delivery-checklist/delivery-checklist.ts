import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-delivery-checklist',
  imports: [CommonModule],
  templateUrl: './delivery-checklist.html',
  styleUrl: './delivery-checklist.scss',
})
export class DeliveryChecklist {
currentDate: Date = new Date();
}
