import { Component, OnInit } from '@angular/core';
import { LoaderService } from '../../core/services/loader';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loader',
  imports: [CommonModule],
  templateUrl: './loader.html',
  styleUrl: './loader.scss',
})
export class Loader implements OnInit {

  loading$!: Observable<boolean>;

  constructor(private loaderService: LoaderService) { }

  ngOnInit() {
    this.loading$ = this.loaderService.loading$;
  }
}
