# Weather Service Setup Guide

## Overview
The Weather Service has been created to fetch weather data from OpenWeatherMap API (a free alternative to Google Weather API, as Google doesn't provide a public Weather API).

## Features
- Get current weather by city name
- Get current weather by coordinates (latitude/longitude)
- Get 5-day weather forecast
- Get weather for multiple cities simultaneously
- Error handling with user-friendly messages
- Temperature in Celsius (easily configurable to Fahrenheit)
- Wind speed in km/h
- Weather condition icons (emoji-based)

## Setup Instructions

### 1. Get an API Key
1. Visit [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Navigate to API Keys section
4. Copy your API key

### 2. Configure the Service
Open `src/app/services/weather.service.ts` and replace:
```typescript
private readonly API_KEY = 'YOUR_OPENWEATHER_API_KEY';
```
With your actual API key:
```typescript
private readonly API_KEY = 'your_actual_api_key_here';
```

### 3. Usage Examples

#### In a Component:
```typescript
import { Component, signal, inject, OnInit } from '@angular/core';
import { WeatherService, WeatherData } from './services/weather.service';

@Component({
  selector: 'app-weather',
  templateUrl: './weather.component.html'
})
export class WeatherComponent implements OnInit {
  private weatherService = inject(WeatherService);
  
  currentWeather = signal<WeatherData | null>(null);
  errorMessage = signal<string>('');
  loading = signal<boolean>(false);

  ngOnInit() {
    this.loadWeather();
  }

  loadWeather() {
    this.loading.set(true);
    this.weatherService.getCurrentWeather('New York', 'US').subscribe({
      next: (data) => {
        this.currentWeather.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.message);
        this.loading.set(false);
      }
    });
  }

  searchWeather(city: string) {
    this.loading.set(true);
    this.weatherService.getCurrentWeather(city).subscribe({
      next: (data) => {
        this.currentWeather.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.message);
        this.loading.set(false);
      }
    });
  }
}
```

#### Get Weather by Coordinates:
```typescript
this.weatherService.getWeatherByCoordinates(40.7128, -74.0060).subscribe({
  next: (data) => console.log('Weather:', data),
  error: (error) => console.error('Error:', error)
});
```

#### Get 5-Day Forecast:
```typescript
this.weatherService.getWeatherForecast('London', 'GB').subscribe({
  next: (forecast) => console.log('Forecast:', forecast),
  error: (error) => console.error('Error:', error)
});
```

#### Get Weather for Multiple Cities:
```typescript
const cities = ['New York', 'London', 'Tokyo', 'Paris'];
this.weatherService.getWeatherForMultipleCities(cities).subscribe({
  next: (weatherData) => console.log('Multiple cities:', weatherData),
  error: (error) => console.error('Error:', error)
});
```

## API Response Interfaces

### WeatherData
```typescript
interface WeatherData {
  location: string;          // "New York, US"
  temperature: number;        // 22
  temperatureUnit: string;    // "°C"
  condition: string;          // "Clear", "Clouds", "Rain", etc.
  humidity: number;           // 65
  windSpeed: number;          // 15
  windUnit: string;           // "km/h"
  description: string;        // "clear sky", "few clouds", etc.
  icon: string;              // "☀️", "☁️", "🌧️", etc.
  lastUpdated: string;       // ISO date string
}
```

### WeatherForecast
```typescript
interface WeatherForecast {
  date: string;              // "2025-11-23"
  maxTemp: number;           // 25
  minTemp: number;           // 18
  condition: string;         // "Clear", "Clouds", "Rain"
  icon: string;             // "☀️", "☁️", "🌧️"
  description: string;      // "clear sky"
}
```

## Error Handling
The service handles various error scenarios:
- **401**: Invalid API key
- **404**: Location not found
- **429**: API rate limit exceeded
- **Network errors**: Connection issues

## Notes
- Free tier allows 1,000 API calls per day
- Temperature is in Celsius by default (change `units=metric` to `units=imperial` for Fahrenheit)
- Wind speed is converted from m/s to km/h
- Weather icons use emoji representations
- HTTP Client has been configured in `app.config.ts`

## Integration with PMS App
You can add weather display to:
1. **Dashboard**: Show weather for property location
2. **Reservation page**: Display weather forecast for check-in dates
3. **Guest page**: Show current weather at registration

Example integration in dashboard:
```typescript
// In list.component.ts
weatherData = signal<WeatherData | null>(null);

ngOnInit() {
  this.loadData();
  this.loadWeather();
}

loadWeather() {
  // Replace with your hotel's city
  this.weatherService.getCurrentWeather('New York', 'US').subscribe({
    next: (data) => this.weatherData.set(data),
    error: (error) => console.error('Weather error:', error)
  });
}
```

## Alternative APIs
If you prefer Google-specific services, consider:
- **Google Places API** (has some weather-related data)
- **Weather.gov** (US only, free, no API key needed)
- **WeatherAPI.com** (free tier available)
