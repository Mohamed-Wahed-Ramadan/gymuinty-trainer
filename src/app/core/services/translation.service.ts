import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private readonly LANG_KEY = 'gymunity_language';
  private defaultLanguage = 'en';
  private currentLanguageSubject = new BehaviorSubject<string>(this.getStoredLanguage());
  public currentLanguage$ = this.currentLanguageSubject.asObservable();

  constructor(
    private translate: TranslateService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Set available languages
    this.translate.addLangs(['en', 'ar']);
    this.translate.setDefaultLang(this.defaultLanguage);

    // Initialize with stored language
    const storedLang = this.getStoredLanguage();
    this.translate.use(storedLang);
    this.updateDirection(storedLang);
  }

  private getStoredLanguage(): string {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.LANG_KEY) || this.defaultLanguage;
    }
    return this.defaultLanguage;
  }

  setLanguage(language: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.LANG_KEY, language);
    }
    this.translate.use(language).subscribe(() => {
      // Ensure translation is loaded before updating
      this.currentLanguageSubject.next(language);
      this.updateDirection(language);
    });
  }

  getLanguage(): string {
    return this.currentLanguageSubject.value;
  }

  private updateDirection(language: string): void {
    if (isPlatformBrowser(this.platformId)) {
      const dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.setAttribute('dir', dir);
      document.documentElement.setAttribute('lang', language);
      document.body.setAttribute('dir', dir);
    }
  }

  isArabic(): boolean {
    return this.getLanguage() === 'ar';
  }

  isEnglish(): boolean {
    return this.getLanguage() === 'en';
  }

  // For backward compatibility with components using get()
  get(key: string, params?: any): string {
    return this.translate.instant(key, params);
  }

  // Get current direction
  getDirection(): string {
    return this.isArabic() ? 'rtl' : 'ltr';
  }
}
