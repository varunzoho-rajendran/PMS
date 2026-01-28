import { Configuration, PopupRequest } from '@azure/msal-browser';

/**
 * Azure AD / Microsoft Entra ID Configuration
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to Azure Portal (https://portal.azure.com)
 * 2. Navigate to "Microsoft Entra ID" (formerly Azure AD)
 * 3. Click "App registrations" -> "New registration"
 * 4. Enter name: "PMS Application"
 * 5. Select account type (usually "Accounts in this organizational directory only")
 * 6. Add Redirect URI: http://localhost:4200 (for development)
 * 7. Click "Register"
 * 8. Copy the "Application (client) ID" and "Directory (tenant) ID"
 * 9. Go to "Authentication" -> Enable "Access tokens" and "ID tokens"
 * 10. Go to "API permissions" -> Add "User.Read" permission
 * 11. Update the values below with your Azure AD details
 */

export const msalConfig: Configuration = {
  auth: {
    clientId: '5f6f5a1b-1d64-49ab-ad33-07b15994bb69', // Replace with your Azure AD Application (client) ID
    authority: 'https://login.microsoftonline.com/6dc863ef-2b42-4a1b-848e-7dec16aebf96', // Replace with your Tenant ID
    redirectUri: 'http://localhost:4200', // Change to your production URL when deploying
    postLogoutRedirectUri: 'http://localhost:4200/login'
  },
  cache: {
    cacheLocation: 'localStorage', // Store tokens in localStorage
    storeAuthStateInCookie: false, // Set to true for IE11 or Edge
  }
};

/**
 * Scopes for Microsoft Graph API
 * User.Read - Read user profile information
 */
export const loginRequest: PopupRequest = {
  scopes: ['User.Read', 'openid', 'profile', 'email']
};

/**
 * Admin scopes for creating users
 * Requires admin consent in Azure Portal
 */
export const adminRequest: PopupRequest = {
  scopes: [
    'User.ReadWrite.All',  // Create and manage users
    'Directory.ReadWrite.All'  // Full directory access
  ]
};

/**
 * Graph API endpoint for getting user profile
 */
export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
  graphUsersEndpoint: 'https://graph.microsoft.com/v1.0/users'
};

/**
 * Protected resources configuration
 */
export const protectedResources = {
  graphMe: {
    endpoint: 'https://graph.microsoft.com/v1.0/me',
    scopes: ['User.Read']
  },
  graphUsers: {
    endpoint: 'https://graph.microsoft.com/v1.0/users',
    scopes: ['User.ReadWrite.All', 'Directory.ReadWrite.All']
  }
};
