import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// ==================== INTERFACES ====================

/**
 * Program reference in Package response
 */
export interface ProgramInPackage {
  id: number;
  title: string;
  description: string;
  type: number;
  durationWeeks: number;
  price?: number;
  isPublic: boolean;
  maxClients?: number;
  thumbnailUrl?: string;
  createdAt: string;
  trainerProfileId?: number;
  trainerUserName?: string;
  trainerHandle?: string;
}

/**
 * PackageResponse DTO - Complete package information
 * Maps to: ITI.Gymunity.FP.Application/DTOs/Trainer/PackageResponse.cs
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
  programs?: ProgramInPackage[];
}

/**
 * PackageCreateRequest DTO - For create/update operations
 * Validation Rules:
 * - name: Required, 3-100 characters
 * - description: Optional, max 500 characters
 * - priceMonthly: Required, 0.01-100000
 * - priceYearly: Optional, 0.01-100000
 * - promoCode: Optional, 3-20 characters
 * - trainerId/trainerProfileId: Required
 */
export interface PackageCreateRequest {
  trainerProfileId?: number | string;
  trainerId?: number | string;
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

/**
 * V2 Package Create Request - with program names support
 */
export interface PackageCreateRequestV2 extends PackageCreateRequest {
  programNames?: string[];
}

/** Legacy Package interface for backward compatibility */
export interface Package extends PackageResponse {}

// ==================== SERVICE ====================

@Injectable({ providedIn: 'root' })
export class PackageService {
  private readonly apiUrl = `${environment.apiUrl}/trainer/Packages`;
  private selectedPackage$ = new BehaviorSubject<PackageResponse | null>(null);

  constructor(private http: HttpClient) {}

  // ============ API ENDPOINTS ============

  /**
   * Get all packages (public endpoint)
   * GET /api/trainer/Packages
   * Returns: PackageResponse[]
   */
  getAllPackages(): Observable<PackageResponse[]> {
    return this.http.get<PackageResponse[]>(this.apiUrl)
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Get package by ID (public endpoint)
   * GET /api/trainer/Packages/{id}
   * Returns: PackageResponse (includes Programs array)
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
   * Get packages by trainer (public endpoint)
   * GET /api/trainer/Packages/byTrainer/{trainerId}
   * Returns: PackageResponse[] (each includes Programs array)
   */
  getPackagesByTrainer(trainerId: number | string): Observable<PackageResponse[]> {
    return this.http.get<PackageResponse[]>(`${this.apiUrl}/byTrainer/${trainerId}`)
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Create new package
   * POST /api/trainer/Packages
   * Status: 201 Created
   * Returns: PackageResponse
   */
  createPackage(request: Partial<PackageCreateRequest>): Observable<PackageResponse> {
    const payload = this.normalizeRequest(request);
    return this.http.post<PackageResponse>(this.apiUrl, payload)
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Create package with V2 DTO (supports program names)
   * POST /api/trainer/Packages
   * Status: 201 Created
   * Returns: PackageResponse
   */
  createPackageV2(request: Partial<PackageCreateRequestV2>): Observable<PackageResponse> {
    const payload = this.normalizeRequest(request);
    return this.http.post<PackageResponse>(this.apiUrl, payload)
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Update package
   * PUT /api/trainer/Packages/{id}
   * Status: 200 OK
   * Returns: PackageResponse
   */
  updatePackage(packageId: number, request: Partial<PackageCreateRequest>): Observable<PackageResponse> {
    if (!this.isValidId(packageId)) {
      return throwError(() => new Error('Invalid package ID. Must be a positive integer.'));
    }
    const payload = this.normalizeRequest(request);
    return this.http.put<PackageResponse>(`${this.apiUrl}/${packageId}`, payload)
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Delete package
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

  /**
   * Normalize request to use trainerProfileId as key
   * Backend expects trainerProfileId, but allow trainerId for compatibility
   */
  private normalizeRequest(request: any): any {
    const normalized = { ...request };
    
    // Use trainerProfileId (backend convention)
    if (request.trainerId && !request.trainerProfileId) {
      normalized.trainerProfileId = request.trainerId;
      delete normalized.trainerId;
    }
    
    return normalized;
  }

  private isValidId(id: number): boolean {
    return Number.isInteger(id) && id > 0;
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
