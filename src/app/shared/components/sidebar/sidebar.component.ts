import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService } from '../../../core/services/translation.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @Input() isOpen = true;
  @Output() toggle = new EventEmitter<void>();
  @Output() collapsedChange = new EventEmitter<boolean>();
  collapsed = false;
  overlayActive = false;
  isMobileSize = typeof window !== 'undefined' && window.innerWidth <= 768;
  settingsMenuOpen = false;
  direction = 'ltr';

  constructor(
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private translationService: TranslationService
  ) {
    this.direction = this.translationService.getDirection();
    this.translationService.currentLanguage$.subscribe(() => {
      this.direction = this.translationService.getDirection();
      this.cdr.markForCheck();
    });
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this.isMobileSize = window.innerWidth <= 768;
        this.cdr.markForCheck();
      });
    }
  }

  toggleSidebar(): void {
    this.toggle.emit();
  }

  toggleCollapse(ev?: Event): void {
    if (ev) ev.stopPropagation();
    // On small screens, toggle overlay mode so the sidebar appears above content
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      this.overlayActive = !this.overlayActive;
      console.log('toggleCollapse mobile:', this.overlayActive);
      // trigger change detection for the template to reflect overlayActive change
      this.cdr.markForCheck();
      return;
    }

    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }

  goTo(target: string): void {
    if (target === 'programs' || target === 'packages') {
      this.router.navigate(['/dashboard'], { queryParams: { tab: target } });
      return;
    }
    // allow passing absolute paths or simple segments
    if (target.startsWith('/')) this.router.navigateByUrl(target);
    else this.router.navigate([target]);
  }

  toggleSettingsMenu(): void {
    this.settingsMenuOpen = !this.settingsMenuOpen;
  }

  navigateToSettings(tab: 'update-profile' | 'change-password' | 'reset-password' | 'delete-profile'): void {
    this.settingsMenuOpen = false;
    this.router.navigate(['/dashboard/settings'], { 
      queryParams: { tab } 
    });
  }

  getDirection(): string {
    return this.direction;
  }
}
