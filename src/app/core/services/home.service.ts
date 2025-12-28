import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HomeService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  searchAll(term: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/homeclient/search`, { params: { term } });
  }

  getPrograms(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/homeclient/programs`);
  }

  getPackages(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/homeclient/packages`);
  }

  getTrainers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/homeclient/trainers`);
  }
}
