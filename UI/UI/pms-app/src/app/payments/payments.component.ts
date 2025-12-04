import { Component, signal, inject, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, HostListener, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, NgForm, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { StorageService, Reservation, Guest, Payment as StoragePayment } from '../services/storage.service';
import { LocalizationService } from '../services/localization.service';
import { FormatService } from '../services/format.service';
import { ErrorPopupComponent, ErrorMessage } from '../error-popup/error-popup.component';
import { ConfirmPopupComponent, ConfirmMessage } from '../confirm-popup/confirm-popup.component';
import { debounceTime, switchMap, of, Subject, takeUntil, forkJoin } from 'rxjs';

export interface Payment {
  id: string;
  reservationId: string;
  guestId: string;
  guestName: string;
  amount: number;
  paymentMethod: 'cash' | 'credit-card' | 'debit-card' | 'upi' | 'bank-transfer';
  paymentDate: string;
  paymentTime: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  transactionId?: string;
  notes?: string;
  processedBy: string;
  paymentType?: 'deposit' | 'room-charge' | 'service' | 'refund' | 'other';
}

@Component({
  selector: 'app-payments',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ErrorPopupComponent, ConfirmPopupComponent],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.css'
})
export class PaymentsComponent implements OnInit, AfterViewInit, OnDestroy {
  private storageService = inject(StorageService);
  private route = inject(ActivatedRoute);
  public i18n = inject(LocalizationService);
  public format = inject(FormatService);
  private destroy$ = new Subject<void>();
  private platformId = inject(PLATFORM_ID);
  
  // Refresh detection
  isPageRefreshed = signal(false);
  draftPaymentRestored = signal(false);

  // Error popup
  isErrorPopupOpen = signal(false);
  errorMessage = signal<ErrorMessage | null>(null);

  // Confirm popup
  isConfirmPopupOpen = signal(false);
  confirmMessage = signal<ConfirmMessage | null>(null);
  private confirmResolve: ((value: boolean) => void) | null = null;

  @ViewChild('paymentForm') paymentForm!: NgForm;
  @ViewChild('amountInput') amountInput!: ElementRef<HTMLInputElement>;

  ngAfterViewInit() {
    // Setup after view init
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(event: Event) {
    // Save draft payment if form is open and has data
    if (this.showPaymentForm() && isPlatformBrowser(this.platformId)) {
      const draftPayment = {
        selectedReservationId: this.selectedReservationId(),
        amount: this.amount(),
        paymentMethod: this.paymentMethod(),
        transactionId: this.transactionId(),
        notes: this.notes(),
        timestamp: Date.now()
      };
      
      // Only save if there's meaningful data
      if (draftPayment.selectedReservationId || draftPayment.amount > 0) {
        sessionStorage.setItem('draftPayment', JSON.stringify(draftPayment));
      }
    }
  }

  // Data
  payments = signal<Payment[]>([]);
  reservations = signal<Reservation[]>([]);
  guests = signal<Guest[]>([]);

  // Form data
  selectedReservationId = signal('');
  amount = signal<number>(0);
  paymentMethod = signal<'cash' | 'credit-card' | 'debit-card' | 'upi' | 'bank-transfer'>('cash');
  transactionId = signal('');
  notes = signal('');

  // UI state
  showPaymentForm = signal(false);
  editingPayment = signal<Payment | null>(null);
  searchControl = new FormControl('');
  filteredPayments = signal<Payment[]>([]);
  filterStatus = signal('all');
  filterMethod = signal('all');

  // Statistics
  totalCollected = signal<number>(0);
  pendingAmount = signal<number>(0);
  todayCollection = signal<number>(0);
  totalTransactions = signal<number>(0);
  totalDeposits = signal<number>(0);

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
        this.showPaymentForm.set(true);
        this.onReservationChange();
      }
    });
  }

  checkPageRefresh() {
    if (isPlatformBrowser(this.platformId)) {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navEntry && navEntry.type === 'reload') {
        this.isPageRefreshed.set(true);
        this.restoreDraftPayment();
      }
    }
  }

  restoreDraftPayment() {
    const draftData = sessionStorage.getItem('draftPayment');
    
    if (draftData) {
      try {
        const draft = JSON.parse(draftData);
        const timeDiff = Date.now() - draft.timestamp;
        
        // Only restore if draft is less than 5 minutes old
        if (timeDiff < 5 * 60 * 1000) {
          this.selectedReservationId.set(draft.selectedReservationId);
          this.amount.set(draft.amount);
          this.paymentMethod.set(draft.paymentMethod);
          this.transactionId.set(draft.transactionId);
          this.notes.set(draft.notes);
          this.showPaymentForm.set(true);
          this.draftPaymentRestored.set(true);
          
          // Trigger reservation change to update guest name
          if (draft.selectedReservationId) {
            this.onReservationChange();
          }
          
          // Show notification
          setTimeout(() => {
            this.showError('Draft Restored', 'Your unsaved payment has been restored after page refresh', 'info');
          }, 500);
        }
        
        // Clear the draft after restoration attempt
        sessionStorage.removeItem('draftPayment');
      } catch (error) {
        console.error('Error restoring draft payment:', error);
        sessionStorage.removeItem('draftPayment');
      }
    }
  }

  setupSearchWithSwitchMap() {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      switchMap(searchTerm => {
        return of(this.performSearch(searchTerm || ''));
      }),
      takeUntil(this.destroy$)
    ).subscribe(results => {
      this.filteredPayments.set(results);
    });

    this.filteredPayments.set(this.payments());
  }

  performSearch(searchTerm: string): Payment[] {
    const search = searchTerm.toLowerCase();
    let filtered = this.payments();

    if (search) {
      filtered = filtered.filter(p =>
        p.id.toLowerCase().includes(search) ||
        p.guestName.toLowerCase().includes(search) ||
        p.reservationId.toLowerCase().includes(search) ||
        (p.transactionId && p.transactionId.toLowerCase().includes(search))
      );
    }

    if (this.filterStatus() !== 'all') {
      filtered = filtered.filter(p => p.status === this.filterStatus());
    }

    if (this.filterMethod() !== 'all') {
      filtered = filtered.filter(p => p.paymentMethod === this.filterMethod());
    }

    return filtered;
  }

  applyFilters() {
    // Re-apply search with current filters
    const currentSearch = this.searchControl.value || '';
    const filtered = this.performSearch(currentSearch);
    this.filteredPayments.set(filtered);
  }

  loadData() {
    forkJoin({
      payments: of(this.getPaymentsFromStorage()),
      reservations: of(this.storageService.getAllReservations()),
      guests: of(this.storageService.getAllGuests())
    }).subscribe(({ payments, reservations, guests }) => {
      this.payments.set(payments);
      this.filteredPayments.set(payments);
      this.reservations.set(reservations);
      this.guests.set(guests);
    });
  }

  getPaymentsFromStorage(): Payment[] {
    return this.storageService.getAllPayments();
  }

  savePaymentsToStorage(payments: Payment[]) {
    // Save all payments back to storage
    payments.forEach(payment => this.storageService.savePayment(payment));
  }

  getSelectedReservation(): Reservation | undefined {
    return this.reservations().find(r => r.id === this.selectedReservationId());
  }

  onReservationChange() {
    const reservation = this.getSelectedReservation();
    if (reservation) {
      this.amount.set(reservation.price || 0);
    }
  }

  postPayment() {
    const reservation = this.getSelectedReservation();
    if (!reservation) {
      this.showError('Validation Error', 'Please select a reservation', 'warning');
      return;
    }

    if (this.amount() === 0) {
      this.showError('Validation Error', 'Please enter a valid amount (can be negative for refunds)', 'warning');
      return;
    }

    // Find guest by matching name and email from reservation
    const guest = this.guests().find(g => 
      `${g.firstName} ${g.lastName}` === reservation.guestName && 
      g.email === reservation.email
    );
    const currentUser = JSON.parse(localStorage.getItem('pms_current_user') || '{}');

    const payment: Payment = {
      id: this.generatePaymentId(),
      reservationId: reservation.id,
      guestId: guest?.id || '',
      guestName: reservation.guestName,
      amount: this.amount(),
      paymentMethod: this.paymentMethod(),
      paymentDate: new Date().toISOString().split('T')[0],
      paymentTime: new Date().toLocaleTimeString(),
      status: 'completed',
      transactionId: this.transactionId() || undefined,
      notes: this.notes() || undefined,
      processedBy: currentUser.username || 'admin',
      paymentType: 'other'
    };

    this.storageService.savePayment(payment);
    const currentPayments = this.storageService.getAllPayments();
    this.payments.set(currentPayments);
    this.filteredPayments.set(currentPayments);

    this.calculateStatistics();
    this.resetForm();
    this.showError('Success', 'Payment processed successfully!', 'success');
  }

  generatePaymentId(): string {
    return this.storageService.generatePaymentId();
  }

  hasFormData(): boolean {
    return this.selectedReservationId() !== '' ||
           this.amount() !== 0 ||
           this.transactionId() !== '' ||
           this.notes() !== '';
  }

  async closeModal() {
    // If form has data, ask for confirmation
    if (this.hasFormData()) {
      const confirmed = await this.showConfirm(
        'Close Form',
        'You have unsaved changes. Are you sure you want to close?',
        'Close',
        'Cancel'
      );
      if (!confirmed) return;
    }
    
    this.selectedReservationId.set('');
    this.amount.set(0);
    this.paymentMethod.set('cash');
    this.transactionId.set('');
    this.notes.set('');
    this.showPaymentForm.set(false);
    this.editingPayment.set(null);
  }

  resetForm() {
    if (!confirm('Are you sure you want to reset the form? All unsaved changes will be lost.')) {
      return;
    }
    this.closeModal();
  }

  updatePaymentStatus(payment: Payment, newStatus: 'completed' | 'pending' | 'failed' | 'refunded') {
    const updatedPayment = { ...payment, status: newStatus };
    this.storageService.savePayment(updatedPayment);
    const currentPayments = this.storageService.getAllPayments();
    this.payments.set(currentPayments);
    this.filteredPayments.set(this.performSearch(this.searchControl.value || ''));
    this.calculateStatistics();
  }

  async deletePayment(payment: Payment) {
    const confirmed = await this.showConfirm(
      'Delete Payment',
      `Are you sure you want to delete payment ${payment.id}?`,
      'Delete',
      'Cancel'
    );
    
    if (!confirmed) return;
    
    this.storageService.deletePayment(payment.id);
    const currentPayments = this.storageService.getAllPayments();
    this.payments.set(currentPayments);
    this.filteredPayments.set(this.performSearch(this.searchControl.value || ''));
    this.calculateStatistics();
  }

  getFilteredPayments(): Payment[] {
    return this.filteredPayments();
  }

  calculateStatistics() {
    const payments = this.payments();
    const today = new Date().toISOString().split('T')[0];

    // Total collected (completed payments including negative amounts)
    const collected = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
    this.totalCollected.set(collected);

    // Pending amount (including negative amounts)
    const pending = payments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);
    this.pendingAmount.set(pending);

    // Today's collection (including negative amounts)
    const todayTotal = payments
      .filter(p => p.paymentDate === today && p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
    this.todayCollection.set(todayTotal);

    // Total transactions
    this.totalTransactions.set(payments.length);

    // Total deposits collected
    const depositsTotal = payments
      .filter(p => p.paymentType === 'deposit' && p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
    this.totalDeposits.set(depositsTotal);
  }

  getActiveReservations(): Reservation[] {
    return this.reservations().filter(r => 
      r.status === 'confirmed' || 
      r.status === 'checked-in' || 
      r.status === 'pending'
    );
  }

  getReservationDetails(reservationId: string): string {
    const reservation = this.reservations().find(r => r.id === reservationId);
    if (!reservation) return 'N/A';
    return `${reservation.roomType} - ${reservation.checkInDate} to ${reservation.checkOutDate}`;
  }

  exportPayments() {
    const payments = this.getFilteredPayments();
    const csv = this.convertToCSV(payments);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  convertToCSV(payments: Payment[]): string {
    const headers = ['Payment ID', 'Reservation ID', 'Guest Name', 'Amount', 'Payment Method', 'Date', 'Time', 'Status', 'Transaction ID', 'Processed By', 'Notes'];
    const rows = payments.map(p => [
      p.id,
      p.reservationId,
      p.guestName,
      p.amount.toFixed(2),
      p.paymentMethod,
      p.paymentDate,
      p.paymentTime,
      p.status,
      p.transactionId || '',
      p.processedBy,
      p.notes || ''
    ]);

    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }

  printReceipt(payment: Payment) {
    const reservation = this.reservations().find(r => r.id === payment.reservationId);
    const receiptWindow = window.open('', '_blank');
    
    if (receiptWindow) {
      receiptWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payment Receipt - ${payment.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; }
            .receipt-header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
            .receipt-header h1 { margin: 0; color: #333; }
            .receipt-info { margin-bottom: 30px; }
            .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .info-label { font-weight: bold; color: #666; }
            .info-value { color: #333; }
            .amount-section { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .amount-label { font-size: 14px; color: #666; margin-bottom: 10px; }
            .amount-value { font-size: 32px; font-weight: bold; color: #2196f3; }
            .receipt-footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #333; color: #666; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="receipt-header">
            <h1>Payment Receipt</h1>
            <p>Property Management System</p>
          </div>
          <div class="receipt-info">
            <div class="info-row">
              <span class="info-label">Receipt Number:</span>
              <span class="info-value">${payment.id}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date:</span>
              <span class="info-value">${payment.paymentDate} ${payment.paymentTime}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Guest Name:</span>
              <span class="info-value">${payment.guestName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Reservation ID:</span>
              <span class="info-value">${payment.reservationId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Room Details:</span>
              <span class="info-value">${reservation ? reservation.roomType : 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Payment Method:</span>
              <span class="info-value">${payment.paymentMethod.toUpperCase()}</span>
            </div>
            ${payment.transactionId ? `
            <div class="info-row">
              <span class="info-label">Transaction ID:</span>
              <span class="info-value">${payment.transactionId}</span>
            </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">Status:</span>
              <span class="info-value">${payment.status.toUpperCase()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Processed By:</span>
              <span class="info-value">${payment.processedBy}</span>
            </div>
          </div>
          <div class="amount-section">
            <div class="amount-label">Amount Paid</div>
            <div class="amount-value">$${payment.amount.toFixed(2)}</div>
          </div>
          ${payment.notes ? `
          <div class="info-row">
            <span class="info-label">Notes:</span>
            <span class="info-value">${payment.notes}</span>
          </div>
          ` : ''}
          <div class="receipt-footer">
            <p>Thank you for your payment!</p>
            <p>This is a computer-generated receipt.</p>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
        </html>
      `);
      receiptWindow.document.close();
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
}
