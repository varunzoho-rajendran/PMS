import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

/**
 * Localization service for managing translations
 */
@Injectable({
  providedIn: 'root'
})
export class LocalizationService {
  private translations = signal<any>({
    common: { submit: "Submit", cancel: "Cancel", save: "Save", delete: "Delete", edit: "Edit", view: "View", search: "Search", filter: "Filter", loading: "Loading...", retry: "Retry", close: "Close", refresh: "Refresh", logout: "Logout", login: "Login", required: "required", optional: "Optional" },
    navigation: { dashboard: "Dashboard", guest: "Guest", reservation: "Reservation", folio: "Folio", charges: "Post Charges", payments: "Payments", reports: "Reports", property: "Property Info", users: "Users", folioStatement: "Folio Statement", noAccess: "No access to this page" },
    icons: { dashboard: "📊", guest: "👤", reservation: "🏨", folio: "📋", charges: "💰", payments: "💳", reports: "📈", property: "🏢", users: "👥", logout: "🚪", date: "📅", time: "🕐", add: "➕", list: "📋", checkIn: "📥", checkOut: "📤", revenue: "💰", occupancy: "📊", confirmed: "✅", pending: "⏳", csv: "📊", pdf: "📄", search: "🔍", location: "📍", star: "⭐" },
    login: { title: "Property Management System", subtitle: "Welcome back! Please login to your account", username: "Username", password: "Password", loginButton: "Login", usernameRequired: "Username is required", passwordRequired: "Password is required", invalidCredentials: "Invalid username or password", bothRequired: "Please enter both username and password" },
    property: { setupProperty: "Setup Property" }
  });
  private currentLanguage = signal<string>('en');
  private readonly LANGUAGE_KEY = 'pms_language';
  private isLoaded = signal(true);

  constructor(private http: HttpClient) {
    this.loadLanguageAsync();
  }

  private async loadLanguageAsync() {
    try {
      const lang = this.getSavedLanguage();
      const data = await fetch(`/assets/i18n/${lang}.json`).then(r => r.json());
      this.translations.set(data);
      this.currentLanguage.set(lang);
    } catch (err) {
      console.warn('Using default translations, could not load from file:', err);
    }
  }

  private getSavedLanguage(): string {
    return localStorage.getItem(this.LANGUAGE_KEY) || 'en';
  }

  async loadLanguage(lang: string): Promise<void> {
    try {
      const data = await fetch(`/assets/i18n/${lang}.json`).then(r => r.json());
      this.translations.set(data);
      this.currentLanguage.set(lang);
      localStorage.setItem(this.LANGUAGE_KEY, lang);
      this.isLoaded.set(true);
    } catch (err) {
      console.error('Failed to load language file:', err);
      if (lang !== 'en') {
        await this.loadLanguage('en');
      }
    }
  }

  /**
   * Get translation for a key using dot notation
   * Example: t('navigation.dashboard') or t('common.submit')
   */
  t(key: string, params?: any[]): string {
    const translations = this.translations();
    
    // If translations not loaded yet, return empty string
    if (!translations || Object.keys(translations).length === 0) {
      return '';
    }

    const keys = key.split('.');
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }

    // Replace parameters if provided
    if (params && Array.isArray(params)) {
      params.forEach((param, index) => {
        value = value.replace(`{${index}}`, param);
      });
    }

    return value || key;
  }

  /**
   * Get icon for a specific key
   */
  icon(key: string): string {
    return this.t(`icons.${key}`);
  }

  /**
   * Get current language
   */
  getCurrentLanguage(): string {
    return this.currentLanguage();
  }

  /**
   * Check if translations are loaded
   */
  isTranslationsLoaded(): boolean {
    return this.isLoaded();
  }

  /**
   * Get all translations
   */
  getTranslations(): any {
    return this.translations();
  }

  /**
   * Change language
   */
  changeLanguage(lang: string) {
    this.loadLanguage(lang);
  }
}
