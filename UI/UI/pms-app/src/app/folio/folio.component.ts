import { Component, signal, inject, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { StorageService, Reservation, Guest } from '../services/storage.service';
import { LocalizationService } from '../services/localization.service';
import { FormatService } from '../services/format.service';
import { forkJoin, of } from 'rxjs';

interface Charge {
  id: string;
  reservationId: string;
  guestName: string;
  chargeType: string;
  description: string;
  amount: number;
  quantity: number;
  totalAmount: number;
  chargeDate: string;
  chargeTime: string;
  status: string;
  postedBy: string;
  notes?: string;
}

interface Payment {
  id: string;
  reservationId: string;
  guestId: string;
  guestName: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  paymentTime: string;
  status: string;
  transactionId?: string;
  notes?: string;
  processedBy: string;
}

interface FolioTransaction {
  id: string;
  date: string;
  time: string;
  type: 'charge' | 'payment' | 'room';
  description: string;
  charges: number;
  payments: number;
  balance: number;
}

@Component({
  selector: 'app-folio',
  imports: [CommonModule, FormsModule],
  templateUrl: './folio.component.html',
  styleUrl: './folio.component.css'
})
export class FolioComponent implements OnInit, AfterViewInit {
  private storageService = inject(StorageService);
  private route = inject(ActivatedRoute);
  public i18n = inject(LocalizationService);
  public format = inject(FormatService);

  @ViewChild('guestSearch') guestSearch!: ElementRef<HTMLInputElement>;
  @ViewChild('folioStatement') folioStatement!: ElementRef<HTMLDivElement>;

  ngAfterViewInit() {
    // Setup after view init
  }

  printStatement() {
    if (this.folioStatement) {
      window.print();
    }
  }

  // Data
  reservations = signal<Reservation[]>([]);
  guests = signal<Guest[]>([]);
  charges = signal<Charge[]>([]);
  payments = signal<Payment[]>([]);

  // UI State
  selectedReservationId = signal('');
  searchTerm = signal('');
  showFolioDetails = signal(false);

  // Folio data
  folioTransactions = signal<FolioTransaction[]>([]);
  selectedReservation = signal<Reservation | null>(null);
  selectedGuest = signal<Guest | null>(null);
  totalCharges = signal<number>(0);
  totalPayments = signal<number>(0);
  balanceDue = signal<number>(0);

  ngOnInit() {
    this.loadData();
    
    // Read optional reservationId from route parameter
    this.route.paramMap.subscribe(params => {
      const reservationId = params.get('reservationId');
      if (reservationId) {
        this.selectedReservationId.set(reservationId);
        this.generateFolio(reservationId);
        this.showFolioDetails.set(true);
      }
    });
  }

  loadData() {
    forkJoin({
      reservations: of(this.storageService.getAllReservations()),
      guests: of(this.storageService.getAllGuests()),
      charges: of(this.getChargesFromStorage()),
      payments: of(this.getPaymentsFromStorage())
    }).subscribe(({ reservations, guests, charges, payments }) => {
      this.reservations.set(reservations);
      this.guests.set(guests);
      this.charges.set(charges);
      this.payments.set(payments);
    });
  }

  getChargesFromStorage(): Charge[] {
    const data = localStorage.getItem('pms_charges');
    return data ? JSON.parse(data) : [];
  }

  getPaymentsFromStorage(): Payment[] {
    const data = localStorage.getItem('pms_payments');
    return data ? JSON.parse(data) : [];
  }

  getActiveReservations(): Reservation[] {
    return this.reservations().filter(r => 
      r.status === 'confirmed' || 
      r.status === 'checked-in' ||
      r.status === 'checked-out'
    );
  }

  getFilteredReservations(): Reservation[] {
    let filtered = this.getActiveReservations();
    
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(r =>
        r.id.toLowerCase().includes(search) ||
        r.guestName.toLowerCase().includes(search) ||
        r.email.toLowerCase().includes(search)
      );
    }

    return filtered;
  }

  onReservationSelect() {
    const reservationId = this.selectedReservationId();
    if (reservationId) {
      const reservation = this.reservations().find(r => r.id === reservationId);
      if (reservation) {
        this.generateFolio(reservationId);
        this.showFolioDetails.set(true);
      }
    }
  }

  generateFolio(reservationId: string) {
    const reservation = this.reservations().find(r => r.id === reservationId);
    if (!reservation) return;

    this.selectedReservation.set(reservation);

    // Find guest
    const guest = this.guests().find(g => 
      `${g.firstName} ${g.lastName}` === reservation.guestName && 
      g.email === reservation.email
    );
    this.selectedGuest.set(guest || null);

    const transactions: FolioTransaction[] = [];
    let runningBalance = 0;

    // Add room charge
    const roomCharge = reservation.price || 0;
    runningBalance += roomCharge;
    transactions.push({
      id: 'ROOM-' + reservation.id,
      date: reservation.checkInDate,
      time: '00:00:00',
      type: 'room',
      description: `Room Charge - ${reservation.roomType}`,
      charges: roomCharge,
      payments: 0,
      balance: runningBalance
    });

    // Add all charges for this reservation
    const reservationCharges = this.charges()
      .filter(c => c.reservationId === reservationId && c.status !== 'cancelled')
      .sort((a, b) => {
        const dateA = new Date(a.chargeDate + ' ' + a.chargeTime);
        const dateB = new Date(b.chargeDate + ' ' + b.chargeTime);
        return dateA.getTime() - dateB.getTime();
      });

    for (const charge of reservationCharges) {
      runningBalance += charge.totalAmount;
      transactions.push({
        id: charge.id,
        date: charge.chargeDate,
        time: charge.chargeTime,
        type: 'charge',
        description: `${charge.description} (${charge.quantity}x$${charge.amount.toFixed(2)})`,
        charges: charge.totalAmount,
        payments: 0,
        balance: runningBalance
      });
    }

    // Add all payments for this reservation
    const reservationPayments = this.payments()
      .filter(p => p.reservationId === reservationId && p.status === 'completed')
      .sort((a, b) => {
        const dateA = new Date(a.paymentDate + ' ' + a.paymentTime);
        const dateB = new Date(b.paymentDate + ' ' + b.paymentTime);
        return dateA.getTime() - dateB.getTime();
      });

    for (const payment of reservationPayments) {
      runningBalance -= payment.amount;
      transactions.push({
        id: payment.id,
        date: payment.paymentDate,
        time: payment.paymentTime,
        type: 'payment',
        description: `Payment - ${payment.paymentMethod.toUpperCase()}${payment.transactionId ? ' (' + payment.transactionId + ')' : ''}`,
        charges: 0,
        payments: payment.amount,
        balance: runningBalance
      });
    }

    // Sort all transactions by date and time
    transactions.sort((a, b) => {
      const dateA = new Date(a.date + ' ' + a.time);
      const dateB = new Date(b.date + ' ' + b.time);
      return dateA.getTime() - dateB.getTime();
    });

    // Recalculate running balance
    let balance = 0;
    for (const transaction of transactions) {
      balance += transaction.charges - transaction.payments;
      transaction.balance = balance;
    }

    this.folioTransactions.set(transactions);

    // Calculate totals
    const totalCharges = transactions.reduce((sum, t) => sum + t.charges, 0);
    const totalPayments = transactions.reduce((sum, t) => sum + t.payments, 0);
    
    this.totalCharges.set(totalCharges);
    this.totalPayments.set(totalPayments);
    this.balanceDue.set(totalCharges - totalPayments);
  }

  printFolio() {
    const reservation = this.selectedReservation();
    if (!reservation) return;

    const guest = this.selectedGuest();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const transactions = this.folioTransactions();
    const transactionsHtml = transactions.map(t => `
      <tr>
        <td>${t.date}</td>
        <td>${t.description}</td>
        <td class="amount">${t.charges > 0 ? '$' + t.charges.toFixed(2) : '-'}</td>
        <td class="amount">${t.payments > 0 ? '$' + t.payments.toFixed(2) : '-'}</td>
        <td class="amount balance">${'$' + t.balance.toFixed(2)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Guest Folio - ${reservation.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 900px; margin: 0 auto; color: #333; }
          .folio-header { text-align: center; border-bottom: 3px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .folio-header h1 { margin: 0 0 10px 0; color: #2196f3; font-size: 2rem; }
          .guest-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; }
          .info-section h3 { margin: 0 0 15px 0; color: #2196f3; font-size: 1rem; border-bottom: 2px solid #e0e0e0; padding-bottom: 8px; }
          .info-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 0.9rem; }
          .info-label { font-weight: 600; color: #666; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          th { background: #2196f3; color: white; padding: 12px; text-align: left; font-weight: 600; }
          td { padding: 10px 12px; border-bottom: 1px solid #e0e0e0; }
          .amount { text-align: right; font-family: 'Courier New', monospace; }
          .balance { font-weight: 700; color: #2196f3; }
          .folio-summary { margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; }
          .summary-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 1.1rem; }
          .summary-row.total { border-top: 3px solid #333; margin-top: 10px; padding-top: 15px; font-size: 1.5rem; font-weight: 700; }
          .balance-due { color: ${this.balanceDue() > 0 ? '#f44336' : '#4caf50'}; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="folio-header">
          <h1>GUEST FOLIO STATEMENT</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
        <div class="guest-info">
          <div class="info-section">
            <h3>Guest Information</h3>
            <div class="info-row"><span class="info-label">Name:</span><span>${reservation.guestName}</span></div>
            <div class="info-row"><span class="info-label">Email:</span><span>${reservation.email}</span></div>
            <div class="info-row"><span class="info-label">Phone:</span><span>${reservation.phone}</span></div>
            ${guest ? `<div class="info-row"><span class="info-label">Address:</span><span>${guest.address}, ${guest.city}</span></div>` : ''}
          </div>
          <div class="info-section">
            <h3>Reservation Details</h3>
            <div class="info-row"><span class="info-label">Folio #:</span><span>${reservation.id}</span></div>
            <div class="info-row"><span class="info-label">Room:</span><span>${reservation.roomType}</span></div>
            <div class="info-row"><span class="info-label">Check-In:</span><span>${reservation.checkInDate}</span></div>
            <div class="info-row"><span class="info-label">Check-Out:</span><span>${reservation.checkOutDate}</span></div>
            <div class="info-row"><span class="info-label">Status:</span><span>${reservation.status.toUpperCase()}</span></div>
          </div>
        </div>
        <table>
          <thead><tr><th>Date</th><th>Description</th><th>Charges</th><th>Payments</th><th>Balance</th></tr></thead>
          <tbody>${transactionsHtml}</tbody>
        </table>
        <div class="folio-summary">
          <div class="summary-row"><span>Total Charges:</span><span>$${this.totalCharges().toFixed(2)}</span></div>
          <div class="summary-row"><span>Total Payments:</span><span>$${this.totalPayments().toFixed(2)}</span></div>
          <div class="summary-row total"><span>Balance Due:</span><span class="balance-due">$${this.balanceDue().toFixed(2)}</span></div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  exportCSV() {
    const reservation = this.selectedReservation();
    if (!reservation) return;

    const transactions = this.folioTransactions();
    const headers = ['Date', 'Description', 'Charges', 'Payments', 'Balance'];
    const rows = transactions.map(t => [t.date, t.description, t.charges.toFixed(2), t.payments.toFixed(2), t.balance.toFixed(2)]);
    rows.push([]);
    rows.push(['', 'Total Charges:', this.totalCharges().toFixed(2), '', '']);
    rows.push(['', 'Total Payments:', '', this.totalPayments().toFixed(2), '']);
    rows.push(['', 'Balance Due:', '', '', this.balanceDue().toFixed(2)]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `folio_${reservation.id}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
