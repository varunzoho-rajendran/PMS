import { Injectable, inject } from '@angular/core';
import { 
  PublicClientApplication, 
  AccountInfo, 
  AuthenticationResult,
  InteractionRequiredAuthError,
  SilentRequest
} from '@azure/msal-browser';
import { msalConfig, loginRequest, adminRequest, graphConfig } from '../config/auth-config';
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
      role: 'admin', // Give Azure AD users admin role for full access
      accessLevel: ['reservations', 'guests', 'property', 'users', 'reports', 'billing'], // Full access to all modules
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

  /**
   * Get admin access token with elevated permissions
   */
  getAdminAccessToken(): Observable<string> {
    const account = this.msalInstance.getActiveAccount();
    
    if (!account) {
      return throwError(() => new Error('No active account'));
    }

    const silentRequest: SilentRequest = {
      scopes: adminRequest.scopes,
      account: account
    };

    return from(
      this.msalInstance.acquireTokenSilent(silentRequest)
    ).pipe(
      map((response: AuthenticationResult) => response.accessToken),
      catchError((error) => {
        if (error instanceof InteractionRequiredAuthError) {
          // Fallback to interactive method for admin consent
          return from(this.msalInstance.acquireTokenPopup(adminRequest)).pipe(
            map((response: AuthenticationResult) => response.accessToken)
          );
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new user in Azure AD
   */
  createAzureAdUser(user: User): Observable<any> {
    return this.getAdminAccessToken().pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });

        // Validate email format
        if (!user.email || !user.email.includes('@')) {
          return throwError(() => new Error('Invalid email address'));
        }

        // Generate temporary password
        const tempPassword = this.generateTemporaryPassword();
        
        // Clean username for mailNickname (only alphanumeric)
        const cleanMailNickname = user.username.replace(/[^a-zA-Z0-9]/g, '');
        
        const azureUser = {
          accountEnabled: true,
          displayName: `${user.firstName} ${user.lastName}`,
          mailNickname: cleanMailNickname || `user${Date.now()}`,
          userPrincipalName: user.email,
          passwordProfile: {
            forceChangePasswordNextSignIn: true,
            password: tempPassword
          },
          givenName: user.firstName,
          surname: user.lastName,
          mobilePhone: user.phone || null
        };
        
        console.log('Creating Azure AD user with data:', JSON.stringify(azureUser, null, 2));
        
        return this.http.post(
          graphConfig.graphUsersEndpoint,
          azureUser,
          { headers }
        ).pipe(
          map(response => ({
            success: true,
            user: response,
            temporaryPassword: tempPassword
          }))
        );
      }),
      catchError(error => {
        console.error('Full error object:', error);
        let errorMessage = 'Failed to create user in Azure AD';
        
        // Try to extract detailed error message
        if (error.error?.error?.message) {
          errorMessage = error.error.error.message;
        } else if (error.error?.error?.code) {
          errorMessage = `${error.error.error.code}: ${error.error.error.message || 'Unknown error'}`;
        } else if (error.message) {
          errorMessage = error.message;
        } else if (error.status === 403) {
          errorMessage = 'Permission denied. Ensure admin consent is granted for User.ReadWrite.All and Directory.ReadWrite.All permissions.';
        } else if (error.status === 401) {
          errorMessage = 'Unauthorized. Please sign in with an administrator account.';
        } else if (error.status === 400) {
          // Try to get more specific 400 error details
          const errorDetails = JSON.stringify(error.error || error);
          errorMessage = `Invalid request: ${errorDetails}. Common causes: email domain not verified in Azure AD, or user already exists.`;
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Generate a secure temporary password
   */
  private generateTemporaryPassword(): string {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Ensure password has at least one of each required type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Batch create users in Azure AD
   */
  batchCreateUsers(users: User[]): Observable<any[]> {
    const createRequests = users.map(user => 
      this.createAzureAdUser(user).pipe(
        catchError(error => of({ success: false, user, error: error.message }))
      )
    );
    
    return from(createRequests).pipe(
      switchMap(requests => from(requests)),
      map(result => result),
      catchError(error => {
        console.error('Batch create error:', error);
        return of([]);
      })
    );
  }
}
