import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-work-in-progress',
  imports: [CommonModule],
  templateUrl: './work-in-progress.html',
  styleUrl: './work-in-progress.scss',
})
export class WorkInProgress {
  constructor(private route: Router) { }

}
