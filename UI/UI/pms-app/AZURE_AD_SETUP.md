# Azure AD Single Sign-On Setup Guide

## Overview
This application now supports Microsoft Azure AD (Entra ID) Single Sign-On in addition to traditional username/password authentication.

## Prerequisites
- Azure subscription with Admin access
- Azure Active Directory (Entra ID) tenant
- Application running on http://localhost:4200 (or your configured URL)

## Step 1: Register Application in Azure Portal

1. **Navigate to Azure Portal**s

   - Go to https://portal.azure.com
   - Sign in with your Azure account

2. **Open Microsoft Entra ID (Azure AD)**
   - Search for "Microsoft Entra ID" in the top search bar
   - Click on the service

3. **Register New Application**
   - In the left menu, click **App registrations**
   - Click **+ New registration**
   - Fill in the details:
     - **Name**: PMS Application (or your preferred name)
     - **Supported account types**: Select based on your needs:
       - "Single tenant" - Only users in your organization
       - "Multitenant" - Users from any Azure AD organization
       - "Multitenant and personal accounts" - Includes Microsoft accounts
     - **Redirect URI**: 
       - Platform: Single-page application (SPA)
       - URI: `http://localhost:4200` (update for production)
   - Click **Register**

4. **Note Your Application IDs**
   - After registration, you'll see the **Overview** page
   - Copy the following values:
     - **Application (client) ID** - You'll need this for `clientId`
     - **Directory (tenant) ID** - You'll need this for `tenantId`

## Step 2: Configure API Permissions

1. **Add Microsoft Graph Permissions**
   - In your app registration, go to **API permissions**
   - Click **+ Add a permission**
   - Select **Microsoft Graph**
   - Select **Delegated permissions**
   - Add the following permissions:
     - `User.Read` - Read user profile
     - `openid` - Sign in users
     - `profile` - Read user's profile
     - `email` - Read user's email
   - Click **Add permissions**

2. **Grant Admin Consent** (if required by your organization)
   - Click **Grant admin consent for [Your Organization]**
   - Click **Yes** to confirm

## Step 3: Configure the Application

1. **Update auth-config.ts**
   - Open `src/app/services/auth-config.ts`
   - Replace the placeholder values:

```typescript
export const msalConfig: Configuration = {
  auth: {
    clientId: 'YOUR_CLIENT_ID_HERE',        // Replace with Application (client) ID
    authority: 'https://login.microsoftonline.com/YOUR_TENANT_ID_HERE', // Replace with Directory (tenant) ID
    redirectUri: 'http://localhost:4200'    // Update for production
  },
  // ... rest of config
};
```

2. **Example Configuration**
```typescript
export const msalConfig: Configuration = {
  auth: {
    clientId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    authority: 'https://login.microsoftonline.com/12345678-90ab-cdef-1234-567890abcdef',
    redirectUri: 'http://localhost:4200'
  },
  // ... rest of config
};
```

## Step 4: Test the Integration

1. **Start the Application**
   ```bash
   npm start
   ```

2. **Navigate to Login Page**
   - Open http://localhost:4200
   - You should see two login options:
     - Traditional username/password
     - "Sign in with Microsoft" button

3. **Test Azure AD Login**
   - Click "Sign in with Microsoft"
   - A popup window will open with Microsoft login
   - Enter your Azure AD credentials
   - Grant consent if prompted
   - You should be redirected to the application

4. **Verify User Creation**
   - After successful login, the user is automatically created in local storage
   - Default role: `staff`
   - Default access: `reservations`, `guests`

## Step 5: Production Deployment

### Update Redirect URIs

1. **In Azure Portal**
   - Go to your app registration
   - Navigate to **Authentication**
   - Under **Single-page application**, add your production URL:
     - Example: `https://yourdomain.com`
   - Click **Save**

2. **In auth-config.ts**
   ```typescript
   export const msalConfig: Configuration = {
     auth: {
       clientId: 'your-client-id',
       authority: 'https://login.microsoftonline.com/your-tenant-id',
       redirectUri: window.location.origin // Automatically uses current domain
     },
     // ... rest of config
   };
   ```

## User Management

### How Azure AD Users are Handled

1. **First Login**
   - User authenticates with Azure AD
   - System checks if user exists in local database
   - If not found, creates new user with:
     - Email from Azure AD
     - Display name from Azure AD
     - Default role: `staff`
     - Default access: `reservations`, `guests`

2. **Subsequent Logins**
   - System finds existing user
   - Updates email/name if changed in Azure AD
   - Preserves custom roles and permissions

### Assigning Roles to Azure AD Users

After first login, you can update user roles:

1. Login as admin
2. Navigate to Users page
3. Find the Azure AD user (email will match Azure AD)
4. Edit user and assign appropriate roles
5. Changes persist across sessions

## Security Considerations

### Token Storage
- Access tokens stored in browser's localStorage
- Tokens automatically refresh when expired
- Logout clears all tokens

### Session Management
- System tracks authentication method (local vs Azure AD)
- Logout properly handles Azure AD session cleanup
- Tokens expire after 1 hour (configurable in Azure)

### Permissions
- Minimum required permissions already configured
- Only requests User.Read scope by default
- No write permissions to Azure AD

## Troubleshooting

### Common Issues

1. **"AADSTS50011: Redirect URI mismatch"**
   - Check that redirect URI in code matches Azure Portal
   - Ensure protocol (http/https) matches
   - Verify no trailing slashes

2. **"AADSTS700016: Application not found"**
   - Verify clientId is correct
   - Check if app registration is enabled
   - Ensure you're using the right tenant

3. **"Popup blocked"**
   - Browser blocking popup window
   - Allow popups for your domain
   - Try loginRedirect() instead of loginPopup()

4. **Token refresh fails**
   - Clear browser cache and localStorage
   - Re-login with Azure AD
   - Check token lifetime in Azure Portal

5. **User not created after login**
   - Check browser console for errors
   - Verify auth.service.ts is properly configured
   - Check localStorage for authentication data

### Debug Mode

Enable detailed logging in auth-config.ts:
```typescript
export const msalConfig: Configuration = {
  // ... other config
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        console.log('[MSAL]', message);
      },
      piiLoggingEnabled: false,
      logLevel: LogLevel.Verbose // Change from Error to Verbose
    }
  }
};
```

## Advanced Configuration

### Custom Role Mapping from Azure AD Groups

Currently implemented in `azure-ad.service.ts`:

```typescript
getUserGroups(): Observable<string[]> {
  return this.getAccessToken().pipe(
    switchMap(token => {
      return this.http.get<any>(`${graphConfig.graphMeEndpoint}/memberOf`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }),
    map(response => response.value.map((group: any) => group.displayName))
  );
}
```

You can extend `findOrCreateAzureUser()` in `auth.service.ts` to map Azure AD groups to roles:

```typescript
findOrCreateAzureUser(azureUser: User): User {
  // Get user groups
  this.azureAdService.getUserGroups().subscribe(groups => {
    if (groups.includes('PMS-Admins')) {
      azureUser.role = 'admin';
    } else if (groups.includes('PMS-Managers')) {
      azureUser.role = 'manager';
    }
    // Save updated user
  });
  // ... rest of logic
}
```

### Switching from Popup to Redirect

If popup authentication causes issues, use redirect flow:

In `login.component.ts`:
```typescript
loginWithAzureAd() {
  this.errorMessage.set('');
  this.azureLoading.set(true);
  
  // Use redirect instead of popup
  this.azureAdService.loginRedirect();
  // Note: User will be redirected away from the page
}
```

### Multi-Tenant Support

To support users from any organization:

1. In Azure Portal, set **Supported account types** to "Multitenant"
2. Update authority in auth-config.ts:
```typescript
authority: 'https://login.microsoftonline.com/common'
```

## Support

For issues or questions:
- Check MSAL documentation: https://docs.microsoft.com/azure/active-directory/develop/msal-overview
- Review Azure AD app registration: https://portal.azure.com
- Check browser console for detailed error messages

## Security Best Practices

1. **Never commit clientId/tenantId to public repositories**
   - Use environment variables for production
   - Keep auth-config.ts in .gitignore if using real credentials

2. **Regularly review API permissions**
   - Remove unused permissions
   - Follow principle of least privilege

3. **Monitor authentication logs**
   - Azure Portal > Sign-in logs
   - Review for suspicious activity

4. **Implement conditional access policies**
   - Require MFA for sensitive operations
   - Restrict access by IP/location if needed

5. **Keep packages updated**
   - Regularly update @azure/msal-browser
   - Check for security advisories
