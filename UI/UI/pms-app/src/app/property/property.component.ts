import { Component, signal, inject, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { StorageService } from '../services/storage.service';
import { LocalizationService } from '../services/localization.service';
import { ErrorPopupComponent, ErrorMessage } from '../error-popup/error-popup.component';
import { ConfirmPopupComponent, ConfirmMessage } from '../confirm-popup/confirm-popup.component';

export interface PropertyInfo {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  description: string;
  numberOfRooms: number;
  checkInTime: string;
  checkOutTime: string;
  starRating: number;
  amenities: string[];
  policies: string;
  taxRate: number;
  currency: string;
  timezone: string;
  font?: string;
  theme?: string;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-property',
  standalone: true,
  imports: [CommonModule, FormsModule, ErrorPopupComponent, ConfirmPopupComponent],
  templateUrl: './property.component.html',
  styleUrl: './property.component.css'
})
export class PropertyComponent implements OnInit, AfterViewInit {
  private storageService = inject(StorageService);
  private router = inject(Router);
  public i18n = inject(LocalizationService);

  @ViewChild('propertyForm') propertyForm!: NgForm;
  @ViewChild('propertyNameInput') propertyNameInput!: ElementRef<HTMLInputElement>;

  ngAfterViewInit() {
    // Auto-focus name input if property not set
    if (!this.property().name && this.propertyNameInput) {
      setTimeout(() => this.propertyNameInput.nativeElement.focus(), 100);
    }
  }

  property = signal<PropertyInfo>({
    id: '',
    name: '',
    type: 'hotel',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: '',
    email: '',
    website: '',
    description: '',
    numberOfRooms: 0,
    checkInTime: '14:00',
    checkOutTime: '11:00',
    starRating: 3,
    amenities: [],
    policies: '',
    taxRate: 0,
    currency: 'USD',
    timezone: 'America/New_York',
    font: 'system',
    theme: 'default',
    createdAt: '',
    updatedAt: ''
  });

  propertyTypes = ['Hotel', 'Resort', 'Motel', 'Hostel', 'Bed & Breakfast', 'Apartment', 'Villa'];
  starRatings = [1, 2, 3, 4, 5];
  currencies = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'JPY', 'CNY', 'CHF', 'SGD'];
  timezones = [
    { value: 'America/New_York', label: 'Eastern Time (US)' },
    { value: 'America/Chicago', label: 'Central Time (US)' },
    { value: 'America/Denver', label: 'Mountain Time (US)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
    { value: 'America/Anchorage', label: 'Alaska Time (US)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time (US)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
    { value: 'Asia/Dubai', label: 'Dubai (GST)' },
    { value: 'Asia/Kolkata', label: 'India (IST)' },
    { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEDT)' }
  ];
  fonts = ['System Default', 'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Courier New', 'Roboto', 'Open Sans', 'Lato'];
  themes = ['Default', 'Light', 'Dark', 'Blue', 'Green', 'Purple', 'Orange'];
  
  availableAmenities = [
    'WiFi',
    'Parking',
    'Pool',
    'Gym',
    'Restaurant',
    'Bar',
    'Spa',
    'Room Service',
    'Laundry',
    'Business Center',
    'Conference Room',
    'Airport Shuttle',
    'Pet Friendly',
    'Air Conditioning',
    'Concierge'
  ];

  submitted = signal(false);
  errorMessage = '';
  isEdit = signal(false);

  // Error popup
  isErrorPopupOpen = signal(false);
  errorMessagePopup = signal<ErrorMessage | null>(null);

  // Confirm popup
  isConfirmPopupOpen = signal(false);
  confirmMessage = signal<ConfirmMessage | null>(null);
  private confirmResolve: ((value: boolean) => void) | null = null;

  ngOnInit() {
    this.loadPropertyInfo();
  }

  loadPropertyInfo() {
    const savedProperty = this.storageService.getPropertyInfo();
    if (savedProperty) {
      this.property.set(savedProperty);
      this.isEdit.set(true);
    }
  }

  toggleAmenity(amenity: string) {
    const currentAmenities = [...this.property().amenities];
    const index = currentAmenities.indexOf(amenity);
    
    if (index > -1) {
      currentAmenities.splice(index, 1);
    } else {
      currentAmenities.push(amenity);
    }
    
    this.property.set({
      ...this.property(),
      amenities: currentAmenities
    });
  }

  isAmenitySelected(amenity: string): boolean {
    return this.property().amenities.includes(amenity);
  }

  saveProperty() {
    this.errorMessage = '';
    
    // Basic validation
    if (!this.property().name || !this.property().email || !this.property().phone) {
      this.errorMessage = 'Please fill in all required fields (Name, Email, Phone).';
      return;
    }

    if (this.property().numberOfRooms < 1) {
      this.errorMessage = 'Number of rooms must be at least 1.';
      return;
    }

    const now = new Date().toISOString();
    const propertyData: PropertyInfo = {
      ...this.property(),
      id: this.property().id || 'PROP001',
      createdAt: this.property().createdAt || now,
      updatedAt: now
    };

    this.storageService.savePropertyInfo(propertyData);
    this.submitted.set(true);
    this.isEdit.set(true);
  }

  editProperty() {
    this.submitted.set(false);
  }

  viewDashboard() {
    this.router.navigate(['/list']);
  }

  async resetForm() {
    const confirmed = await this.showConfirm(
      'Reset Property',
      'Are you sure you want to reset all property information? This will clear all saved data.',
      'Reset',
      'Cancel'
    );
    if (confirmed) {
      this.property.set({
        id: '',
        name: '',
        type: 'hotel',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        phone: '',
        email: '',
        website: '',
        description: '',
        numberOfRooms: 0,
        checkInTime: '14:00',
        checkOutTime: '11:00',
        starRating: 3,
        amenities: [],
        policies: '',
        taxRate: 0,
        currency: 'USD',
        timezone: 'America/New_York',
        createdAt: '',
        updatedAt: ''
      });
      this.submitted.set(false);
      this.isEdit.set(false);
      this.storageService.clearPropertyInfo();
    }
  }

  // Error popup methods
  showError(title: string, message: string, type: 'error' | 'warning' | 'info' | 'success' = 'error') {
    this.errorMessagePopup.set({ title, message, type });
    this.isErrorPopupOpen.set(true);
  }

  closeErrorPopup() {
    this.isErrorPopupOpen.set(false);
    setTimeout(() => this.errorMessagePopup.set(null), 300);
  }

  // Confirm popup methods
  showConfirm(title: string, message: string, confirmText = 'Confirm', cancelText = 'Cancel'): Promise<boolean> {
    return new Promise((resolve) => {
      this.confirmResolve = resolve;
      this.confirmMessage.set({ title, message, confirmText, cancelText });
      this.isConfirmPopupOpen.set(true);
    });
  }

  onConfirmed() {
    this.isConfirmPopupOpen.set(false);
    if (this.confirmResolve) {
      this.confirmResolve(true);
      this.confirmResolve = null;
    }
    setTimeout(() => this.confirmMessage.set(null), 300);
  }

  onCancelled() {
    this.isConfirmPopupOpen.set(false);
    if (this.confirmResolve) {
      this.confirmResolve(false);
      this.confirmResolve = null;
    }
    setTimeout(() => this.confirmMessage.set(null), 300);
  }
}
