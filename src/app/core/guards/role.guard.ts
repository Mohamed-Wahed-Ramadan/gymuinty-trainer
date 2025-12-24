import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.getCurrentUser();

  if (!user) {
    router.navigate(['/auth/login']);
    return false;
  }

  const requiredRole = route.data['role'] as string;

  if (requiredRole && user.role !== requiredRole) {
    router.navigate(['/unauthorized']);
    return false;
  }

  return true;
};
