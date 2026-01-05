import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService } from '../../../core/services/translation.service';
import { ChatService } from '../../../core/services/chat.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateModule } from '@ngx-translate/core';


@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, OnDestroy {
  currentLanguage = 'en';
  unreadMessagesCount = 0;
  isLoggedIn = false;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private authService: AuthService,
    private translationService: TranslationService,
    private chatService: ChatService
    , private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.translationService.currentLanguage$.subscribe(lang => {
      this.currentLanguage = lang;
      this.cdr.detectChanges();
    });

    // Listen to unread count changes
    this.chatService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadMessagesCount = count;
        this.cdr.detectChanges();
      });

    // Check if user is logged in
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.isLoggedIn = !!user && !!(user as any)?.userId;
        this.cdr.detectChanges();
      });
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  goToMessages(): void {
    this.router.navigate(['/inbox']);
  }

  toggleLanguage(): void {
    const newLang = this.currentLanguage === 'en' ? 'ar' : 'en';
    this.translationService.setLanguage(newLang);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

