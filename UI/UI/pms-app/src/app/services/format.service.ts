import { Injectable, inject } from '@angular/core';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class FormatService {
  private storageService = inject(StorageService);

  /**
   * Format currency amount based on property settings
   */
  formatCurrency(amount: number): string {
    const property = this.storageService.getPropertyInfo();
    const currency = property?.currency || 'USD';
    
    const currencySymbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'INR': '₹',
      'AUD': 'A$',
      'CAD': 'C$',
      'JPY': '¥',
      'CNY': '¥',
      'CHF': 'CHF',
      'SGD': 'S$'
    };

    const symbol = currencySymbols[currency] || currency;
    
    // Format with 2 decimal places for most currencies, 0 for JPY/CNY
    const decimals = ['JPY', 'CNY'].includes(currency) ? 0 : 2;
    const formatted = amount.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    return `${symbol}${formatted}`;
  }

  /**
   * Get currency symbol
   */
  getCurrencySymbol(): string {
    const property = this.storageService.getPropertyInfo();
    const currency = property?.currency || 'USD';
    
    const currencySymbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'INR': '₹',
      'AUD': 'A$',
      'CAD': 'C$',
      'JPY': '¥',
      'CNY': '¥',
      'CHF': 'CHF',
      'SGD': 'S$'
    };

    return currencySymbols[currency] || currency;
  }

  /**
   * Format date in property timezone
   */
  formatDate(date: string | Date, format: 'short' | 'medium' | 'long' = 'medium'): string {
    const property = this.storageService.getPropertyInfo();
    const timezone = property?.timezone || 'America/New_York';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      ...(format === 'short' && {
        year: '2-digit',
        month: 'numeric',
        day: 'numeric'
      }),
      ...(format === 'medium' && {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      ...(format === 'long' && {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      })
    };

    try {
      return new Intl.DateTimeFormat('en-US', options).format(dateObj);
    } catch (error) {
      return dateObj.toLocaleDateString();
    }
  }

  /**
   * Format time in property timezone
   */
  formatTime(time: string | Date, format: 'short' | 'medium' = 'short'): string {
    const property = this.storageService.getPropertyInfo();
    const timezone = property?.timezone || 'America/New_York';
    
    const dateObj = typeof time === 'string' ? new Date(time) : time;
    
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      ...(format === 'medium' && { second: '2-digit' }),
      hour12: true
    };

    try {
      return new Intl.DateTimeFormat('en-US', options).format(dateObj);
    } catch (error) {
      return dateObj.toLocaleTimeString();
    }
  }

  /**
   * Format datetime in property timezone
   */
  formatDateTime(datetime: string | Date, dateFormat: 'short' | 'medium' = 'medium', timeFormat: 'short' | 'medium' = 'short'): string {
    const property = this.storageService.getPropertyInfo();
    const timezone = property?.timezone || 'America/New_York';
    
    const dateObj = typeof datetime === 'string' ? new Date(datetime) : datetime;
    
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      year: 'numeric',
      month: dateFormat === 'short' ? 'numeric' : 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      ...(timeFormat === 'medium' && { second: '2-digit' }),
      hour12: true
    };

    try {
      return new Intl.DateTimeFormat('en-US', options).format(dateObj);
    } catch (error) {
      return dateObj.toLocaleString();
    }
  }

  /**
   * Get current date/time in property timezone
   */
  getCurrentDateTime(): Date {
    return new Date();
  }

  /**
   * Get timezone abbreviation
   */
  getTimezoneAbbr(): string {
    const property = this.storageService.getPropertyInfo();
    const timezone = property?.timezone || 'America/New_York';
    
    const timezoneMap: { [key: string]: string } = {
      'America/New_York': 'EST/EDT',
      'America/Chicago': 'CST/CDT',
      'America/Denver': 'MST/MDT',
      'America/Los_Angeles': 'PST/PDT',
      'America/Anchorage': 'AKST/AKDT',
      'Pacific/Honolulu': 'HST',
      'Europe/London': 'GMT/BST',
      'Europe/Paris': 'CET/CEST',
      'Asia/Dubai': 'GST',
      'Asia/Kolkata': 'IST',
      'Asia/Singapore': 'SGT',
      'Asia/Tokyo': 'JST',
      'Australia/Sydney': 'AEDT/AEST'
    };

    return timezoneMap[timezone] || timezone;
  }

  /**
   * Parse currency input (remove symbols and formatting)
   */
  parseCurrency(value: string): number {
    if (!value) return 0;
    // Remove currency symbols, commas, and spaces
    const cleaned = value.replace(/[^\d.-]/g, '');
    return parseFloat(cleaned) || 0;
  }
}
