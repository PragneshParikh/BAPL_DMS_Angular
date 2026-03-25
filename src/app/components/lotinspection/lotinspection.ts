import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { FlatpickrDefaults, FlatpickrModule } from 'angularx-flatpickr';
import { Lotinspectionservice } from '../../core/services/lotinspectionservice';

@Component({
  selector: 'app-lotinspection',
  standalone: true,
  imports: [FormsModule, FlatpickrModule, NgbTooltipModule],
   providers: [FlatpickrDefaults],
  templateUrl: './lotinspection.html',
  styleUrl: './lotinspection.scss',
})

export class Lotinspection implements OnInit {

  constructor(private lotinspectionService: Lotinspectionservice) {}

dateRange: { from: Date; to: Date } = {
      from: new Date(new Date().setDate(new Date().getDate() - 15)),
        to: new Date()
    }; // This will hold [fromDate, toDate]

onFileSelected(event: any) {
  const file = event.target.files[0];
  if (file) {
    console.log('Selected file:', file.name);
  }
} //file upload
  ngOnInit() {}

}