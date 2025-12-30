import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @Input() isOpen = true;
  @Output() toggle = new EventEmitter<void>();
  @Output() collapsedChange = new EventEmitter<boolean>();
  // local collapsed state: when true show icon-only sidebar
  collapsed = false;
  // when true the sidebar will act as an overlay (mobile only)
  overlayActive = false;
  // check if window width is mobile size
  isMobileSize = typeof window !== 'undefined' && window.innerWidth <= 768;

  constructor(private auth: AuthService, private router: Router, private cdr: ChangeDetectorRef) {
    // Update isMobileSize on window resize
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
}
