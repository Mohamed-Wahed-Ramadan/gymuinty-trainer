
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CommonModule, NgClass, DatePipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.css'],
//   standalone: true,
  imports: [CommonModule, TranslateModule, NgClass, DatePipe, DecimalPipe]
})
export class ClientsComponent implements OnInit {
  clientsData: any[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(public translate: TranslateService, private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.fetchClients();
  }

  fetchClients() {
    this.isLoading = true;
    this.error = null;
    this.http.get(`${environment.apiUrl}/trainer/Packages/with-subscriptions`).subscribe({
      next: (data: any) => {
        this.clientsData = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err?.error?.message || err.message || 'Error loading data';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
