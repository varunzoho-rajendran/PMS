# Azure AD User Sync Feature

## Overview
This feature allows you to programmatically create Azure AD users from your local PMS user database using Microsoft Graph API.

## Prerequisites

### 1. Azure AD Admin Permissions Required
Your Azure AD application needs additional API permissions to create users:

1. Go to **Azure Portal** → **Microsoft Entra ID** → **App registrations**
2. Select your **PMS Application**
3. Go to **API permissions**
4. Click **+ Add a permission** → **Microsoft Graph** → **Delegated permissions**
5. Add the following permissions:
   - ✅ `User.ReadWrite.All` - Create and manage users
   - ✅ `Directory.ReadWrite.All` - Full directory access
6. Click **Add permissions**
7. **IMPORTANT**: Click **Grant admin consent for [Your Organization]**
   - This requires Global Administrator or Privileged Role Administrator access
   - Without admin consent, the sync will fail

### 2. Required Azure AD Role
The user performing the sync must have one of these Azure AD roles:
- **Global Administrator**
- **User Administrator**
- **Privileged Authentication Administrator**

## How to Use

### Step 1: Navigate to User Management
1. Log in to the PMS application
2. Go to **User Management** section

### Step 2: Select Users to Sync
1. Use checkboxes to select individual users
2. Or click **Select All** to select all visible users
3. Click **Deselect All** to clear selection

### Step 3: Sync to Azure AD
1. Click the **☁️ Sync to Azure AD (X)** button
   - The number shows how many users are selected
2. Confirm the sync operation
3. Wait for the process to complete

### Step 4: Review Results
- Success message shows:
  - Number of users created successfully
  - Number of failed creations
  - Temporary password for each user (SAVE THESE!)
  - Error messages for failures

## Important Notes

### Temporary Passwords
- Each user is created with a **secure temporary password**
- Users **MUST change password on first login**
- **Save the temporary passwords immediately** - they won't be shown again
- Share passwords securely with users (email, Teams, etc.)

### User Principal Name (UPN)
- Uses the **email address** from local user as UPN
- Format: `user@yourdomain.com`
- Must be unique in Azure AD

### What Gets Synced
From local PMS user to Azure AD:
- ✅ First Name → `givenName`
- ✅ Last Name → `surname`
- ✅ Display Name → `firstName lastName`
- ✅ Email → `userPrincipalName`
- ✅ Username → `mailNickname`
- ✅ Phone → `mobilePhone` (if provided)

### What Doesn't Get Synced
- ❌ Password (Azure AD generates temporary password)
- ❌ Role (managed separately in Azure AD)
- ❌ Access Level (PMS-specific)

## Common Issues

### Error: "Insufficient privileges"
**Cause**: Missing admin consent for API permissions

**Solution**:
1. Go to Azure Portal → App registrations → Your app
2. API permissions → Grant admin consent
3. Retry the sync

### Error: "User already exists"
**Cause**: User with same email already exists in Azure AD

**Solution**:
1. Check Azure AD for existing user
2. Either delete the duplicate or use a different email
3. Retry with remaining users

### Error: "Invalid domain"
**Cause**: Email domain not verified in Azure AD

**Solution**:
1. Add and verify the domain in Azure AD
2. Or use emails with verified domain

### Error: "Access denied"
**Cause**: Logged-in user doesn't have required Azure AD role

**Solution**:
1. Log in with Global Administrator or User Administrator account
2. Or request necessary role assignment from admin

## Security Best Practices

1. **Limit Access**: Only grant User Administrator role to trusted admins
2. **Secure Passwords**: Share temporary passwords through secure channels
3. **Audit**: Review sync results and verify created users
4. **Monitor**: Check Azure AD sign-in logs for new users
5. **Cleanup**: Remove unused local users before syncing

## Technical Details

### API Endpoint Used
```
POST https://graph.microsoft.com/v1.0/users
```

### Required Scopes
```typescript
scopes: ['User.ReadWrite.All', 'Directory.ReadWrite.All']
```

### Password Policy
- Minimum 16 characters
- Contains uppercase, lowercase, numbers, and special characters
- Force change on first sign-in

## Troubleshooting

### Check Browser Console
Open Developer Tools (F12) and check Console tab for detailed error messages.

### Verify Permissions
```typescript
// In browser console, check token scopes:
localStorage.getItem('msal.token.keys')
```

### Test with Single User
Before syncing multiple users, test with one user to verify setup.

## Support

For issues or questions:
1. Check Azure AD audit logs
2. Review browser console errors
3. Verify API permissions in Azure Portal
4. Contact your Azure AD administrator
