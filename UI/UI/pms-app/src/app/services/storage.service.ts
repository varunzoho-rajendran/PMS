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

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly RESERVATIONS_KEY = 'pms_reservations';
  private readonly GUESTS_KEY = 'pms_guests';
  private readonly PROPERTY_KEY = 'pms_property';
  private readonly USERS_KEY = 'pms_users';

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
}
