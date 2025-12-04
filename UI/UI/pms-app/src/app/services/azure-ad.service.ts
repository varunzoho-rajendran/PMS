import { Injectable, inject } from '@angular/core';
import { 
  PublicClientApplication, 
  AccountInfo, 
  AuthenticationResult,
  InteractionRequiredAuthError,
  SilentRequest
} from '@azure/msal-browser';
import { msalConfig, loginRequest, graphConfig } from '../config/auth-config';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs';
import { User } from './storage.service';

/**
 * Azure AD Single Sign-On Service
 * Handles Microsoft authentication and user profile retrieval
 */
@Injectable({
  providedIn: 'root'
})
export class AzureAdService {
  private http = inject(HttpClient);
  private msalInstance: PublicClientApplication;
  private account: AccountInfo | null = null;

  constructor() {
    this.msalInstance = new PublicClientApplication(msalConfig);
    this.initializeMsal();
  }

  /**
   * Initialize MSAL instance
   */
  private async initializeMsal(): Promise<void> {
    await this.msalInstance.initialize();
    await this.msalInstance.handleRedirectPromise();
    
    const accounts = this.msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      this.account = accounts[0];
      this.msalInstance.setActiveAccount(this.account);
    }
  }

  /**
   * Login with popup (recommended for SPAs)
   */
  loginPopup(): Observable<User> {
    return from(this.msalInstance.loginPopup(loginRequest)).pipe(
      map((response: AuthenticationResult) => {
        this.account = response.account;
        this.msalInstance.setActiveAccount(this.account);
        return this.mapAzureUserToAppUser(response.account);
      }),
      catchError(error => {
        console.error('Azure AD Login Error:', error);
        return throwError(() => new Error('Failed to login with Azure AD: ' + error.message));
      })
    );
  }

  /**
   * Login with redirect (alternative method)
   */
  loginRedirect(): void {
    this.msalInstance.loginRedirect(loginRequest);
  }

  /**
   * Logout
   */
  logout(): Observable<void> {
    const account = this.msalInstance.getActiveAccount();
    return from(
      this.msalInstance.logoutPopup({
        account: account || undefined
      })
    ).pipe(
      map(() => {
        this.account = null;
      }),
      catchError(error => {
        console.error('Logout error:', error);
        return of(undefined);
      })
    );
  }

  /**
   * Get access token silently
   */
  getAccessToken(): Observable<string> {
    const account = this.msalInstance.getActiveAccount();
    
    if (!account) {
      return throwError(() => new Error('No active account'));
    }

    const silentRequest: SilentRequest = {
      scopes: loginRequest.scopes,
      account: account
    };

    return from(
      this.msalInstance.acquireTokenSilent(silentRequest)
    ).pipe(
      map((response: AuthenticationResult) => response.accessToken),
      catchError((error) => {
        if (error instanceof InteractionRequiredAuthError) {
          // Fallback to interactive method
          return from(this.msalInstance.acquireTokenPopup(loginRequest)).pipe(
            map((response: AuthenticationResult) => response.accessToken)
          );
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Get user profile from Microsoft Graph API
   */
  getUserProfile(): Observable<any> {
    return this.getAccessToken().pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });
        
        return this.http.get(graphConfig.graphMeEndpoint, { headers });
      }),
      catchError(error => {
        console.error('Error fetching user profile:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    const account = this.msalInstance.getActiveAccount();
    return account !== null;
  }

  /**
   * Get current account
   */
  getAccount(): AccountInfo | null {
    return this.msalInstance.getActiveAccount();
  }

  /**
   * Map Azure AD user to application User format
   */
  private mapAzureUserToAppUser(account: AccountInfo): User {
    // Extract name parts
    const nameParts = account.name?.split(' ') || [];
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || '';

    return {
      id: account.localAccountId,
      username: account.username,
      email: account.username,
      password: '', // No password for SSO users
      firstName: firstName,
      lastName: lastName,
      phone: '',
      role: 'staff', // Default role, can be customized based on Azure AD groups
      accessLevel: ['reservations', 'guests'], // Default access, customize as needed
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
  }

  /**
   * Get user details from token claims
   */
  getUserFromToken(): User | null {
    const account = this.msalInstance.getActiveAccount();
    if (!account) {
      return null;
    }
    
    return this.mapAzureUserToAppUser(account);
  }

  /**
   * Get user's Azure AD groups (for role-based access)
   */
  getUserGroups(): Observable<string[]> {
    return this.getAccessToken().pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });
        
        return this.http.get<any>(
          'https://graph.microsoft.com/v1.0/me/memberOf',
          { headers }
        );
      }),
      map(response => {
        return response.value.map((group: any) => group.displayName);
      }),
      catchError(error => {
        console.error('Error fetching user groups:', error);
        return of([]);
      })
    );
  }
}
