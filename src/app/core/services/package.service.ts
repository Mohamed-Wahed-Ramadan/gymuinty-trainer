import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Package {
  id?: number;
  trainerId?: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  isActive: boolean;
  thumbnailUrl?: string;
  programIds: number[];
  isAnnual?: boolean;
  promoCode?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PackageService {
  private readonly apiUrl = `${environment.apiUrl}/trainer`;
  private selectedPackage$ = new BehaviorSubject<Package | null>(null);

  constructor(private http: HttpClient) {}

  // ============ PACKAGES ============

  getMyPackages(trainerId: string): Observable<Package[]> {
    return this.http.get<Package[]>(`${this.apiUrl}/Packages/byTrainer/${trainerId}`);
  }

  getPackageDetails(packageId: number): Observable<Package> {
    return this.http.get<Package>(`${this.apiUrl}/Packages/${packageId}`)
      .pipe(
        tap(pkg => this.selectedPackage$.next(pkg))
      );
  }

  createPackage(trainerId: string, pkg: Omit<Package, 'id' | 'createdAt' | 'updatedAt'>): Observable<Package> {
    const payload = { ...pkg, trainerId };
    return this.http.post<Package>(`${this.apiUrl}/Packages`, payload);
  }

  updatePackage(packageId: number, pkg: Omit<Package, 'id' | 'createdAt' | 'updatedAt'>): Observable<Package> {
    return this.http.put<Package>(`${this.apiUrl}/Packages/${packageId}`, pkg);
  }

  deletePackage(packageId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Packages/${packageId}`);
  }

  // ============ OBSERVABLES ============

  getSelectedPackage$(): Observable<Package | null> {
    return this.selectedPackage$.asObservable();
  }

  setSelectedPackage(pkg: Package): void {
    this.selectedPackage$.next(pkg);
  }

  clearSelection(): void {
    this.selectedPackage$.next(null);
  }
}
