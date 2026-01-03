import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthResponse } from '../models';

export interface UpdateProfileRequest {
  userName: string;
  email: string;
  fullName: string;
  profilePhoto?: File;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Update user profile (for both trainer and client)
   * PUT /api/account/update-profile
   */
  updateProfile(request: UpdateProfileRequest): Observable<AuthResponse> {
    const formData = new FormData();
    formData.append('userName', request.userName);
    formData.append('email', request.email);
    formData.append('fullName', request.fullName);
    
    if (request.profilePhoto) {
      formData.append('profilePhoto', request.profilePhoto);
    }

    return this.http.put<AuthResponse>(
      `${this.API_URL}/account/update-profile`,
      formData
    );
  }

  /**
   * Change password
   * PUT /api/account/change-password
   */
  changePassword(request: ChangePasswordRequest): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(
      `${this.API_URL}/account/change-password`,
      request
    );
  }

  /**
   * Reset password (without token authentication)
   * POST /api/account/reset-password
   */
  resetPassword(request: ResetPasswordRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.API_URL}/account/reset-password`,
      request
    );
  }

  /**
   * Delete trainer profile (soft delete)
   * DELETE /api/trainer/trainerprofile/{id}
   */
  deleteTrainerProfile(id: number): Observable<any> {
    return this.http.delete<any>(
      `${this.API_URL}/trainer/trainerprofile/${id}`
    );
  }
}
