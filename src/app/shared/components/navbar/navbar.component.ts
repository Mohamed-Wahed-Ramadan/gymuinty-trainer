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
  signupDropdownOpen = false;
  signinDropdownOpen = false;
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
    // Close dropdown on outside click
    document.addEventListener('click', this.handleOutsideClick);
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
    // Force change detection to ensure UI updates immediately
    setTimeout(() => {
      this.currentLanguage = this.translationService.getLanguage();
      this.cdr.detectChanges();
    }, 0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('click', this.handleOutsideClick);
  }

  toggleSignupDropdown(): void {
    this.signupDropdownOpen = !this.signupDropdownOpen;
  }

  signupAsTrainer(): void {
    this.signupDropdownOpen = false;
    this.router.navigate(['/auth/login']);
  }

  signupAsClient(): void {
    this.signupDropdownOpen = false;
    window.open('https://gymunity-client.netlify.app', '_blank');
  }

  handleOutsideClick = (event: MouseEvent) => {
    const signupDropdown = document.querySelector('.signup-dropdown-container');
    const signinDropdown = document.querySelector('.signin-dropdown-container');
    let changed = false;
    if (signupDropdown && !signupDropdown.contains(event.target as Node)) {
      if (this.signupDropdownOpen) changed = true;
      this.signupDropdownOpen = false;
    }
    if (signinDropdown && !signinDropdown.contains(event.target as Node)) {
      if (this.signinDropdownOpen) changed = true;
      this.signinDropdownOpen = false;
    }
    if (changed) this.cdr.detectChanges();
  };

  toggleSigninDropdown(): void {
    this.signinDropdownOpen = !this.signinDropdownOpen;
  }

  signinAsTrainer(): void {
    this.signinDropdownOpen = false;
    this.router.navigate(['/auth/login']);
  }

  signinAsClient(): void {
    this.signinDropdownOpen = false;
    window.open('https://gymunity-client.netlify.app', '_blank');
  }
}

