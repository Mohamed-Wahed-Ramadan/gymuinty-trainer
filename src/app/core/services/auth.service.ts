import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { LoginRequest, RegisterRequest, AuthResponse, User, GoogleAuthRequest, ForgotPasswordRequest, ForgotPasswordResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'https://gymunity-fp-apis.runasp.net/api';
  private readonly TOKEN_KEY = 'gymunity_trainer_token';
  private readonly USER_KEY = 'gymunity_trainer_user';
  private readonly USER_ID_KEY = 'gymunity_trainer_userId';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) {
    this.checkTokenValidity();
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/Account/login`, request)
      .pipe(
        tap(response => this.handleAuthResponse(response))
      );
  }

  register(request: FormData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/Account/register`, request)
      .pipe(
        tap(response => this.handleAuthResponse(response))
      );
  }

  googleAuth(request: GoogleAuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/Account/google-auth`, request)
      .pipe(
        tap(response => this.handleAuthResponse(response))
      );
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(`${this.API_URL}/Account/send-reset-password-link`, request);
  }

  // Step 1: Send Reset Password Link
  sendResetPasswordLink(request: { email: string }): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/Account/send-reset-password-link`, request);
  }

  // Step 2: Reset Password
  resetPassword(request: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/Account/reset-password`, request)
      .pipe(
        tap(response => this.handleAuthResponse(response))
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.USER_ID_KEY);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  hasToken(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isTrainer(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'Trainer';
  }

  isClient(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'Client';
  }

  private handleAuthResponse(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.token);
    let userId = response.id;
    if (!userId) {
      try {
        const payload = response.token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        userId = decoded.userId || decoded.sub || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || '';
      } catch (e) {
        userId = '';
      }
    }
    localStorage.setItem(this.USER_ID_KEY, userId);
    const user: User = {
      id: userId,
      name: response.name,
      userName: response.userName,
      email: response.email,
      role: response.role,
      profilePhotoUrl: response.profilePhotoUrl
    };
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  private checkTokenValidity(): void {
    // In a real app, you might decode the JWT and check expiration
    if (this.hasToken()) {
      this.isAuthenticatedSubject.next(true);
    }
  }

  // Get userId from localStorage first, then try to extract from token
  getUserIdFromToken(): string | null {
    // Try to get from localStorage first (most reliable)
    const storedUserId = localStorage.getItem(this.USER_ID_KEY);
    if (storedUserId) return storedUserId;

    // Fallback to extracting from token
    const token = this.getToken();
    if (!token) return null;
    
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      // Try multiple common claim names
      return decoded.userId || decoded.sub || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || null;
    } catch (e) {
      console.error('Error decoding token:', e);
      return null;
    }
  }

  private extractUserIdFromToken(token: string): string {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      // Try multiple common claim names
      return decoded.userId || decoded.sub || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || '';
    } catch (e) {
      console.error('Error decoding token:', e);
      return '';
    }
  }
}
