import { Component, signal, inject, computed, ViewChild, ViewChildren, QueryList, ElementRef, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { StorageService, Reservation, Guest } from '../services/storage.service';
import { CurrencyInputDirective } from '../directives/currency-input.directive';
import { LocalizationService } from '../services/localization.service';
import { ErrorPopupComponent, ErrorMessage } from '../error-popup/error-popup.component';
import { ConfirmPopupComponent, ConfirmMessage } from '../confirm-popup/confirm-popup.component';
import { debounceTime, switchMap, of, Subject, takeUntil, forkJoin } from 'rxjs';

interface ReservationForm {
  guestName: string;
  email: string;
  phone: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  roomType: string;
  price: number;
  specialRequests: string;
}

@Component({
  selector: 'app-reservation',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CurrencyInputDirective, ErrorPopupComponent, ConfirmPopupComponent],
  templateUrl: './reservation.component.html',
  styleUrl: './reservation.component.css'
})
export class ReservationComponent implements OnInit, AfterViewInit, OnDestroy {
  private storageService = inject(StorageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public i18n = inject(LocalizationService);
  private destroy$ = new Subject<void>();

  @ViewChild('reservationForm') reservationForm!: NgForm;
  @ViewChild('guestSearchInput') guestSearchInput!: ElementRef<HTMLInputElement>;
  @ViewChildren('reservationCard') reservationCards!: QueryList<ElementRef>;
  @ViewChild('signatureCanvas') signatureCanvas!: ElementRef<HTMLCanvasElement>;

  private isDrawing = false;
  private lastX = 0;
  private lastY = 0;

  ngOnInit() {
    this.loadData();
    this.setupSearchWithSwitchMap();
    
    // Read reservationId from query parameters
    this.route.queryParamMap.subscribe(params => {
      const reservationId = params.get('reservationId');
      if (reservationId) {
        this.loadReservationById(reservationId);
      }
    });
  }

  loadData() {
    forkJoin({
      guests: of(this.storageService.getAllGuests()),
      reservations: of(this.storageService.getAllReservations())
    }).subscribe(({ guests, reservations }) => {
      this.guests.set(guests);
      this.reservationList.set(reservations);
      this.filteredReservations.set(reservations);
    });
  }

  setupSearchWithSwitchMap() {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      switchMap(searchTerm => {
        return of(this.performSearch(searchTerm || ''));
      }),
      takeUntil(this.destroy$)
    ).subscribe(results => {
      this.filteredReservations.set(results);
    });

    this.filteredReservations.set(this.reservationList());
  }

  performSearch(searchTerm: string): Reservation[] {
    let filtered = this.reservationList();
    
    if (this.statusFilterRes() !== 'all') {
      filtered = filtered.filter(r => r.status === this.statusFilterRes());
    }
    
    if (this.roomTypeFilter() !== 'all') {
      filtered = filtered.filter(r => r.roomType === this.roomTypeFilter());
    }
    
    const term = searchTerm.toLowerCase();
    if (term) {
      filtered = filtered.filter(r => {
        return r.guestName.toLowerCase().includes(term) ||
               r.email.toLowerCase().includes(term) ||
               r.phone.includes(term) ||
               r.id.toLowerCase().includes(term);
      });
    }
    
    return filtered;
  }

  applyFilters() {
    // Re-apply search with current filters
    const currentSearch = this.searchControl.value || '';
    const filtered = this.performSearch(currentSearch);
    this.filteredReservations.set(filtered);
  }

  ngAfterViewInit() {
    // Setup after view initialization
  }

  reservation = signal<ReservationForm>({
    guestName: '',
    email: '',
    phone: '',
    checkInDate: this.getTodayDate(),
    checkOutDate: this.getTomorrowDate(),
    numberOfGuests: 1,
    roomType: 'standard',
    price: 0,
    specialRequests: ''
  });

  // Guest search functionality
  guests = signal<Guest[]>([]);
  searchQuery = ''; // Changed from signal to regular property for ngModel binding
  showGuestDropdown = signal(false);
  selectedGuest = signal<Guest | null>(null);

  // Filtered guests based on search query
  filteredGuests = computed(() => {
    const query = this.searchQuery.toLowerCase();
    if (!query) return this.guests();
    return this.guests().filter(guest => {
      const fullName = `${guest.firstName} ${guest.lastName}`.toLowerCase();
      return fullName.includes(query) ||
             guest.email.toLowerCase().includes(query) ||
             guest.phone.includes(query) ||
             guest.id.toLowerCase().includes(query);
    });
  });

  roomTypes = ['Standard', 'Deluxe', 'Suite', 'Presidential Suite'];
  submitted = signal(false);
  savedReservationId = signal('');

  // List view properties
  showForm = signal(false);
  reservationList = signal<Reservation[]>([]);
  searchControl = new FormControl('');
  filteredReservations = signal<Reservation[]>([]);
  statusFilterRes = signal('all');
  roomTypeFilter = signal('all');
  editingReservation = signal<Reservation | null>(null);
  
  // Error popup
  isErrorPopupOpen = signal(false);
  errorMessage = signal<ErrorMessage | null>(null);

  // Confirm popup
  isConfirmPopupOpen = signal(false);
  confirmMessage = signal<ConfirmMessage | null>(null);
  private confirmResolve: ((value: boolean) => void) | null = null;

  // Check-in/Check-out popups
  showCheckInPopup = signal(false);
  showCheckOutPopup = signal(false);
  selectedReservationForStatus = signal<Reservation | null>(null);
  checkInTime = signal('');
  checkInNotes = signal('');
  assignedRoomNumber = signal('');
  guestSignature = signal('');
  checkOutTime = signal('');
  checkOutNotes = signal('');
  additionalCharges = signal(0);
  
  // Computed filtered list
  filteredReservationList = computed(() => {
    return this.filteredReservations();
  });

  loadReservationById(reservationId: string) {
    const reservations = this.storageService.getAllReservations();
    const foundReservation = reservations.find(r => r.id === reservationId);
    
    if (foundReservation) {
      // Populate form with reservation data
      this.reservation.set({
        guestName: foundReservation.guestName,
        email: foundReservation.email,
        phone: foundReservation.phone,
        checkInDate: foundReservation.checkInDate,
        checkOutDate: foundReservation.checkOutDate,
        numberOfGuests: foundReservation.numberOfGuests,
        roomType: foundReservation.roomType,
        price: foundReservation.price || 0,
        specialRequests: foundReservation.specialRequests || ''
      });
      
      // Find and select the guest
      const guest = this.guests().find(g => 
        `${g.firstName} ${g.lastName}` === foundReservation.guestName &&
        g.email === foundReservation.email
      );
      if (guest) {
        this.selectedGuest.set(guest);
      }
    }
  }

  getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  loadGuests() {
    // Kept for backward compatibility if needed
    this.guests.set(this.storageService.getAllGuests());
  }

  onSearchFocus() {
    this.showGuestDropdown.set(true);
  }

  onSearchBlur() {
    // Delay to allow click on dropdown item
    setTimeout(() => this.showGuestDropdown.set(false), 200);
  }

  selectGuest(guest: Guest) {
    this.selectedGuest.set(guest);
    this.searchQuery = `${guest.firstName} ${guest.lastName}`;
    this.showGuestDropdown.set(false);
    
    // Auto-fill reservation form with guest data
    this.reservation.set({
      ...this.reservation(),
      guestName: `${guest.firstName} ${guest.lastName}`,
      email: guest.email,
      phone: guest.phone
    });
  }

  clearGuestSelection() {
    this.selectedGuest.set(null);
    this.searchQuery = '';
    this.reservation.set({
      ...this.reservation(),
      guestName: '',
      email: '',
      phone: ''
    });
  }

  createReservation() {
    // Basic validation
    if (this.reservation().checkOutDate < this.reservation().checkInDate) {
      this.showError('Invalid Dates', 'Check-out date must be the same or after check-in date.', 'warning');
      return;
    }
    if (!this.reservation().guestName || this.reservation().numberOfGuests < 1) {
      this.showError('Invalid Input', 'Please provide a valid name and at least 1 guest.', 'warning');
      return;
    }

    // Save to local storage
    const newReservation: Reservation = {
      id: this.storageService.generateReservationId(),
      guestName: this.reservation().guestName,
      email: this.reservation().email,
      phone: this.reservation().phone,
      checkInDate: this.reservation().checkInDate,
      checkOutDate: this.reservation().checkOutDate,
      numberOfGuests: this.reservation().numberOfGuests,
      roomType: this.reservation().roomType,
      price: this.reservation().price,
      status: 'pending',
      specialRequests: this.reservation().specialRequests,
      createdAt: new Date().toISOString()
    };

    this.storageService.saveReservation(newReservation);
    this.savedReservationId.set(newReservation.id);
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
    this.reservation.set({
      guestName: '',
      email: '',
      phone: '',
      checkInDate: this.getTodayDate(),
      checkOutDate: this.getTomorrowDate(),
      numberOfGuests: 1,
      roomType: 'standard',
      price: 0,
      specialRequests: ''
    });
    this.submitted.set(false);
    this.savedReservationId.set('');
    this.clearGuestSelection();
  }

  viewAllReservations() {
    this.router.navigate(['/list']);
  }

  loadReservations() {
    // Reload reservation list after add/edit/delete
    const reservations = this.storageService.getAllReservations();
    this.reservationList.set(reservations);
    this.filteredReservations.set(this.performSearch(this.searchControl.value || ''));
  }

  editReservation(reservation: Reservation) {
    this.editingReservation.set(reservation);
    this.reservation.set({
      guestName: reservation.guestName,
      email: reservation.email,
      phone: reservation.phone,
      checkInDate: reservation.checkInDate,
      checkOutDate: reservation.checkOutDate,
      numberOfGuests: reservation.numberOfGuests,
      roomType: reservation.roomType,
      price: reservation.price,
      specialRequests: reservation.specialRequests || ''
    });
    this.showForm.set(true);
    this.submitted.set(false);
  }

  updateStatus(reservation: Reservation) {
    const statuses = ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'];
    const currentIndex = statuses.indexOf(reservation.status);
    const nextIndex = (currentIndex + 1) % statuses.length;
    const nextStatus = statuses[nextIndex];
    
    // Show popup for check-in or check-out
    if (nextStatus === 'checked-in') {
      this.selectedReservationForStatus.set(reservation);
      this.checkInTime.set(new Date().toTimeString().slice(0, 5));
      this.checkInNotes.set('');
      this.assignedRoomNumber.set('');
      this.guestSignature.set('');
      this.showCheckInPopup.set(true);
      // Initialize signature pad after modal is rendered
      setTimeout(() => this.initSignaturePad(), 100);
    } else if (nextStatus === 'checked-out') {
      this.selectedReservationForStatus.set(reservation);
      this.checkOutTime.set(new Date().toTimeString().slice(0, 5));
      this.checkOutNotes.set('');
      this.additionalCharges.set(0);
      this.showCheckOutPopup.set(true);
    } else {
      // Direct status update for other statuses
      const updatedReservation = { ...reservation, status: nextStatus as any };
      this.storageService.saveReservation(updatedReservation);
      this.loadReservations();
    }
  }

  confirmCheckIn() {
    const reservation = this.selectedReservationForStatus();
    if (!reservation) return;

    // Validate room number
    if (!this.assignedRoomNumber().trim()) {
      this.showError('Validation Error', 'Please assign a room number', 'warning');
      return;
    }

    // Validate signature
    if (!this.guestSignature()) {
      this.showError('Validation Error', 'Please capture guest signature', 'warning');
      return;
    }

    const updatedReservation = { 
      ...reservation, 
      status: 'checked-in' as any,
      checkInTime: this.checkInTime(),
      checkInNotes: this.checkInNotes(),
      assignedRoomNumber: this.assignedRoomNumber(),
      guestSignature: this.guestSignature()
    };
    this.storageService.saveReservation(updatedReservation);
    this.loadReservations();
    this.closeCheckInPopup();
    this.showError('Check-In Successful', `${reservation.guestName} has been checked in to Room ${this.assignedRoomNumber()}.`, 'success');
  }

  closeCheckInPopup() {
    this.showCheckInPopup.set(false);
    this.selectedReservationForStatus.set(null);
    this.checkInTime.set('');
    this.checkInNotes.set('');
    this.assignedRoomNumber.set('');
    this.guestSignature.set('');
    this.clearSignature();
  }

  confirmCheckOut() {
    const reservation = this.selectedReservationForStatus();
    if (!reservation) return;

    const updatedReservation = { 
      ...reservation, 
      status: 'checked-out' as any,
      checkOutTime: this.checkOutTime(),
      checkOutNotes: this.checkOutNotes(),
      additionalCharges: this.additionalCharges()
    };
    this.storageService.saveReservation(updatedReservation);
    this.loadReservations();
    this.closeCheckOutPopup();
    this.showError('Check-Out Successful', `${reservation.guestName} has been checked out successfully.`, 'success');
  }

  closeCheckOutPopup() {
    this.showCheckOutPopup.set(false);
    this.selectedReservationForStatus.set(null);
    this.checkOutTime.set('');
    this.checkOutNotes.set('');
    this.additionalCharges.set(0);
  }

  async deleteReservation(reservationId: string) {
    const confirmed = await this.showConfirm(
      'Delete Reservation',
      'Are you sure you want to delete this reservation?',
      'Delete',
      'Cancel'
    );
    if (confirmed) {
      this.storageService.deleteReservation(reservationId);
      this.loadReservations();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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

  // Signature pad methods
  initSignaturePad() {
    if (!this.signatureCanvas) return;
    
    const canvas = this.signatureCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = 200;

    // Set drawing styles
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  startDrawing(event: MouseEvent | TouchEvent) {
    this.isDrawing = true;
    const pos = this.getMousePos(event);
    this.lastX = pos.x;
    this.lastY = pos.y;
  }

  draw(event: MouseEvent | TouchEvent) {
    if (!this.isDrawing || !this.signatureCanvas) return;

    const canvas = this.signatureCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = this.getMousePos(event);
    
    ctx.beginPath();
    ctx.moveTo(this.lastX, this.lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    this.lastX = pos.x;
    this.lastY = pos.y;
  }

  stopDrawing() {
    if (this.isDrawing) {
      this.isDrawing = false;
      this.saveSignature();
    }
  }

  getMousePos(event: MouseEvent | TouchEvent): { x: number, y: number } {
    if (!this.signatureCanvas) return { x: 0, y: 0 };
    
    const canvas = this.signatureCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();

    if (event instanceof TouchEvent) {
      const touch = event.touches[0] || event.changedTouches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    } else {
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    }
  }

  saveSignature() {
    if (!this.signatureCanvas) return;
    
    const canvas = this.signatureCanvas.nativeElement;
    const dataUrl = canvas.toDataURL('image/png');
    this.guestSignature.set(dataUrl);
  }

  clearSignature() {
    if (!this.signatureCanvas) return;
    
    const canvas = this.signatureCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.guestSignature.set('');
  }
}
