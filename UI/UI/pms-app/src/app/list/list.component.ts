import { Component, signal, inject, OnInit, ViewChild, ViewChildren, QueryList, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { StorageService, Reservation, Guest } from '../services/storage.service';
import { WeatherService, WeatherData } from '../services/weather.service';
import { LocalizationService } from '../services/localization.service';
import { CustomerPopupComponent } from '../customer-popup/customer-popup.component';
import { ErrorPopupComponent, ErrorMessage } from '../error-popup/error-popup.component';
import { ConfirmPopupComponent, ConfirmMessage } from '../confirm-popup/confirm-popup.component';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-list',
  imports: [CommonModule, FormsModule, RouterModule, CustomerPopupComponent, ErrorPopupComponent, ConfirmPopupComponent],
  templateUrl: './list.component.html',
  styleUrl: './list.component.css'
})
export class ListComponent implements OnInit, AfterViewInit {
  private storageService = inject(StorageService);
  weatherService = inject(WeatherService);
  public i18n = inject(LocalizationService);

  // Error popup
  isErrorPopupOpen = signal(false);
  errorMessage = signal<ErrorMessage | null>(null);

  // Confirm popup
  isConfirmPopupOpen = signal(false);
  confirmMessage = signal<ConfirmMessage | null>(null);
  private confirmResolve: ((value: boolean) => void) | null = null;

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChildren('reservationRow') reservationRows!: QueryList<ElementRef>;

  ngAfterViewInit() {
    // Setup after view init
  }

  activeTab = signal<'reservations' | 'guests'>('reservations');
  searchTerm = signal('');
  filterStatus = signal('all');

  reservations = signal<Reservation[]>([]);
  guests = signal<Guest[]>([]);

  selectedReservation = signal<Reservation | null>(null);
  selectedGuest = signal<Guest | null>(null);

  // Customer popup state
  isCustomerPopupOpen = signal(false);
  editingCustomer = signal<Guest | null>(null);

  // Weather data
  weatherData = signal<WeatherData | null>(null);
  weatherLoading = signal(false);
  weatherError = signal<string>('');
  weatherCity = signal('New York');

  // Analytics data
  totalReservations = signal<number>(0);
  totalGuests = signal<number>(0);
  todayCheckIns = signal<number>(0);
  todayCheckOuts = signal<number>(0);
  totalRevenue = signal<number>(0);
  occupancyRate = signal<number>(0);
  confirmedReservations = signal<number>(0);
  pendingReservations = signal<number>(0);

  ngOnInit() {
    this.loadData();
    this.loadWeather();
  }

  loadData() {
    forkJoin({
      reservations: of(this.storageService.getAllReservations()),
      guests: of(this.storageService.getAllGuests())
    }).subscribe(({ reservations, guests }) => {
      this.reservations.set(reservations);
      this.guests.set(guests);
      this.calculateAnalytics();
    });
  }

  calculateAnalytics() {
    const reservations = this.reservations();
    const guests = this.guests();
    const today = new Date().toISOString().split('T')[0];

    // Basic counts
    this.totalReservations.set(reservations.length);
    this.totalGuests.set(guests.length);

    // Today's check-ins and check-outs
    this.todayCheckIns.set(reservations.filter(r => r.checkInDate === today).length);
    this.todayCheckOuts.set(reservations.filter(r => r.checkOutDate === today).length);

    // Total revenue (excluding cancelled)
    const revenue = reservations
      .filter(r => r.status !== 'cancelled')
      .reduce((sum, r) => sum + (r.price || 0), 0);
    this.totalRevenue.set(revenue);

    // Status counts
    this.confirmedReservations.set(reservations.filter(r => r.status === 'confirmed').length);
    this.pendingReservations.set(reservations.filter(r => r.status === 'pending').length);

    // Occupancy rate (checked-in / total active reservations)
    const activeReservations = reservations.filter(r => 
      r.status === 'confirmed' || r.status === 'checked-in'
    ).length;
    const checkedIn = reservations.filter(r => r.status === 'checked-in').length;
    this.occupancyRate.set(activeReservations > 0 ? (checkedIn / activeReservations) * 100 : 0);
  }

  // Chart helper methods
  getStatusCount(status: string): number {
    return this.reservations().filter(r => r.status === status).length;
  }

  getStatusPercentage(status: string): number {
    const total = this.totalReservations();
    if (total === 0) return 0;
    return (this.getStatusCount(status) / total) * 100;
  }

  getRevenueByStatus(status: string): number {
    return this.reservations()
      .filter(r => r.status === status)
      .reduce((sum, r) => sum + (r.price || 0), 0);
  }

  getRevenuePercentage(status: string): number {
    const total = this.totalRevenue();
    if (total === 0) return 0;
    const statusRevenue = this.getRevenueByStatus(status);
    return (statusRevenue / total) * 100;
  }

  loadWeather() {
    // Try to get city from property info, otherwise use default
    const propertyInfo = this.storageService.getPropertyInfo();
    const city = propertyInfo?.city || 'New York';
    const country = propertyInfo?.country ? this.getCountryCode(propertyInfo.country) : undefined;
    
    this.weatherCity.set(city);
    
    if (!this.weatherService.isApiKeyConfigured()) {
      this.weatherError.set('Weather API key not configured. Please add your OpenWeatherMap API key in weather.service.ts');
      return;
    }

    this.weatherLoading.set(true);
    this.weatherError.set('');
    
    this.weatherService.getCurrentWeather(city, country).subscribe({
      next: (data) => {
        this.weatherData.set(data);
        this.weatherLoading.set(false);
      },
      error: (error) => {
        this.weatherError.set(error.message);
        this.weatherLoading.set(false);
      }
    });
  }

  refreshWeather() {
    this.loadWeather();
  }

  private getCountryCode(country: string): string | undefined {
    const countryMap: { [key: string]: string } = {
      'united states': 'US',
      'usa': 'US',
      'united kingdom': 'GB',
      'uk': 'GB',
      'canada': 'CA',
      'australia': 'AU',
      'india': 'IN',
      'germany': 'DE',
      'france': 'FR',
      'japan': 'JP',
      'china': 'CN'
    };
    return countryMap[country.toLowerCase()];
  }

  switchTab(tab: 'reservations' | 'guests') {
    this.activeTab.set(tab);
    this.searchTerm.set('');
    this.filterStatus.set('all');
    this.selectedReservation.set(null);
    this.selectedGuest.set(null);
  }

  getFilteredReservations() {
    const search = this.searchTerm().toLowerCase();
    const status = this.filterStatus();
    
    return this.reservations()
      .filter(res => {
        const matchesSearch = res.guestName.toLowerCase().includes(search) ||
                             res.email.toLowerCase().includes(search) ||
                             res.id.toLowerCase().includes(search);
        const matchesStatus = status === 'all' || res.status === status;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        // Sort by check-in date in ascending order (earliest first)
        return new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime();
      });
  }

  getFilteredGuests() {
    const search = this.searchTerm().toLowerCase();
    const status = this.filterStatus();
    
    return this.guests().filter(guest => {
      const fullName = `${guest.firstName} ${guest.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(search) ||
                           guest.email.toLowerCase().includes(search) ||
                           guest.id.toLowerCase().includes(search);
      const matchesStatus = status === 'all' || guest.status === status;
      return matchesSearch && matchesStatus;
    });
  }

  viewReservationDetails(reservation: Reservation) {
    this.selectedReservation.set(reservation);
  }

  viewGuestDetails(guest: Guest) {
    this.selectedGuest.set(guest);
  }

  closeDetails() {
    this.selectedReservation.set(null);
    this.selectedGuest.set(null);
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'pending': 'status-pending',
      'confirmed': 'status-confirmed',
      'checked-in': 'status-checked-in',
      'checked-out': 'status-checked-out',
      'cancelled': 'status-cancelled',
      'active': 'status-active',
      'inactive': 'status-inactive'
    };
    return statusClasses[status] || '';
  }

  updateReservationStatus(id: string, newStatus: Reservation['status']) {
    this.storageService.updateReservationStatus(id, newStatus);
    this.loadData();
    this.calculateAnalytics();
    const updated = this.storageService.getReservationById(id);
    if (updated) {
      this.selectedReservation.set(updated);
    }
  }

  async deleteReservation(id: string) {
    const confirmed = await this.showConfirm(
      'Delete Reservation',
      'Are you sure you want to delete this reservation?',
      'Delete',
      'Cancel'
    );
    
    if (!confirmed) return;
    
    this.storageService.deleteReservation(id);
    this.loadData();
    this.calculateAnalytics();
    this.selectedReservation.set(null);
  }

  async deleteGuest(id: string) {
    const confirmed = await this.showConfirm(
      'Delete Guest',
      'Are you sure you want to delete this guest?',
      'Delete',
      'Cancel'
    );
    
    if (!confirmed) return;
    
    this.storageService.deleteGuest(id);
    this.loadData();
    this.calculateAnalytics();
    this.selectedGuest.set(null);
  }

  openCustomerPopup() {
    this.editingCustomer.set(null);
    this.isCustomerPopupOpen.set(true);
  }

  openEditCustomerPopup(guest: Guest) {
    this.editingCustomer.set(guest);
    this.isCustomerPopupOpen.set(true);
  }

  closeCustomerPopup() {
    this.isCustomerPopupOpen.set(false);
    this.editingCustomer.set(null);
  }

  onCustomerSaved(customer: Guest) {
    this.loadData();
    this.calculateAnalytics();
  }

  viewReservation(reservation: Reservation) {
    this.selectedReservation.set(reservation);
  }

  editReservation(reservation: Reservation) {
    // Navigate to reservation edit page or open edit modal
    this.showError('Edit Reservation', `Edit functionality for reservation ${reservation.id} would open here`, 'info');
  }

  changeStatus(reservation: Reservation) {
    const statuses: Reservation['status'][] = ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'];
    const currentIndex = statuses.indexOf(reservation.status);
    const nextIndex = (currentIndex + 1) % statuses.length;
    const newStatus = statuses[nextIndex];
    
    this.updateReservationStatus(reservation.id, newStatus);
  }

  downloadCSV() {
    const reservations = this.getFilteredReservations();
    if (reservations.length === 0) {
      this.showError('No Data', 'No reservations to export', 'warning');
      return;
    }

    const headers = ['ID', 'Guest Name', 'Email', 'Phone', 'Check-In', 'Check-Out', 'Room Type', 'Guests', 'Price', 'Status'];
    const rows = reservations.map(r => [
      r.id,
      r.guestName,
      r.email,
      r.phone,
      r.checkInDate,
      r.checkOutDate,
      r.roomType,
      r.numberOfGuests.toString(),
      r.price ? r.price.toFixed(2) : '0.00',
      r.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reservations_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  downloadPDF() {
    window.print();
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
