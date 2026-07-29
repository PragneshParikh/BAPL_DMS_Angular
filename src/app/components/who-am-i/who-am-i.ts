import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DealerService } from '../../core/services/dealer-service';

@Component({
  selector: 'app-who-am-i',
  imports: [FormsModule, CommonModule],
  templateUrl: './who-am-i.html',
  styleUrl: './who-am-i.scss',
})
/**
 *
 */



export class WhoAmI {
  model = {
    email:'',
    password:''
  };
  constructor( ) {}
  
  fetch() {
  // For implementation
}
}
