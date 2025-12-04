import { Injectable } from '@angular/core';
import { PropertyInfo } from '../property/property.component';

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'admin' | 'manager' | 'receptionist' | 'staff';
  accessLevel: string[];
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
}

export interface Reservation {
  id: string;
  guestName: string;
  email: string;
  phone: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  roomType: string;
  price: number;
  status: 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
  specialRequests?: string;
  createdAt: string;
}

export interface Guest {
  id: string;
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
  registrationDate: string;
  status: 'active' | 'inactive';
}

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

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly RESERVATIONS_KEY = 'pms_reservations';
  private readonly GUESTS_KEY = 'pms_guests';
  private readonly PROPERTY_KEY = 'pms_property';
  private readonly USERS_KEY = 'pms_users';
  private readonly PAYMENTS_KEY = 'pms_payments';
  private readonly RATE_PLANS_KEY = 'pms_rate_plans';
  private readonly DATE_RATES_KEY = 'pms_date_rates';
  private readonly PACKAGE_PLANS_KEY = 'pms_package_plans';
  private readonly ROOM_TYPES_KEY = 'pms_room_types';

  constructor() {
    this.initializeStorage();
  }

  private initializeStorage() {
    // Initialize with empty arrays if storage is empty
    if (!localStorage.getItem(this.RESERVATIONS_KEY)) {
      this.saveReservations([]);
    }

    if (!localStorage.getItem(this.GUESTS_KEY)) {
      this.saveGuests([]);
    }
  }

  // Reservation methods
  getAllReservations(): Reservation[] {
    const data = localStorage.getItem(this.RESERVATIONS_KEY);
    return data ? JSON.parse(data) : [];
  }

  getReservationById(id: string): Reservation | undefined {
    return this.getAllReservations().find(res => res.id === id);
  }

  saveReservation(reservation: Reservation): void {
    const reservations = this.getAllReservations();
    const index = reservations.findIndex(r => r.id === reservation.id);
    
    if (index >= 0) {
      reservations[index] = reservation;
    } else {
      reservations.push(reservation);
    }
    
    this.saveReservations(reservations);
  }

  deleteReservation(id: string): void {
    const reservations = this.getAllReservations().filter(r => r.id !== id);
    this.saveReservations(reservations);
  }

  updateReservationStatus(id: string, status: Reservation['status']): void {
    const reservations = this.getAllReservations();
    const reservation = reservations.find(r => r.id === id);
    
    if (reservation) {
      reservation.status = status;
      this.saveReservations(reservations);
    }
  }

  private saveReservations(reservations: Reservation[]): void {
    localStorage.setItem(this.RESERVATIONS_KEY, JSON.stringify(reservations));
  }

  generateReservationId(): string {
    const reservations = this.getAllReservations();
    const maxId = reservations.reduce((max, res) => {
      const num = parseInt(res.id.replace('RES', ''));
      return num > max ? num : max;
    }, 0);
    return `RES${String(maxId + 1).padStart(3, '0')}`;
  }

  // Guest methods
  getAllGuests(): Guest[] {
    const data = localStorage.getItem(this.GUESTS_KEY);
    return data ? JSON.parse(data) : [];
  }

  getGuestById(id: string): Guest | undefined {
    return this.getAllGuests().find(guest => guest.id === id);
  }

  saveGuest(guest: Guest): void {
    const guests = this.getAllGuests();
    const index = guests.findIndex(g => g.id === guest.id);
    
    if (index >= 0) {
      guests[index] = guest;
    } else {
      guests.push(guest);
    }
    
    this.saveGuests(guests);
  }

  deleteGuest(id: string): void {
    const guests = this.getAllGuests().filter(g => g.id !== id);
    this.saveGuests(guests);
  }

  updateGuestStatus(id: string, status: Guest['status']): void {
    const guests = this.getAllGuests();
    const guest = guests.find(g => g.id === id);
    
    if (guest) {
      guest.status = status;
      this.saveGuests(guests);
    }
  }

  private saveGuests(guests: Guest[]): void {
    localStorage.setItem(this.GUESTS_KEY, JSON.stringify(guests));
  }

  generateGuestId(): string {
    const guests = this.getAllGuests();
    const maxId = guests.reduce((max, guest) => {
      const num = parseInt(guest.id.replace('GST', ''));
      return num > max ? num : max;
    }, 0);
    return `GST${String(maxId + 1).padStart(3, '0')}`;
  }

  // Utility methods
  clearAllData(): void {
    this.saveReservations([]);
    this.saveGuests([]);
  }

  exportData(): { reservations: Reservation[], guests: Guest[] } {
    return {
      reservations: this.getAllReservations(),
      guests: this.getAllGuests()
    };
  }

  importData(data: { reservations?: Reservation[], guests?: Guest[] }): void {
    if (data.reservations) {
      this.saveReservations(data.reservations);
    }
    if (data.guests) {
      this.saveGuests(data.guests);
    }
  }

  // Property Information Methods
  getPropertyInfo(): PropertyInfo | null {
    const data = localStorage.getItem(this.PROPERTY_KEY);
    return data ? JSON.parse(data) : null;
  }

  savePropertyInfo(property: PropertyInfo): void {
    localStorage.setItem(this.PROPERTY_KEY, JSON.stringify(property));
  }

  clearPropertyInfo(): void {
    localStorage.removeItem(this.PROPERTY_KEY);
  }

  // User Management Methods
  getAllUsers(): User[] {
    const data = localStorage.getItem(this.USERS_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveUsers(users: User[]): void {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  saveUser(user: User): void {
    const users = this.getAllUsers();
    users.push(user);
    this.saveUsers(users);
  }

  updateUser(updatedUser: User): void {
    const users = this.getAllUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      this.saveUsers(users);
    }
  }

  getUserById(id: string): User | undefined {
    return this.getAllUsers().find(user => user.id === id);
  }

  deleteUser(id: string): void {
    const users = this.getAllUsers().filter(user => user.id !== id);
    this.saveUsers(users);
  }

  updateUserStatus(id: string, status: 'active' | 'inactive'): void {
    const users = this.getAllUsers();
    const user = users.find(u => u.id === id);
    if (user) {
      user.status = status;
      this.saveUsers(users);
    }
  }

  generateUserId(): string {
    const users = this.getAllUsers();
    const maxId = users.reduce((max, user) => {
      const num = parseInt(user.id.replace('USR', ''));
      return num > max ? num : max;
    }, 0);
    return `USR${String(maxId + 1).padStart(3, '0')}`;
  }

  // Payment Management Methods
  getAllPayments(): Payment[] {
    const data = localStorage.getItem(this.PAYMENTS_KEY);
    return data ? JSON.parse(data) : [];
  }

  private savePayments(payments: Payment[]): void {
    localStorage.setItem(this.PAYMENTS_KEY, JSON.stringify(payments));
  }

  savePayment(payment: Payment): void {
    const payments = this.getAllPayments();
    const index = payments.findIndex(p => p.id === payment.id);
    
    if (index >= 0) {
      payments[index] = payment;
    } else {
      payments.unshift(payment);
    }
    
    this.savePayments(payments);
  }

  getPaymentById(id: string): Payment | undefined {
    return this.getAllPayments().find(payment => payment.id === id);
  }

  getPaymentsByReservationId(reservationId: string): Payment[] {
    return this.getAllPayments().filter(payment => payment.reservationId === reservationId);
  }

  deletePayment(id: string): void {
    const payments = this.getAllPayments().filter(p => p.id !== id);
    this.savePayments(payments);
  }

  generatePaymentId(): string {
    const payments = this.getAllPayments();
    const maxId = payments.reduce((max, payment) => {
      const num = parseInt(payment.id.replace('PAY', ''));
      return num > max ? num : max;
    }, 0);
    return `PAY${String(maxId + 1).padStart(3, '0')}`;
  }

  // Rate Plan methods
  getAllRatePlans(): any[] {
    const data = localStorage.getItem(this.RATE_PLANS_KEY);
    return data ? JSON.parse(data) : [];
  }

  saveRatePlan(ratePlan: any): void {
    const ratePlans = this.getAllRatePlans();
    const index = ratePlans.findIndex(rp => rp.id === ratePlan.id);
    
    if (index >= 0) {
      ratePlans[index] = ratePlan;
    } else {
      ratePlans.push(ratePlan);
    }
    
    localStorage.setItem(this.RATE_PLANS_KEY, JSON.stringify(ratePlans));
  }

  deleteRatePlan(id: string): void {
    const ratePlans = this.getAllRatePlans().filter(rp => rp.id !== id);
    localStorage.setItem(this.RATE_PLANS_KEY, JSON.stringify(ratePlans));
  }

  generateRatePlanId(): string {
    const ratePlans = this.getAllRatePlans();
    const maxId = ratePlans.reduce((max, rp) => {
      const num = parseInt(rp.id.replace('RP', ''));
      return num > max ? num : max;
    }, 0);
    return `RP${String(maxId + 1).padStart(3, '0')}`;
  }

  // Date Rate methods
  getAllDateRates(): any[] {
    const data = localStorage.getItem(this.DATE_RATES_KEY);
    return data ? JSON.parse(data) : [];
  }

  saveDateRate(dateRate: any): void {
    const dateRates = this.getAllDateRates();
    const index = dateRates.findIndex(dr => dr.id === dateRate.id);
    
    if (index >= 0) {
      dateRates[index] = dateRate;
    } else {
      dateRates.push(dateRate);
    }
    
    localStorage.setItem(this.DATE_RATES_KEY, JSON.stringify(dateRates));
  }

  deleteDateRate(id: string): void {
    const dateRates = this.getAllDateRates().filter(dr => dr.id !== id);
    localStorage.setItem(this.DATE_RATES_KEY, JSON.stringify(dateRates));
  }

  generateDateRateId(): string {
    const dateRates = this.getAllDateRates();
    const maxId = dateRates.reduce((max, dr) => {
      const num = parseInt(dr.id.replace('DR', ''));
      return num > max ? num : max;
    }, 0);
    return `DR${String(maxId + 1).padStart(3, '0')}`;
  }

  // Package Plan methods
  getAllPackagePlans(): any[] {
    const data = localStorage.getItem(this.PACKAGE_PLANS_KEY);
    return data ? JSON.parse(data) : [];
  }

  savePackagePlan(packagePlan: any): void {
    const packagePlans = this.getAllPackagePlans();
    const index = packagePlans.findIndex(pp => pp.id === packagePlan.id);
    
    if (index >= 0) {
      packagePlans[index] = packagePlan;
    } else {
      packagePlans.push(packagePlan);
    }
    
    localStorage.setItem(this.PACKAGE_PLANS_KEY, JSON.stringify(packagePlans));
  }

  deletePackagePlan(id: string): void {
    const packagePlans = this.getAllPackagePlans().filter(pp => pp.id !== id);
    localStorage.setItem(this.PACKAGE_PLANS_KEY, JSON.stringify(packagePlans));
  }

  generatePackagePlanId(): string {
    const packagePlans = this.getAllPackagePlans();
    const maxId = packagePlans.reduce((max, pp) => {
      const num = parseInt(pp.id.replace('PKG', ''));
      return num > max ? num : max;
    }, 0);
    return `PKG${String(maxId + 1).padStart(3, '0')}`;
  }

  // Rate Plan Restrictions
  private readonly RATE_RESTRICTIONS_KEY = 'pms_rate_restrictions';

  getAllRatePlanRestrictions(): any[] {
    const data = localStorage.getItem(this.RATE_RESTRICTIONS_KEY);
    return data ? JSON.parse(data) : [];
  }

  saveRatePlanRestriction(restriction: any): void {
    const restrictions = this.getAllRatePlanRestrictions();
    const index = restrictions.findIndex(r => r.id === restriction.id);
    if (index > -1) {
      restrictions[index] = restriction;
    } else {
      restrictions.push(restriction);
    }
    localStorage.setItem(this.RATE_RESTRICTIONS_KEY, JSON.stringify(restrictions));
  }

  deleteRatePlanRestriction(id: string): void {
    const restrictions = this.getAllRatePlanRestrictions().filter(r => r.id !== id);
    localStorage.setItem(this.RATE_RESTRICTIONS_KEY, JSON.stringify(restrictions));
  }

  generateRatePlanRestrictionId(): string {
    const restrictions = this.getAllRatePlanRestrictions();
    const maxId = restrictions.reduce((max, r) => {
      const num = parseInt(r.id.replace('RR', ''));
      return num > max ? num : max;
    }, 0);
    return `RR${String(maxId + 1).padStart(3, '0')}`;
  }

  // Package Restrictions
  private readonly PACKAGE_RESTRICTIONS_KEY = 'pms_package_restrictions';

  getAllPackageRestrictions(): any[] {
    const data = localStorage.getItem(this.PACKAGE_RESTRICTIONS_KEY);
    return data ? JSON.parse(data) : [];
  }

  savePackageRestriction(restriction: any): void {
    const restrictions = this.getAllPackageRestrictions();
    const index = restrictions.findIndex(r => r.id === restriction.id);
    if (index > -1) {
      restrictions[index] = restriction;
    } else {
      restrictions.push(restriction);
    }
    localStorage.setItem(this.PACKAGE_RESTRICTIONS_KEY, JSON.stringify(restrictions));
  }

  deletePackageRestriction(id: string): void {
    const restrictions = this.getAllPackageRestrictions().filter(r => r.id !== id);
    localStorage.setItem(this.PACKAGE_RESTRICTIONS_KEY, JSON.stringify(restrictions));
  }

  generatePackageRestrictionId(): string {
    const restrictions = this.getAllPackageRestrictions();
    const maxId = restrictions.reduce((max, r) => {
      const num = parseInt(r.id.replace('PR', ''));
      return num > max ? num : max;
    }, 0);
    return `PR${String(maxId + 1).padStart(3, '0')}`;
  }

  // Room Types Methods
  getAllRoomTypes(): string[] {
    const data = localStorage.getItem(this.ROOM_TYPES_KEY);
    if (!data) {
      // Initialize with default room types
      const defaultTypes = ['standard', 'deluxe', 'suite', 'presidential-suite'];
      this.saveRoomTypes(defaultTypes);
      return defaultTypes;
    }
    return JSON.parse(data);
  }

  private saveRoomTypes(roomTypes: string[]): void {
    localStorage.setItem(this.ROOM_TYPES_KEY, JSON.stringify(roomTypes));
  }

  saveRoomType(roomType: string): void {
    const roomTypes = this.getAllRoomTypes();
    if (!roomTypes.includes(roomType)) {
      roomTypes.push(roomType);
      this.saveRoomTypes(roomTypes);
    }
  }

  updateRoomType(oldRoomType: string, newRoomType: string): void {
    const roomTypes = this.getAllRoomTypes();
    const index = roomTypes.indexOf(oldRoomType);
    if (index > -1) {
      roomTypes[index] = newRoomType;
      this.saveRoomTypes(roomTypes);
    }
  }

  deleteRoomType(roomType: string): void {
    const roomTypes = this.getAllRoomTypes().filter(rt => rt !== roomType);
    this.saveRoomTypes(roomTypes);
  }
}
