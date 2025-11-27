import { Component, signal, inject, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StorageService, Guest } from '../services/storage.service';
import { LocalizationService } from '../services/localization.service';

interface CustomerForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  dateOfBirth: string;
  nationality: string;
  idType: string;
  idNumber: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

@Component({
  selector: 'app-customer-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-popup.component.html',
  styleUrl: './customer-popup.component.css'
})
export class CustomerPopupComponent {
  private storageService = inject(StorageService);
  public i18n = inject(LocalizationService);

  @Input() isOpen = signal(false);
  @Input() editCustomer: Guest | null = null;
  @Output() closePopup = new EventEmitter<void>();
  @Output() customerSaved = new EventEmitter<Guest>();

  customer = signal<CustomerForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    dateOfBirth: '',
    nationality: '',
    idType: 'passport',
    idNumber: '',
    emergencyContactName: '',
    emergencyContactPhone: ''
  });

  // Use writable properties for form binding
  get firstName() { return this.customer().firstName; }
  set firstName(value: string) { this.updateField('firstName', value); }
  
  get lastName() { return this.customer().lastName; }
  set lastName(value: string) { this.updateField('lastName', value); }
  
  get email() { return this.customer().email; }
  set email(value: string) { this.updateField('email', value); }
  
  get phone() { return this.customer().phone; }
  set phone(value: string) { this.updateField('phone', value); }
  
  get address() { return this.customer().address; }
  set address(value: string) { this.updateField('address', value); }
  
  get city() { return this.customer().city; }
  set city(value: string) { this.updateField('city', value); }
  
  get state() { return this.customer().state; }
  set state(value: string) { this.updateField('state', value); }
  
  get zipCode() { return this.customer().zipCode; }
  set zipCode(value: string) { this.updateField('zipCode', value); }
  
  get country() { return this.customer().country; }
  set country(value: string) { this.updateField('country', value); }
  
  get dateOfBirth() { return this.customer().dateOfBirth; }
  set dateOfBirth(value: string) { this.updateField('dateOfBirth', value); }
  
  get nationality() { return this.customer().nationality; }
  set nationality(value: string) { this.updateField('nationality', value); }
  
  get idType() { return this.customer().idType; }
  set idType(value: string) { this.updateField('idType', value); }
  
  get idNumber() { return this.customer().idNumber; }
  set idNumber(value: string) { this.updateField('idNumber', value); }
  
  get emergencyContactName() { return this.customer().emergencyContactName; }
  set emergencyContactName(value: string) { this.updateField('emergencyContactName', value); }
  
  get emergencyContactPhone() { return this.customer().emergencyContactPhone; }
  set emergencyContactPhone(value: string) { this.updateField('emergencyContactPhone', value); }

  idTypes = ['Passport', 'Driver License', 'National ID', 'Other'];
  errorMessage = '';
  submitted = signal(false);

  ngOnChanges() {
    if (this.editCustomer) {
      this.customer.set({
        firstName: this.editCustomer.firstName,
        lastName: this.editCustomer.lastName,
        email: this.editCustomer.email,
        phone: this.editCustomer.phone,
        address: this.editCustomer.address || '',
        city: this.editCustomer.city || '',
        state: this.editCustomer.state || '',
        zipCode: this.editCustomer.zipCode || '',
        country: this.editCustomer.country || '',
        dateOfBirth: this.editCustomer.dateOfBirth || '',
        nationality: this.editCustomer.nationality || '',
        idType: this.editCustomer.idType || 'passport',
        idNumber: this.editCustomer.idNumber || '',
        emergencyContactName: this.editCustomer.emergencyContactName || '',
        emergencyContactPhone: this.editCustomer.emergencyContactPhone || ''
      });
    }
  }

  close() {
    this.closePopup.emit();
    this.resetForm();
  }

  saveCustomer() {
    this.errorMessage = '';
    
    // Validation
    if (!this.customer().firstName || !this.customer().lastName) {
      this.errorMessage = 'First name and last name are required.';
      return;
    }

    if (!this.customer().email || !this.customer().phone) {
      this.errorMessage = 'Email and phone are required.';
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.customer().email)) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }

    const customerData: Guest = {
      id: this.editCustomer?.id || this.generateGuestId(),
      ...this.customer(),
      registrationDate: this.editCustomer?.registrationDate || new Date().toISOString(),
      status: this.editCustomer?.status || 'active'
    };

    // saveGuest method handles both create and update
    this.storageService.saveGuest(customerData);

    this.submitted.set(true);
    this.customerSaved.emit(customerData);
    
    setTimeout(() => {
      this.close();
    }, 1000);
  }

  resetForm() {
    this.customer.set({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      dateOfBirth: '',
      nationality: '',
      idType: 'passport',
      idNumber: '',
      emergencyContactName: '',
      emergencyContactPhone: ''
    });
    this.submitted.set(false);
    this.errorMessage = '';
  }

  generateGuestId(): string {
    return 'CUST' + Date.now().toString().slice(-8);
  }

  handleOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  // Helper methods for two-way binding with signals
  updateField(field: keyof CustomerForm, value: any) {
    this.customer.set({
      ...this.customer(),
      [field]: value
    });
  }
}
