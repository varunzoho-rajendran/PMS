import { Component, signal, inject, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, HostListener, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, NgForm, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { StorageService, Reservation } from '../services/storage.service';
import { LocalizationService } from '../services/localization.service';
import { ErrorPopupComponent, ErrorMessage } from '../error-popup/error-popup.component';
import { ConfirmPopupComponent, ConfirmMessage } from '../confirm-popup/confirm-popup.component';
import { debounceTime, switchMap, of, Subject, takeUntil, forkJoin } from 'rxjs';

export interface Charge {
  id: string;
  reservationId: string;
  guestName: string;
  chargeType: 'room-service' | 'minibar' | 'laundry' | 'spa' | 'restaurant' | 'telephone' | 'parking' | 'other';
  description: string;
  amount: number;
  quantity: number;
  totalAmount: number;
  chargeDate: string;
  chargeTime: string;
  status: 'pending' | 'posted' | 'paid' | 'cancelled';
  postedBy: string;
  notes?: string;
}

@Component({
  selector: 'app-charges',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ErrorPopupComponent, ConfirmPopupComponent],
  templateUrl: './charges.component.html',
  styleUrl: './charges.component.css'
})
export class ChargesComponent implements OnInit, AfterViewInit, OnDestroy {
  private storageService = inject(StorageService);
  private route = inject(ActivatedRoute);
  public i18n = inject(LocalizationService);
  private destroy$ = new Subject<void>();
  private platformId = inject(PLATFORM_ID);
  
  // Refresh detection
  isPageRefreshed = signal(false);
  draftChargeRestored = signal(false);

  // Error popup
  isErrorPopupOpen = signal(false);
  errorMessage = signal<ErrorMessage | null>(null);

  // Confirm popup
  isConfirmPopupOpen = signal(false);
  confirmMessage = signal<ConfirmMessage | null>(null);
  private confirmResolve: ((value: boolean) => void) | null = null;

  @ViewChild('chargeForm') chargeForm!: NgForm;
  @ViewChild('amountInput') amountInput!: ElementRef<HTMLInputElement>;

  ngAfterViewInit() {
    // Setup after view init
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(event: Event) {
    // Save draft charge if form is open and has data
    if (this.showChargeForm() && isPlatformBrowser(this.platformId)) {
      const draftCharge = {
        selectedReservationId: this.selectedReservationId(),
        chargeType: this.chargeType(),
        description: this.description(),
        amount: this.amount(),
        quantity: this.quantity(),
        notes: this.notes(),
        timestamp: Date.now()
      };
      
      // Only save if there's meaningful data
      if (draftCharge.selectedReservationId || draftCharge.description || draftCharge.amount > 0) {
        sessionStorage.setItem('draftCharge', JSON.stringify(draftCharge));
      }
    }
  }

  // Data
  charges = signal<Charge[]>([]);
  reservations = signal<Reservation[]>([]);
  filteredCharges = signal<Charge[]>([]);

  // Form data
  selectedReservationId = signal('');
  chargeType = signal<'room-service' | 'minibar' | 'laundry' | 'spa' | 'restaurant' | 'telephone' | 'parking' | 'other'>('room-service');
  description = signal('');
  amount = signal<number>(0);
  quantity = signal<number>(1);
  notes = signal('');

  // UI state
  showChargeForm = signal(false);
  searchControl = new FormControl('');
  filterStatus = signal('all');
  filterType = signal('all');

  // Statistics
  totalCharges = signal<number>(0);
  pendingCharges = signal<number>(0);
  postedCharges = signal<number>(0);
  paidCharges = signal<number>(0);

  ngOnInit() {
    this.checkPageRefresh();
    this.loadData();
    this.calculateStatistics();
    this.setupSearchWithSwitchMap();
    
    // Read optional reservationId from parent route parameter
    this.route.parent?.paramMap.subscribe(params => {
      const reservationId = params.get('reservationId');
      if (reservationId) {
        this.selectedReservationId.set(reservationId);
        this.showChargeForm.set(true);
      }
    });
  }

  checkPageRefresh() {
    if (isPlatformBrowser(this.platformId)) {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navEntry && navEntry.type === 'reload') {
        this.isPageRefreshed.set(true);
        this.restoreDraftCharge();
      }
    }
  }

  restoreDraftCharge() {
    const draftData = sessionStorage.getItem('draftCharge');
    
    if (draftData) {
      try {
        const draft = JSON.parse(draftData);
        const timeDiff = Date.now() - draft.timestamp;
        
        // Only restore if draft is less than 5 minutes old
        if (timeDiff < 5 * 60 * 1000) {
          this.selectedReservationId.set(draft.selectedReservationId);
          this.chargeType.set(draft.chargeType);
          this.description.set(draft.description);
          this.amount.set(draft.amount);
          this.quantity.set(draft.quantity);
          this.notes.set(draft.notes);
          this.showChargeForm.set(true);
          this.draftChargeRestored.set(true);
          
          // Show notification
          setTimeout(() => {
            this.showError('Draft Restored', 'Your unsaved charge has been restored after page refresh', 'info');
          }, 500);
        }
        
        // Clear the draft after restoration attempt
        sessionStorage.removeItem('draftCharge');
      } catch (error) {
        console.error('Error restoring draft charge:', error);
        sessionStorage.removeItem('draftCharge');
      }
    }
  }

  setupSearchWithSwitchMap() {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      switchMap(searchTerm => {
        // Simulate async search (in real app, this would be API call)
        return of(this.performSearch(searchTerm || ''));
      }),
      takeUntil(this.destroy$)
    ).subscribe(results => {
      this.filteredCharges.set(results);
    });

    // Initialize filtered charges
    this.filteredCharges.set(this.charges());
  }

  performSearch(searchTerm: string): Charge[] {
    const search = searchTerm.toLowerCase();
    let filtered = this.charges();

    if (search) {
      filtered = filtered.filter(c =>
        c.id.toLowerCase().includes(search) ||
        c.guestName.toLowerCase().includes(search) ||
        c.reservationId.toLowerCase().includes(search) ||
        c.description.toLowerCase().includes(search) ||
        c.chargeType.toLowerCase().includes(search)
      );
    }

    if (this.filterStatus() !== 'all') {
      filtered = filtered.filter(c => c.status === this.filterStatus());
    }

    if (this.filterType() !== 'all') {
      filtered = filtered.filter(c => c.chargeType === this.filterType());
    }

    return filtered;
  }

  applyFilters() {
    // Re-apply search with current filters
    const currentSearch = this.searchControl.value || '';
    const filtered = this.performSearch(currentSearch);
    this.filteredCharges.set(filtered);
  }

  loadData() {
    this.charges.set(this.getChargesFromStorage());
    this.filteredCharges.set(this.charges());
    this.reservations.set(this.storageService.getAllReservations());
  }

  getChargesFromStorage(): Charge[] {
    const data = localStorage.getItem('pms_charges');
    return data ? JSON.parse(data) : [];
  }

  saveChargesToStorage(charges: Charge[]) {
    localStorage.setItem('pms_charges', JSON.stringify(charges));
  }

  getSelectedReservation(): Reservation | undefined {
    return this.reservations().find(r => r.id === this.selectedReservationId());
  }

  calculateTotal(): number {
    return this.amount() * this.quantity();
  }

  postCharge() {
    const reservation = this.getSelectedReservation();
    if (!reservation) {
      this.showError('Validation Error', 'Please select a reservation', 'warning');
      return;
    }

    if (this.amount() <= 0) {
      this.showError('Validation Error', 'Please enter a valid amount', 'warning');
      return;
    }

    if (this.quantity() <= 0) {
      this.showError('Validation Error', 'Please enter a valid quantity', 'warning');
      return;
    }

    if (!this.description().trim()) {
      this.showError('Validation Error', 'Please enter a description', 'warning');
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem('pms_current_user') || '{}');

    const charge: Charge = {
      id: this.generateChargeId(),
      reservationId: reservation.id,
      guestName: reservation.guestName,
      chargeType: this.chargeType(),
      description: this.description(),
      amount: this.amount(),
      quantity: this.quantity(),
      totalAmount: this.calculateTotal(),
      chargeDate: new Date().toISOString().split('T')[0],
      chargeTime: new Date().toLocaleTimeString(),
      status: 'posted',
      postedBy: currentUser.username || 'admin',
      notes: this.notes() || undefined
    };

    const currentCharges = this.charges();
    currentCharges.unshift(charge);
    this.charges.set(currentCharges);
    this.saveChargesToStorage(currentCharges);

    this.calculateStatistics();
    this.resetForm();
    this.showError('Success', 'Charge posted successfully!', 'success');
  }

  generateChargeId(): string {
    const charges = this.charges();
    const maxId = charges.length > 0
      ? Math.max(...charges.map(c => parseInt(c.id.replace('CHG', ''))))
      : 0;
    return `CHG${String(maxId + 1).padStart(4, '0')}`;
  }

  async resetForm() {
    const confirmed = await this.showConfirm(
      'Reset Form',
      'Are you sure you want to reset the form? All unsaved changes will be lost.',
      'Reset',
      'Cancel'
    );
    
    if (!confirmed) return;
    
    this.selectedReservationId.set('');
    this.chargeType.set('room-service');
    this.description.set('');
    this.amount.set(0);
    this.quantity.set(1);
    this.notes.set('');
    this.showChargeForm.set(false);
  }

  updateChargeStatus(charge: Charge, newStatus: 'pending' | 'posted' | 'paid' | 'cancelled') {
    const currentCharges = this.charges();
    const index = currentCharges.findIndex(c => c.id === charge.id);
    if (index !== -1) {
      currentCharges[index] = { ...charge, status: newStatus };
      this.charges.set([...currentCharges]);
      this.saveChargesToStorage(currentCharges);
      this.calculateStatistics();
    }
  }

  editCharge(charge: Charge) {
    this.selectedReservationId.set(charge.reservationId);
    this.chargeType.set(charge.chargeType);
    this.description.set(charge.description);
    this.amount.set(charge.amount);
    this.quantity.set(charge.quantity);
    this.notes.set(charge.notes || '');
    this.showChargeForm.set(true);
  }

  async deleteCharge(charge: Charge) {
    const confirmed = await this.showConfirm(
      'Delete Charge',
      `Are you sure you want to delete charge ${charge.id}?`,
      'Delete',
      'Cancel'
    );
    
    if (!confirmed) return;
    
    const currentCharges = this.charges().filter(c => c.id !== charge.id);
    this.charges.set(currentCharges);
    this.saveChargesToStorage(currentCharges);
    this.calculateStatistics();
  }

  getFilteredCharges(): Charge[] {
    return this.filteredCharges();
  }

  calculateStatistics() {
    const charges = this.charges();

    // Total charges amount
    const total = charges.reduce((sum, c) => sum + c.totalAmount, 0);
    this.totalCharges.set(total);

    // Pending charges
    const pending = charges
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + c.totalAmount, 0);
    this.pendingCharges.set(pending);

    // Posted charges
    const posted = charges
      .filter(c => c.status === 'posted')
      .reduce((sum, c) => sum + c.totalAmount, 0);
    this.postedCharges.set(posted);

    // Paid charges
    const paid = charges
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + c.totalAmount, 0);
    this.paidCharges.set(paid);
  }

  getActiveReservations(): Reservation[] {
    return this.reservations().filter(r => 
      r.status === 'confirmed' || 
      r.status === 'checked-in'
    );
  }

  getReservationDetails(reservationId: string): string {
    const reservation = this.reservations().find(r => r.id === reservationId);
    if (!reservation) return 'N/A';
    return `${reservation.roomType} - ${reservation.checkInDate} to ${reservation.checkOutDate}`;
  }

  getChargesByReservation(reservationId: string): Charge[] {
    return this.charges().filter(c => c.reservationId === reservationId);
  }

  getTotalChargesForReservation(reservationId: string): number {
    return this.getChargesByReservation(reservationId)
      .filter(c => c.status !== 'cancelled')
      .reduce((sum, c) => sum + c.totalAmount, 0);
  }

  exportCharges() {
    const charges = this.getFilteredCharges();
    const csv = this.convertToCSV(charges);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `charges_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  convertToCSV(charges: Charge[]): string {
    const headers = ['Charge ID', 'Reservation ID', 'Guest Name', 'Type', 'Description', 'Unit Price', 'Quantity', 'Total Amount', 'Date', 'Time', 'Status', 'Posted By', 'Notes'];
    const rows = charges.map(c => [
      c.id,
      c.reservationId,
      c.guestName,
      c.chargeType,
      c.description,
      c.amount.toFixed(2),
      c.quantity,
      c.totalAmount.toFixed(2),
      c.chargeDate,
      c.chargeTime,
      c.status,
      c.postedBy,
      c.notes || ''
    ]);

    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }

  getChargeTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'room-service': '🍽️ Room Service',
      'minibar': '🍷 Minibar',
      'laundry': '👔 Laundry',
      'spa': '💆 Spa',
      'restaurant': '🍴 Restaurant',
      'telephone': '📞 Telephone',
      'parking': '🚗 Parking',
      'other': '📝 Other'
    };
    return labels[type] || type;
  }

  getChargeTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'room-service': '🍽️',
      'minibar': '🍷',
      'laundry': '👔',
      'spa': '💆',
      'restaurant': '🍴',
      'telephone': '📞',
      'parking': '🚗',
      'other': '📝'
    };
    return icons[type] || '📝';
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
}
