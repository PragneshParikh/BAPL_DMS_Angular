import { Component, OnDestroy, OnInit } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-stock-adjustment-report',
  imports: [SharedModule, FormsModule, CommonModule, NgSelectModule],
  templateUrl: './stock-adjustment-report.html',
  styleUrl: './stock-adjustment-report.scss',
})
export class StockAdjustmentReport implements OnInit {

  ngOnInit(): void {
  }
   
  
}
