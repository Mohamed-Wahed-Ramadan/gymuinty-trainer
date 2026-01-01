import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { TrainerProfile } from '../models/trainer.models';

export interface TrainerProfileResponse {
  id: number;
  updatedAt: string | null;
  createdAt: string;
  userId: string;
  userName: string;
  handle: string;
  bio: string;
  coverImageUrl: string | null;
  videoIntroUrl: string | null;
  brandingColors: string | null;
  isVerified: boolean;
  verifiedAt: string | null;
  ratingAverage: number;
  totalClients: number;
  yearsExperience: number;
  statusImageUrl: string | null;
  statusDescription: string | null;
}

export interface SubscriberResponse {
  clientId: string;
  clientName: string;
  clientEmail: string;
  packageName: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  status: SubscriptionStatus;
}

export enum SubscriptionStatus {
  Active = 'Active',
  Unpaid = 'Unpaid',
  Canceled = 'Canceled',
  Expired = 'Expired'
}

export interface UpdateStatusRequest {
  statusDescription?: string;
}

@Injectable({ providedIn: 'root' })
export class TrainerService {
  private readonly baseUrl = `${environment.apiUrl}/trainer/TrainerProfile`;

  constructor(private http: HttpClient) {}

  // Get profile by user ID
  getProfileByUserId(userId: string): Observable<TrainerProfileResponse> {
    return this.http.get<TrainerProfileResponse>(`${this.baseUrl}/UserId/${userId}`)
      .pipe(
        map(profile => this.resolveImageUrls(profile)),
        catchError(this.handleError)
      );
  }

  // Get profile by ID
  getProfileById(profileId: number): Observable<TrainerProfileResponse> {
    return this.http.get<TrainerProfileResponse>(`${this.baseUrl}/Id/${profileId}`)
      .pipe(
        map(profile => this.resolveImageUrls(profile)),
        catchError(this.handleError)
      );
  }

  // Create profile
  createProfile(formData: FormData): Observable<TrainerProfileResponse> {
    return this.http.post<TrainerProfileResponse>(this.baseUrl, formData)
      .pipe(
        map(profile => this.resolveImageUrls(profile)),
        catchError(this.handleError)
      );
  }

  // Update profile
  updateProfile(profileId: number, formData: FormData): Observable<TrainerProfileResponse> {
    return this.http.put<TrainerProfileResponse>(`${this.baseUrl}/${profileId}`, formData)
      .pipe(
        map(profile => this.resolveImageUrls(profile)),
        catchError(this.handleError)
      );
  }

  // Update status
  updateStatus(profileId: number, formData: FormData): Observable<TrainerProfileResponse> {
    return this.http.put<TrainerProfileResponse>(`${this.baseUrl}/Status/${profileId}`, formData)
      .pipe(
        map(profile => this.resolveImageUrls(profile)),
        catchError(this.handleError)
      );
  }

  // Get subscribers by trainer profile ID
  getSubscribers(): Observable<SubscriberResponse[]> {
    return this.http.get<SubscriberResponse[]>(`${this.baseUrl}/subscribers`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Delete profile
  deleteProfile(profileId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${profileId}`)
      .pipe(catchError(this.handleError));
  }

  // Resolve image URLs
  private resolveImageUrls(profile: TrainerProfileResponse): TrainerProfileResponse {
    return {
      ...profile,
      coverImageUrl: this.resolveImageUrl(profile.coverImageUrl),
      statusImageUrl: this.resolveImageUrl(profile.statusImageUrl)
    };
  }

  private resolveImageUrl(url: string | null): string | null {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const base = environment.apiUrl.replace(/\/$/, '');
    return `${base}/${url.replace(/^\/+/, '')}`;
  }

  // Error handling
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error) {
      if (error.error.message) {
        errorMessage = error.error.message;
      } else if (error.error.errors && Array.isArray(error.error.errors)) {
        errorMessage = error.error.errors.join(', ');
      }
    } else if (error.status === 0) {
      errorMessage = 'Network error. Please check your connection.';
    }
    
    console.error('TrainerService Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
