import { Injectable, signal } from '@angular/core';
import { StorageService, User } from './storage.service';

/**
 * Authentication service for managing user login/logout and access control
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = signal<User | null>(null);
  private readonly CURRENT_USER_KEY = 'pms_current_user';

  constructor(private storageService: StorageService) {
    this.loadCurrentUser();
    this.ensureDefaultAdmin();
  }

  private loadCurrentUser() {
    const userData = localStorage.getItem(this.CURRENT_USER_KEY);
    if (userData) {
      this.currentUser.set(JSON.parse(userData));
    }
  }

  private ensureDefaultAdmin() {
    const users = this.storageService.getAllUsers();
    
    // Check if admin exists
    const adminExists = users.some(u => u.username === 'admin');
    const supportExists = users.some(u => u.username === 'support');
    
    // Create admin if it doesn't exist
    if (!adminExists) {
      const adminUser: User = {
        id: this.storageService.generateUserId(),
        username: 'admin',
        password: 'admin123',
        email: 'admin@pms.com',
        firstName: 'Admin',
        lastName: 'User',
        phone: '+1 (555) 000-0001',
        role: 'admin',
        accessLevel: ['reservations', 'guests', 'property', 'users', 'reports', 'billing'],
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLogin: ''
      };
      this.storageService.saveUser(adminUser);
    }
    
    // Create support if it doesn't exist
    if (!supportExists) {
      const supportUser: User = {
        id: this.storageService.generateUserId(),
        username: 'support',
        password: 'support123',
        email: 'support@pms.com',
        firstName: 'Support',
        lastName: 'Team',
        phone: '+1 (555) 000-0002',
        role: 'admin',
        accessLevel: ['reservations', 'guests', 'property', 'users', 'reports', 'billing'],
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLogin: ''
      };
      this.storageService.saveUser(supportUser);
    }
  }

  login(username: string, password: string): boolean {
    const users = this.storageService.getAllUsers();
    const user = users.find(u => 
      u.username === username && 
      u.password === password && 
      u.status === 'active'
    );

    if (user) {
      // Update last login
      user.lastLogin = new Date().toISOString();
      this.storageService.updateUser(user);
      
      // Set current user
      this.currentUser.set(user);
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
      return true;
    }

    return false;
  }

  logout() {
    this.currentUser.set(null);
    localStorage.removeItem(this.CURRENT_USER_KEY);
  }

  getCurrentUser(): User | null {
    return this.currentUser();
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  hasAccess(accessLevel: string): boolean {
    const user = this.currentUser();
    if (!user) return false;
    
    // Admin has access to everything
    if (user.role === 'admin') return true;
    
    return user.accessLevel.includes(accessLevel);
  }

  hasRole(role: string): boolean {
    const user = this.currentUser();
    return user?.role === role;
  }
}
