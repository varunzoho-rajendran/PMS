import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StorageService } from './services/storage.service';
import { AuthService } from './services/auth.service';
import { WeatherService } from './services/weather.service';
import { LocalizationService } from './services/localization.service';
import { SwUpdateService } from './services/sw-update.service';
import { PropertyInfo } from './property/property.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('pms-app');
  private storageService = inject(StorageService);
  public authService = inject(AuthService);
  public i18n = inject(LocalizationService);
  private router = inject(Router);
  private weatherService = inject(WeatherService);
  private swUpdateService = inject(SwUpdateService);
  propertyInfo = signal<PropertyInfo | null>(null);
  
  // Date and time
  currentDate = signal('');
  currentTime = signal('');
  private timeInterval?: any;
  
  // Weather
  weatherData = signal<any>(null);
  weatherLoading = signal(false);

  ngOnInit() {
    this.loadPropertyInfo();
    this.updateDateTime();
    this.timeInterval = setInterval(() => this.updateDateTime(), 1000);
    
    // Initialize service worker update checking
    this.swUpdateService.init();
  }
  
  ngOnDestroy() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }
  
  updateDateTime() {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    this.currentDate.set(now.toLocaleDateString('en-US', options));
    this.currentTime.set(now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    }));
  }
  
  loadWeather() {
    const property = this.propertyInfo();
    if (property?.city) {
      this.weatherLoading.set(true);
      this.weatherService.getCurrentWeather(property.city, property.country).subscribe({
        next: (data: any) => {
          this.weatherData.set(data);
          this.weatherLoading.set(false);
        },
        error: () => {
          this.weatherLoading.set(false);
        }
      });
    }
  }

  loadPropertyInfo() {
    const property = this.storageService.getPropertyInfo();
    this.propertyInfo.set(property);
    if (property) {
      this.loadWeather();
      this.applyThemeAndFont(property);
    }
  }
  
  applyThemeAndFont(property: PropertyInfo) {
    // Apply font (with fallback to default)
    const font = property.font || 'system';
    document.documentElement.style.setProperty('--app-font', this.getFontFamily(font));
    
    // Apply theme (with fallback to default)
    const theme = property.theme || 'default';
    document.documentElement.setAttribute('data-theme', theme);
  }
  
  getFontFamily(font: string): string {
    const fontMap: { [key: string]: string } = {
      'system': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      'system-default': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      'arial': 'Arial, sans-serif',
      'helvetica': 'Helvetica, Arial, sans-serif',
      'times-new-roman': '"Times New Roman", Times, serif',
      'georgia': 'Georgia, serif',
      'verdana': 'Verdana, sans-serif',
      'courier-new': '"Courier New", Courier, monospace',
      'roboto': 'Roboto, sans-serif',
      'open-sans': '"Open Sans", sans-serif',
      'lato': 'Lato, sans-serif'
    };
    return fontMap[font] || fontMap['system'];
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
