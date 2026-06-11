import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { VehicleSaleBillService } from '../../../core/services/vehicle-sale-bill-service';
import { Form22SlipViewModel } from '../../../ViewModels/Form22SlipViewModel';
import { ReportService } from '../../../core/services/report.service';

@Component({
  selector: 'app-form22-certificate',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form22-certificate.html',
  styleUrl: './form22-certificate.scss',
})
export class Form22Certificate implements OnInit {

  form22Data!: Form22SlipViewModel; 

  constructor(
    private route: ActivatedRoute,
    private reportService: ReportService
  ) {}

  
  ngOnInit(): void {
    const chassisNo = this.route.snapshot.paramMap.get('chassisNo');


    if (chassisNo) {
      this.getForm22(chassisNo);
    }
  }

  printReport() {
    window.print();
  }

  getForm22(chassisNo: string) {
    this.reportService.getForm22(chassisNo).subscribe({
      next: (res) => {
        this.form22Data = res;
      },
      error: (err) => {
        console.error(err);
      }
    });
  }
}