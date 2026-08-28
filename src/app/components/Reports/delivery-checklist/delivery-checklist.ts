// src\app\components\Reports\delivery-checklist\delivery-checklist.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-delivery-checklist',
  imports: [CommonModule],
  templateUrl: './delivery-checklist.html',
  styleUrl: './delivery-checklist.scss',
})
export class DeliveryChecklist implements OnInit {
currentDate: Date = new Date();
  saleBillId: string = '';

  constructor(private route: ActivatedRoute,private router:Router) {}

  ngOnInit(): void {
    this.saleBillId = this.route.snapshot.paramMap.get('saleBillId') || '';
  }

   goBack(): void {
  this.router.navigate(['/vehicle-sale-bill/edit', this.saleBillId]);
}

printInvoice(): void {
  window.print();
}
}
