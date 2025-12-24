import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private readonly LANG_KEY = 'gymunity_language';
  private defaultLanguage = 'en';
  private currentLanguageSubject = new BehaviorSubject<string>(this.getStoredLanguage());
  public currentLanguage$ = this.currentLanguageSubject.asObservable();

  private translations: { [key: string]: any } = {};

  constructor() {
    this.loadTranslations();
  }

  private getStoredLanguage(): string {
    return localStorage.getItem(this.LANG_KEY) || this.defaultLanguage;
  }

  private async loadTranslations(): Promise<void> {
    try {
      const lang = this.currentLanguageSubject.value;
      const response = await fetch(`/assets/i18n/${lang}.json`);
      if (response.ok) {
        this.translations[lang] = await response.json();
      }
    } catch (error) {
      console.error('Error loading translations:', error);
    }
  }

  setLanguage(language: string): void {
    localStorage.setItem(this.LANG_KEY, language);
    this.currentLanguageSubject.next(language);
    this.loadTranslations();
  }

  getLanguage(): string {
    return this.currentLanguageSubject.value;
  }

  get(key: string, params?: any): string {
    const lang = this.currentLanguageSubject.value;
    let translation = this.getNestedProperty(this.translations[lang] || {}, key);

    if (!translation) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }

    if (params) {
      Object.keys(params).forEach(param => {
        translation = translation.replace(`:${param}`, params[param]);
      });
    }

    return translation;
  }

  isArabic(): boolean {
    return this.getLanguage() === 'ar';
  }

  isEnglish(): boolean {
    return this.getLanguage() === 'en';
  }

  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }
}
