export interface LoginRequest {
  emailOrUserName: string;
  password: string;
}

export interface RegisterRequest {
  userName: string;
  email: string;
  fullName: string;
  password: string;
  confirmPassword: string;
  profilePhoto: File;
  role: number; // 2 for Trainer
}

export interface AuthResponse {
  id: string;
  name: string;
  userName: string;
  email: string;
  role: string;
  profilePhotoUrl: string;
  token: string;
}

export interface GoogleAuthRequest {
  idToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  statusCode: number;
  message: string;
}

export interface User {
  id: string;
  name: string;
  userName: string;
  email: string;
  role: string;
  profilePhotoUrl: string;
}
