import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface WeatherData {
  location: string;
  temperature: number;
  temperatureUnit: string;
  condition: string;
  humidity: number;
  windSpeed: number;
  windUnit: string;
  description: string;
  icon: string;
  lastUpdated: string;
}

export interface WeatherForecast {
  date: string;
  maxTemp: number;
  minTemp: number;
  condition: string;
  icon: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private http = inject(HttpClient);
  
  // OpenWeatherMap API (free alternative to Google Weather API)
  // You'll need to sign up at https://openweathermap.org/api to get an API key
  private readonly API_KEY: string = 'acaefa9bd6453ce5a31f75c3102f2c6f'; // Replace with your API key
  private readonly BASE_URL = 'https://api.openweathermap.org/data/2.5';
  
  /**
   * Get current weather for a specific location
   * @param city City name (e.g., "New York", "London")
   * @param countryCode Optional country code (e.g., "US", "GB")
   * @returns Observable of current weather data
   */
  getCurrentWeather(city: string, countryCode?: string): Observable<WeatherData> {
    const location = countryCode ? `${city},${countryCode}` : city;
    const url = `${this.BASE_URL}/weather?q=${location}&appid=${this.API_KEY}&units=metric`;
    
    return this.http.get<any>(url).pipe(
      map(response => this.transformWeatherResponse(response)),
      catchError(this.handleError)
    );
  }

  /**
   * Get current weather by coordinates
   * @param lat Latitude
   * @param lon Longitude
   * @returns Observable of current weather data
   */
  getWeatherByCoordinates(lat: number, lon: number): Observable<WeatherData> {
    const url = `${this.BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&units=metric`;
    
    return this.http.get<any>(url).pipe(
      map(response => this.transformWeatherResponse(response)),
      catchError(this.handleError)
    );
  }

  /**
   * Get 5-day weather forecast
   * @param city City name
   * @param countryCode Optional country code
   * @returns Observable of weather forecast array
   */
  getWeatherForecast(city: string, countryCode?: string): Observable<WeatherForecast[]> {
    const location = countryCode ? `${city},${countryCode}` : city;
    const url = `${this.BASE_URL}/forecast?q=${location}&appid=${this.API_KEY}&units=metric`;
    
    return this.http.get<any>(url).pipe(
      map(response => this.transformForecastResponse(response)),
      catchError(this.handleError)
    );
  }

  /**
   * Get weather for multiple cities
   * @param cities Array of city names
   * @returns Observable of weather data array
   */
  getWeatherForMultipleCities(cities: string[]): Observable<WeatherData[]> {
    const requests = cities.map(city => 
      this.getCurrentWeather(city).pipe(
        catchError(() => of(null))
      )
    );
    
    // Use forkJoin from rxjs to wait for all requests
    return new Observable(observer => {
      Promise.all(requests.map(req => req.toPromise()))
        .then(results => {
          observer.next(results.filter(r => r !== null) as WeatherData[]);
          observer.complete();
        });
    });
  }

  /**
   * Transform OpenWeatherMap API response to our WeatherData interface
   */
  private transformWeatherResponse(response: any): WeatherData {
    return {
      location: `${response.name}, ${response.sys.country}`,
      temperature: Math.round(response.main.temp),
      temperatureUnit: '°C',
      condition: response.weather[0].main,
      humidity: response.main.humidity,
      windSpeed: Math.round(response.wind.speed * 3.6), // Convert m/s to km/h
      windUnit: 'km/h',
      description: response.weather[0].description,
      icon: this.getWeatherIcon(response.weather[0].icon),
      lastUpdated: new Date(response.dt * 1000).toISOString()
    };
  }

  /**
   * Transform forecast API response to our WeatherForecast interface
   */
  private transformForecastResponse(response: any): WeatherForecast[] {
    // Group forecasts by day and take one forecast per day (around noon)
    const dailyForecasts: { [key: string]: any } = {};
    
    response.list.forEach((forecast: any) => {
      const date = new Date(forecast.dt * 1000).toISOString().split('T')[0];
      const hour = new Date(forecast.dt * 1000).getHours();
      
      // Take the forecast closest to noon (12:00)
      if (!dailyForecasts[date] || Math.abs(hour - 12) < Math.abs(new Date(dailyForecasts[date].dt * 1000).getHours() - 12)) {
        dailyForecasts[date] = forecast;
      }
    });

    // Convert to array and limit to 5 days
    return Object.entries(dailyForecasts)
      .slice(0, 5)
      .map(([date, forecast]: [string, any]) => ({
        date: date,
        maxTemp: Math.round(forecast.main.temp_max),
        minTemp: Math.round(forecast.main.temp_min),
        condition: forecast.weather[0].main,
        icon: this.getWeatherIcon(forecast.weather[0].icon),
        description: forecast.weather[0].description
      }));
  }

  /**
   * Map OpenWeatherMap icon codes to emoji icons
   */
  private getWeatherIcon(iconCode: string): string {
    const iconMap: { [key: string]: string } = {
      '01d': '☀️',  // clear sky day
      '01n': '🌙',  // clear sky night
      '02d': '⛅',  // few clouds day
      '02n': '☁️',  // few clouds night
      '03d': '☁️',  // scattered clouds
      '03n': '☁️',
      '04d': '☁️',  // broken clouds
      '04n': '☁️',
      '09d': '🌧️',  // shower rain
      '09n': '🌧️',
      '10d': '🌦️',  // rain day
      '10n': '🌧️',  // rain night
      '11d': '⛈️',  // thunderstorm
      '11n': '⛈️',
      '13d': '❄️',  // snow
      '13n': '❄️',
      '50d': '🌫️',  // mist
      '50n': '🌫️'
    };
    
    return iconMap[iconCode] || '🌤️';
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred while fetching weather data';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 401:
          errorMessage = 'Invalid API key. Please check your OpenWeatherMap API key.';
          break;
        case 404:
          errorMessage = 'Location not found. Please check the city name.';
          break;
        case 429:
          errorMessage = 'API rate limit exceeded. Please try again later.';
          break;
        default:
          errorMessage = `Server error: ${error.status} - ${error.message}`;
      }
    }
    
    console.error('Weather API Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Check if API key is configured
   */
  isApiKeyConfigured(): boolean {
    return this.API_KEY !== 'YOUR_OPENWEATHER_API_KEY' && this.API_KEY.length > 0;
  }
}
