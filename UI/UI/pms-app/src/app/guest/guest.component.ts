import { Component, signal, inject, computed, effect, ViewChild, ViewChildren, QueryList, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { StorageService, Guest } from '../services/storage.service';
import { LocalizationService } from '../services/localization.service';
import { ErrorPopupComponent, ErrorMessage } from '../error-popup/error-popup.component';
import { ConfirmPopupComponent, ConfirmMessage } from '../confirm-popup/confirm-popup.component';

interface GuestForm {
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
  selector: 'app-guest',
  imports: [CommonModule, FormsModule, ErrorPopupComponent, ConfirmPopupComponent],
  templateUrl: './guest.component.html',
  styleUrl: './guest.component.css'
})
export class GuestComponent implements AfterViewInit {
  private storageService = inject(StorageService);
  private router = inject(Router);
  public i18n = inject(LocalizationService);

  @ViewChild('guestForm') guestForm!: NgForm;
  @ViewChild('firstNameInput') firstNameInput!: ElementRef<HTMLInputElement>;
  @ViewChildren('guestCard') guestCards!: QueryList<ElementRef>;

  ngAfterViewInit() {
    // Focus first input when form is shown
    if (this.showForm() && this.firstNameInput) {
      setTimeout(() => this.firstNameInput.nativeElement.focus(), 100);
    }
  }

  ngOnInit() {
    this.loadGuests();
  }

  guest = signal<GuestForm>({
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

  idTypes = ['Passport', 'Driver License', 'National ID', 'Other'];
  countries = ['United States', 'Canada', 'United Kingdom', 'Australia', 'India', 'Other'];
  submitted = signal(false);
  savedGuestId = signal('');
  
  // List view properties
  showForm = signal(false);
  guestList = signal<Guest[]>([]);
  searchTerm = signal('');
  statusFilter = signal('all');
  editingGuest = signal<Guest | null>(null);
  
  // Error popup
  isErrorPopupOpen = signal(false);
  errorMessage = signal<ErrorMessage | null>(null);

  // Confirm popup
  isConfirmPopupOpen = signal(false);
  confirmMessage = signal<ConfirmMessage | null>(null);
  private confirmResolve: ((value: boolean) => void) | null = null;
  
  // Computed filtered list
  filteredGuestList = computed(() => {
    let filtered = this.guestList();
    
    // Filter by status
    if (this.statusFilter() !== 'all') {
      filtered = filtered.filter(g => g.status === this.statusFilter());
    }
    
    // Filter by search term
    const term = this.searchTerm().toLowerCase();
    if (term) {
      filtered = filtered.filter(g => {
        const fullName = `${g.firstName} ${g.lastName}`.toLowerCase();
        return fullName.includes(term) ||
               g.email.toLowerCase().includes(term) ||
               g.phone.includes(term) ||
               g.id.toLowerCase().includes(term);
      });
    }
    
    return filtered;
  });

  onSubmit() {
    // Save to local storage
    const newGuest: Guest = {
      id: this.storageService.generateGuestId(),
      firstName: this.guest().firstName,
      lastName: this.guest().lastName,
      email: this.guest().email,
      phone: this.guest().phone,
      address: this.guest().address,
      city: this.guest().city,
      state: this.guest().state,
      zipCode: this.guest().zipCode,
      country: this.guest().country,
      dateOfBirth: this.guest().dateOfBirth,
      nationality: this.guest().nationality,
      idType: this.guest().idType,
      idNumber: this.guest().idNumber,
      emergencyContactName: this.guest().emergencyContactName,
      emergencyContactPhone: this.guest().emergencyContactPhone,
      registrationDate: new Date().toISOString().split('T')[0],
      status: 'active'
    };

    this.storageService.saveGuest(newGuest);
    this.savedGuestId.set(newGuest.id);
    this.submitted.set(true);
  }

  async resetForm() {
    const confirmed = await this.showConfirm(
      'Reset Form',
      'Are you sure you want to reset the form? All unsaved changes will be lost.',
      'Reset',
      'Cancel'
    );
    if (!confirmed) {
      return;
    }
    this.guest.set({
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
    this.savedGuestId.set('');
  }

  viewAllGuests() {
    this.router.navigate(['/list']);
  }

  loadGuests() {
    this.guestList.set(this.storageService.getAllGuests());
  }

  editGuest(guest: Guest) {
    this.editingGuest.set(guest);
    this.guest.set({
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email,
      phone: guest.phone,
      address: guest.address,
      city: guest.city,
      state: guest.state,
      zipCode: guest.zipCode,
      country: guest.country,
      dateOfBirth: guest.dateOfBirth,
      nationality: guest.nationality,
      idType: guest.idType,
      idNumber: guest.idNumber,
      emergencyContactName: guest.emergencyContactName,
      emergencyContactPhone: guest.emergencyContactPhone
    });
    this.showForm.set(true);
    this.submitted.set(false);
  }

  async deleteGuest(guestId: string) {
    const confirmed = await this.showConfirm(
      'Delete Guest',
      'Are you sure you want to delete this guest?',
      'Delete',
      'Cancel'
    );
    if (confirmed) {
      this.storageService.deleteGuest(guestId);
      this.loadGuests();
    }
  }

  updateGuestStatus(guest: Guest) {
    const statuses: Array<'active' | 'inactive'> = ['active', 'inactive'];
    const currentIndex = statuses.indexOf(guest.status);
    const nextIndex = (currentIndex + 1) % statuses.length;
    
    const updatedGuest = { ...guest, status: statuses[nextIndex] };
    this.storageService.saveGuest(updatedGuest);
    this.loadGuests();
  }

  // Error popup methods
  showError(title: string, message: string, type: 'error' | 'warning' | 'info' | 'success' = 'error') {
    this.errorMessage.set({ title, message, type });
    this.isErrorPopupOpen.set(true);
  }

  closeErrorPopup() {
    this.isErrorPopupOpen.set(false);
    setTimeout(() => this.errorMessage.set(null), 300);
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
