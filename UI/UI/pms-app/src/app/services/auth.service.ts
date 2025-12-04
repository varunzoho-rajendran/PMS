import { Injectable, signal, inject } from '@angular/core';
import { StorageService, User } from './storage.service';
import { AzureAdService } from './azure-ad.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

/**
 * Authentication service for managing user login/logout and access control
 * Supports both traditional username/password and Azure AD Single Sign-On
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = signal<User | null>(null);
  private readonly CURRENT_USER_KEY = 'pms_current_user';
  private readonly AUTH_METHOD_KEY = 'pms_auth_method'; // 'local' or 'azuread'
  private azureAdService = inject(AzureAdService);

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
      localStorage.setItem(this.AUTH_METHOD_KEY, 'local');
      return true;
    }

    return false;
  }

  /**
   * Login with Azure AD Single Sign-On
   */
  loginWithAzureAD(): Observable<boolean> {
    return this.azureAdService.loginPopup().pipe(
      map(azureUser => {
        // Check if user exists in local database, if not create them
        let user = this.findOrCreateAzureUser(azureUser);
        
        // Update last login
        user.lastLogin = new Date().toISOString();
        this.storageService.updateUser(user);
        
        // Set current user
        this.currentUser.set(user);
        localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
        localStorage.setItem(this.AUTH_METHOD_KEY, 'azuread');
        
        return true;
      }),
      catchError(error => {
        console.error('Azure AD login failed:', error);
        return of(false);
      })
    );
  }

  /**
   * Find or create Azure AD user in local database
   */
  private findOrCreateAzureUser(azureUser: User): User {
    const users = this.storageService.getAllUsers();
    let user = users.find(u => u.email === azureUser.email);

    if (!user) {
      // Create new user from Azure AD info
      user = {
        ...azureUser,
        id: this.storageService.generateUserId(),
        status: 'active',
        createdAt: new Date().toISOString()
      };
      this.storageService.saveUser(user);
    }

    return user;
  }

  /**
   * Check if current session is Azure AD
   */
  isAzureAdSession(): boolean {
    return localStorage.getItem(this.AUTH_METHOD_KEY) === 'azuread';
  }

  logout() {
    const isAzureAd = this.isAzureAdSession();
    
    this.currentUser.set(null);
    localStorage.removeItem(this.CURRENT_USER_KEY);
    localStorage.removeItem(this.AUTH_METHOD_KEY);

    // If Azure AD session, also logout from Azure AD
    if (isAzureAd) {
      this.azureAdService.logout().subscribe({
        next: () => console.log('Logged out from Azure AD'),
        error: (error) => console.error('Azure AD logout error:', error)
      });
    }
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
