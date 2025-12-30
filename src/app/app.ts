import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { NotificationsComponent } from './shared/components/notifications/notifications.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { AuthService } from './core/services/auth.service';
import { TranslationService } from './core/services/translation.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, NotificationsComponent, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('Gymunity Trainer');
  protected isSidebarOpen = signal(true);
  protected isSidebarCollapsed = signal(true);
  protected isLoggedIn = signal(false);
  protected currentRoute = signal('');

  constructor(
    private authService: AuthService,
    private translationService: TranslationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialize translation service
    this.translationService.currentLanguage$.subscribe(() => {
      // Language updated
    });

    // Check authentication
    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isLoggedIn.set(isAuth);
    });

    // Track current route
    this.router.events.subscribe(() => {
      this.currentRoute.set(this.router.url);
    });
  }

  onSidebarCollapsed(collapsed: boolean): void {
    this.isSidebarCollapsed.set(collapsed);
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}
