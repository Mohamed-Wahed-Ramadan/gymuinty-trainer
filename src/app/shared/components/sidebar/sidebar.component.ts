import { Component, Input, Output, EventEmitter } from '@angular/core';
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

  constructor(private auth: AuthService, private router: Router) {}

  toggleSidebar(): void {
    this.toggle.emit();
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
