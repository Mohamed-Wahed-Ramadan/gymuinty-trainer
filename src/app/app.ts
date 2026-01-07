import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { NotificationsComponent } from './shared/components/notifications/notifications.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { AuthService } from './core/services/auth.service';
import { TranslationService } from './core/services/translation.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, NotificationsComponent, NavbarComponent, TranslateModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('Gymunity Trainer');
  protected isSidebarOpen = signal(true);
  protected isSidebarCollapsed = signal(true);
  protected isLoggedIn = signal(false);
  protected currentRoute = signal('');
  protected currentDirection = signal('ltr');

  constructor(
    private authService: AuthService,
    public translationService: TranslationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialize translation service
    this.translationService.currentLanguage$.subscribe((lang) => {
      // Language updated
      this.currentDirection.set(this.translationService.getDirection());
    });

    // expose current language observable for templates
    this.currentLanguage$ = this.translationService.currentLanguage$;

    // Check authentication
    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isLoggedIn.set(isAuth);
    });

    // Track current route
    this.router.events.subscribe(() => {
      this.currentRoute.set(this.router.url);
    });
  }

  // observable for template binding (initialized in ngOnInit)
  public currentLanguage$!: Observable<string>;

  getDirection(): string {
    return this.translationService.getDirection();
  }

  onSidebarCollapsed(collapsed: boolean): void {
    this.isSidebarCollapsed.set(collapsed);
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }

  toggleLanguage(): void {
    this.translationService.toggleLanguage();
  }
}
