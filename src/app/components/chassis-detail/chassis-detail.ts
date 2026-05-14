import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-chassis-detail',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './chassis-detail.html',
  styleUrl: './chassis-detail.scss',
})
export class ChassisDetail {
  chassisNo: string = "";

  onSubmit() {

  }
}
