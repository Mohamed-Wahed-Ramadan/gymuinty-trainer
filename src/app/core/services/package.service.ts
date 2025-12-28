import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * PackageResponse DTO - Complete package information
 * Maps to: ITI.Gymunity.FP.Application/DTOs/Package/PackageResponse.cs
 */
export interface PackageResponse {
  id: number;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly?: number;
  isActive: boolean;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt?: string;
  trainerId: string;
  isAnnual: boolean;
  promoCode?: string;
  programIds: number[];
}

/**
 * PackageCreateRequest DTO - For create/update operations
 * Validation Rules:
 * - name: Required, 3-100 characters
 * - description: Optional, max 500 characters
 * - priceMonthly: Required, 0.01-100000
 * - priceYearly: Optional, 0.01-100000
 * - promoCode: Optional, 3-20 characters
 * - trainerId: Required
 */
export interface PackageCreateRequest {
  trainerId: number | string;
  name: string;
  description?: string;
  priceMonthly: number;
  priceYearly?: number;
  isActive?: boolean;
  thumbnailUrl?: string;
  programIds?: number[];
  isAnnual?: boolean;
  promoCode?: string;
}

/** Legacy Package interface for backward compatibility */
export interface Package extends PackageResponse {}

@Injectable({ providedIn: 'root' })
export class PackageService {
  private readonly apiUrl = `${environment.apiUrl}/trainer/Packages`;
  private selectedPackage$ = new BehaviorSubject<PackageResponse | null>(null);

  constructor(private http: HttpClient) {}

  // ============ API ENDPOINTS ============

  /**
   * Get all packages (public endpoint - no auth required)
   * GET /api/trainer/Packages
   * Returns: PackageResponse[]
   */
  getAllPackages(): Observable<PackageResponse[]> {
    return this.http.get<PackageResponse[]>(this.apiUrl)
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Get package by ID (public endpoint - no auth required)
   * GET /api/trainer/Packages/{id}
   * Returns: PackageResponse
   */
  getPackageById(packageId: number): Observable<PackageResponse> {
    if (!this.isValidId(packageId)) {
      return throwError(() => new Error('Invalid package ID. Must be a positive integer.'));
    }
    return this.http.get<PackageResponse>(`${this.apiUrl}/${packageId}`)
      .pipe(
        tap(pkg => this.selectedPackage$.next(pkg)),
        catchError(err => this.handleError(err))
      );
  }

  /**
   * Get packages by trainer (public endpoint - no auth required)
   * GET /api/trainer/Packages/byTrainer/{trainerId}
   * Returns: PackageResponse[]
   */
  getPackagesByTrainer(trainerId: number | string): Observable<PackageResponse[]> {
    return this.http.get<PackageResponse[]>(`${this.apiUrl}/byTrainer/${trainerId}`)
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Create new package (requires auth in production)
   * POST /api/trainer/Packages
   * Status: 201 Created
   * Returns: PackageResponse
   */
  createPackage(request: Partial<PackageCreateRequest>): Observable<PackageResponse> {
    const payload = this.validateCreateRequest(request as PackageCreateRequest);
    return this.http.post<PackageResponse>(this.apiUrl, payload)
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Update package (requires auth in production)
   * PUT /api/trainer/Packages/{id}
   * Status: 200 OK
   * Returns: PackageResponse
   */
  updatePackage(packageId: number, request: Partial<PackageCreateRequest>): Observable<PackageResponse> {
    if (!this.isValidId(packageId)) {
      return throwError(() => new Error('Invalid package ID. Must be a positive integer.'));
    }
    return this.http.put<PackageResponse>(`${this.apiUrl}/${packageId}`, request)
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Delete package (soft delete - requires auth in production)
   * DELETE /api/trainer/Packages/{id}
   * Status: 204 No Content
   */
  deletePackage(packageId: number): Observable<void> {
    if (!this.isValidId(packageId)) {
      return throwError(() => new Error('Invalid package ID. Must be a positive integer.'));
    }
    return this.http.delete<void>(`${this.apiUrl}/${packageId}`)
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Toggle package active/inactive status
   * PATCH /api/trainer/Packages/toggle-active/{id}
   * Status: 204 No Content
   */
  toggleActiveStatus(packageId: number): Observable<void> {
    if (!this.isValidId(packageId)) {
      return throwError(() => new Error('Invalid package ID. Must be a positive integer.'));
    }
    return this.http.patch<void>(`${this.apiUrl}/toggle-active/${packageId}`, {})
      .pipe(catchError(err => this.handleError(err)));
  }

  // ============ STATE MANAGEMENT ============

  getSelectedPackage$(): Observable<PackageResponse | null> {
    return this.selectedPackage$.asObservable();
  }

  setSelectedPackage(pkg: PackageResponse): void {
    this.selectedPackage$.next(pkg);
  }

  clearSelection(): void {
    this.selectedPackage$.next(null);
  }

  // ============ LEGACY COMPATIBILITY ============

  getMyPackages(trainerId: string): Observable<PackageResponse[]> {
    return this.getPackagesByTrainer(trainerId);
  }

  getPackageDetails(packageId: number): Observable<PackageResponse> {
    return this.getPackageById(packageId);
  }

  // ============ PRIVATE HELPERS ============

  private isValidId(id: number): boolean {
    return Number.isInteger(id) && id > 0;
  }

  private validateCreateRequest(request: PackageCreateRequest): PackageCreateRequest {
    if (!request.name || request.name.trim().length < 3) {
      throw new Error('Name is required and must be at least 3 characters.');
    }
    if (!request.priceMonthly || request.priceMonthly < 0.01) {
      throw new Error('Monthly price is required and must be at least 0.01.');
    }
    // Keep trainerId if provided (allow explicit trainer profile id from frontend)
    return request;
  }

  private handleError(error: HttpErrorResponse) {
    let message = 'An unexpected error occurred';

    if (error.status === 404) {
      message = 'Package not found.';
    } else if (error.status === 400) {
      message = error.error?.message || 'Invalid request. Please check your input.';
    } else if (error.status === 401) {
      message = 'Authentication required. Please log in.';
    } else if (error.status === 403) {
      message = 'You are not authorized to perform this action.';
    } else if (error.status === 409) {
      message = 'Conflict: Package already exists or update conflict.';
    } else if (error.status === 0) {
      message = 'Network error. Please check your connection.';
    } else if (error.error?.message) {
      message = error.error.message;
    }

    console.error('PackageService Error:', message, error);
    return throwError(() => new Error(message));
  }
}
