import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ExerciseLibraryComponent } from './features/exercise-library/exercise-library.component';
import { InboxComponent } from './features/inbox/inbox.component';
import { ProfileComponent } from './features/profile/profile.component';
import { HomeComponent } from './features/home/home.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: HomeComponent
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        component: LoginComponent
      },
      {
        path: 'register',
        component: RegisterComponent
      },
      {
        path: 'forgot-password',
        component: ForgotPasswordComponent
      }
    ]
  },
  {
    path: 'dashboard',
    canActivate: [authGuard, roleGuard],
    data: { role: 'Trainer' },
    component: DashboardComponent
  },
  {
    path: 'exercise-library',
    canActivate: [authGuard, roleGuard],
    data: { role: 'Trainer' },
    component: ExerciseLibraryComponent
  },
  {
    path: 'inbox',
    canActivate: [authGuard, roleGuard],
    data: { role: 'Trainer' },
    component: InboxComponent
  },
  {
    path: 'profile',
    canActivate: [authGuard, roleGuard],
    data: { role: 'Trainer' },
    component: ProfileComponent
  },
  {
    path: '**',
    redirectTo: '/home'
  }
];

