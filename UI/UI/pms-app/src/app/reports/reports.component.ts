import { Component, signal, inject, OnInit, ViewChild, ViewChildren, QueryList, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { StorageService, Reservation } from '../services/storage.service';
import { LocalizationService } from '../services/localization.service';
import { ErrorPopupComponent, ErrorMessage } from '../error-popup/error-popup.component';
import { debounceTime, switchMap, of, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ErrorPopupComponent],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit, AfterViewInit, OnDestroy {
  private storageService = inject(StorageService);
  public i18n = inject(LocalizationService);
  private destroy$ = new Subject<void>();

  // Error popup
  isErrorPopupOpen = signal(false);
  errorMessage = signal<ErrorMessage | null>(null);

  @ViewChild('reportTable') reportTable!: ElementRef<HTMLTableElement>;
  @ViewChildren('reportRow') reportRows!: QueryList<ElementRef>;

  ngAfterViewInit() {
    // Setup after view init
  }

  reservations = signal<Reservation[]>([]);
  filteredReservations = signal<Reservation[]>([]);
  
  // Filter options
  filterStatus = signal<string>('all');
  filterDateFrom = signal<string>('');
  filterDateTo = signal<string>('');
  filterRoomType = signal<string>('all');
  searchControl = new FormControl('');

  // Report stats
  totalReservations = signal<number>(0);
  totalRevenue = signal<number>(0);
  confirmedCount = signal<number>(0);
  pendingCount = signal<number>(0);
  cancelledCount = signal<number>(0);

  ngOnInit() {
    this.loadReservations();
    this.calculateStats();
    this.setupSearchWithSwitchMap();
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

    this.filteredReservations.set(this.reservations());
  }

  performSearch(searchTerm: string): Reservation[] {
    const search = searchTerm.toLowerCase();
    const status = this.filterStatus();
    const dateFrom = this.filterDateFrom();
    const dateTo = this.filterDateTo();
    const roomType = this.filterRoomType();

    return this.reservations().filter(res => {
      const matchesSearch = !search || 
        res.guestName.toLowerCase().includes(search) ||
        res.email.toLowerCase().includes(search) ||
        res.id.toLowerCase().includes(search);

      const matchesStatus = status === 'all' || res.status === status;

      const checkInDate = new Date(res.checkInDate);
      const matchesDateFrom = !dateFrom || checkInDate >= new Date(dateFrom);
      const matchesDateTo = !dateTo || checkInDate <= new Date(dateTo);

      const matchesRoomType = roomType === 'all' || res.roomType === roomType;

      return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo && matchesRoomType;
    });
  }

  loadReservations() {
    this.reservations.set(this.storageService.getAllReservations());
    this.filteredReservations.set(this.reservations());
    this.calculateStats();
  }

  getFilteredReservations(): Reservation[] {
    return this.filteredReservations();
  }

  applyFilters() {
    // Re-apply search with current filters
    const currentSearch = this.searchControl.value || '';
    const filtered = this.performSearch(currentSearch);
    this.filteredReservations.set(filtered);
  }

  calculateStats() {
    const reservations = this.reservations();
    this.totalReservations.set(reservations.length);
    
    const revenue = reservations
      .filter(r => r.status !== 'cancelled')
      .reduce((sum, r) => sum + (r.price || 0), 0);
    this.totalRevenue.set(revenue);

    this.confirmedCount.set(reservations.filter(r => r.status === 'confirmed').length);
    this.pendingCount.set(reservations.filter(r => r.status === 'pending').length);
    this.cancelledCount.set(reservations.filter(r => r.status === 'cancelled').length);
  }

  clearFilters() {
    this.filterStatus.set('all');
    this.filterDateFrom.set('');
    this.filterDateTo.set('');
    this.filterRoomType.set('all');
    this.searchControl.setValue('');
  }

  downloadCSV() {
    const filtered = this.getFilteredReservations();
    
    if (filtered.length === 0) {
      this.showError('No Data', 'No reservations to download', 'warning');
      return;
    }

    // CSV headers
    const headers = [
      'Reservation ID',
      'Guest Name',
      'Email',
      'Phone',
      'Check-In Date',
      'Check-Out Date',
      'Room Type',
      'Number of Guests',
      'Price',
      'Status',
      'Special Requests',
      'Created At'
    ];

    // CSV rows
    const rows = filtered.map(res => [
      res.id,
      res.guestName,
      res.email,
      res.phone,
      res.checkInDate,
      res.checkOutDate,
      res.roomType,
      res.numberOfGuests.toString(),
      res.price ? res.price.toFixed(2) : '0.00',
      res.status,
      res.specialRequests || '',
      res.createdAt
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `reservations_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  downloadPDF() {
    const filtered = this.getFilteredReservations();
    
    if (filtered.length === 0) {
      this.showError('No Data', 'No reservations to download', 'warning');
      return;
    }

    // Create a simple HTML table for printing
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reservations Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #667eea; color: white; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          .stats { display: flex; gap: 20px; margin: 20px 0; }
          .stat-box { padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
          .stat-label { font-size: 12px; color: #666; }
          .stat-value { font-size: 18px; font-weight: bold; color: #333; }
        </style>
      </head>
      <body>
        <h1>Reservations Report</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <div class="stats">
          <div class="stat-box">
            <div class="stat-label">Total Reservations</div>
            <div class="stat-value">${filtered.length}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Total Revenue</div>
            <div class="stat-value">$${filtered.filter(r => r.status !== 'cancelled').reduce((sum, r) => sum + (r.price || 0), 0).toFixed(2)}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Guest Name</th>
              <th>Check-In</th>
              <th>Check-Out</th>
              <th>Room Type</th>
              <th>Guests</th>
              <th>Price</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(res => `
              <tr>
                <td>${res.id}</td>
                <td>${res.guestName}</td>
                <td>${res.checkInDate}</td>
                <td>${res.checkOutDate}</td>
                <td>${res.roomType}</td>
                <td>${res.numberOfGuests}</td>
                <td>$${res.price ? res.price.toFixed(2) : '0.00'}</td>
                <td>${res.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'pending': 'status-pending',
      'confirmed': 'status-confirmed',
      'checked-in': 'status-checked-in',
      'checked-out': 'status-checked-out',
      'cancelled': 'status-cancelled'
    };
    return statusClasses[status] || '';
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
}
