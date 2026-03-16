import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';

@Component({
  selector: 'app-data-seed',
  imports: [CommonModule],
  templateUrl: './data-seed.html',
  styleUrl: './data-seed.scss',
})
export class DataSeed {

  loading = false;
  message = '';

  constructor(private httpClient: HttpClient) { }

  seedRoles() {
    this.loading = true;
    this.message = '';

    this.httpClient.post('http://localhost:5215/api/seed/roles', {}).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.message = res.message;
      },
      error: () => {
        this.loading = false;
        this.message = "Seeding failed";
      }
    });

  }

  assignRole() {
    this.loading = true;
    this.message = '';

    this.httpClient.post('http://localhost:5215/api/seed/assign-role', { userId: '71bc76bd-edd5-4a44-af82-98ff5b7a56f0', roleName: 'User' }).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.message = res.message;
      },
      error: () => {
        this.loading = false;
        this.message = "Seeding failed";
      }
    });
  }

  createuser() {
    this.loading = true;
    this.message = '';

    this.httpClient.post('http://localhost:5215/api/seed/create', { EmailId: 'it5.vad@rrglobal.com', Password: 'Test123!' }).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.message = res.message;
      },
      error: () => {
        this.loading = false;
        this.message = "Seeding failed";
      }
    });
  }


}
