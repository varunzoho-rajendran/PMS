import { Component, signal, inject, OnInit, ViewChild, ViewChildren, QueryList, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { StorageService, User } from '../services/storage.service';
import { LocalizationService } from '../services/localization.service';
import { ErrorPopupComponent, ErrorMessage } from '../error-popup/error-popup.component';
import { ConfirmPopupComponent, ConfirmMessage } from '../confirm-popup/confirm-popup.component';
import { AzureAdService } from '../services/azure-ad.service';
import { debounceTime, switchMap, of, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ErrorPopupComponent, ConfirmPopupComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit, AfterViewInit, OnDestroy {
  private storageService = inject(StorageService);
  private router = inject(Router);
  public i18n = inject(LocalizationService);
  private azureAdService = inject(AzureAdService);
  private destroy$ = new Subject<void>();

  // Error popup
  isErrorPopupOpen = signal(false);
  errorMessage = signal<ErrorMessage | null>(null);

  // Confirm popup
  isConfirmPopupOpen = signal(false);
  confirmMessage = signal<ConfirmMessage | null>(null);
  private confirmResolve: ((value: boolean) => void) | null = null;

  @ViewChild('userForm') userForm!: NgForm;
  @ViewChild('usernameInput') usernameInput!: ElementRef<HTMLInputElement>;
  @ViewChildren('userCard') userCards!: QueryList<ElementRef>;

  ngAfterViewInit() {
    // Setup view children
  }

  users = signal<User[]>([]);
  selectedUser = signal<User | null>(null);
  showForm = signal(false);
  isEdit = signal(false);
  filteredUsers = signal<User[]>([]);

  user = signal<User>({
    id: '',
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'staff',
    accessLevel: [],
    status: 'active',
    createdAt: '',
    lastLogin: ''
  });

  roles = [
    { value: 'admin', label: 'Administrator', description: 'Full system access' },
    { value: 'manager', label: 'Manager', description: 'Manage reservations, guests, and reports' },
    { value: 'receptionist', label: 'Receptionist', description: 'Handle check-ins, check-outs, and bookings' },
    { value: 'staff', label: 'Staff', description: 'Limited access to specific functions' }
  ];

  availableAccessLevels = [
    { value: 'reservations', label: 'Reservations', icon: '🏨' },
    { value: 'guests', label: 'Guest Management', icon: '👥' },
    { value: 'property', label: 'Property Settings', icon: '🏢' },
    { value: 'users', label: 'User Management', icon: '👤' },
    { value: 'reports', label: 'Reports & Analytics', icon: '📊' },
    { value: 'billing', label: 'Billing & Payments', icon: '💳' }
  ];

  searchControl = new FormControl('');
  filterRole = signal('all');

  ngOnInit() {
    this.loadUsers();
    this.setupSearchWithSwitchMap();
  }

  setupSearchWithSwitchMap() {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      switchMap(searchTerm => {
        // Simulate async search operation (in real app, this would be an API call)
        return of(this.performSearch(searchTerm || ''));
      }),
      takeUntil(this.destroy$)
    ).subscribe(results => {
      this.filteredUsers.set(results);
    });

    // Initialize filtered users
    this.filteredUsers.set(this.users());
  }

  performSearch(searchTerm: string): User[] {
    const search = searchTerm.toLowerCase();
    const role = this.filterRole();

    return this.users().filter(user => {
      const matchesSearch = user.username.toLowerCase().includes(search) ||
                           user.email.toLowerCase().includes(search) ||
                           user.firstName.toLowerCase().includes(search) ||
                           user.lastName.toLowerCase().includes(search);
      const matchesRole = role === 'all' || user.role === role;
      return matchesSearch && matchesRole;
    });
  }

  loadUsers() {
    this.users.set(this.storageService.getAllUsers());
    this.filteredUsers.set(this.users());
  }

  getFilteredUsers() {
    return this.filteredUsers();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  showAddUser() {
    this.showForm.set(true);
    this.isEdit.set(false);
    this.resetForm();
  }

  editUser(user: User) {
    this.user.set({ ...user });
    this.showForm.set(true);
    this.isEdit.set(true);
  }

  viewUserDetails(user: User) {
    this.selectedUser.set(user);
  }

  closeDetails() {
    this.selectedUser.set(null);
  }

  toggleAccessLevel(level: string) {
    const currentAccess = [...this.user().accessLevel];
    const index = currentAccess.indexOf(level);

    if (index > -1) {
      currentAccess.splice(index, 1);
    } else {
      currentAccess.push(level);
    }

    this.user.set({
      ...this.user(),
      accessLevel: currentAccess
    });
  }

  hasAccessLevel(level: string): boolean {
    return this.user().accessLevel.includes(level);
  }

  saveUser() {
    // Validation
    if (!this.user().username || !this.user().email || !this.user().firstName || !this.user().lastName) {
      this.showError('Validation Error', 'Please fill in all required fields.', 'warning');
      return;
    }

    if (!this.isEdit() && !this.user().password) {
      this.showError('Validation Error', 'Password is required for new users.', 'warning');
      return;
    }

    if (this.user().password && this.user().password.length < 6) {
      this.showError('Validation Error', 'Password must be at least 6 characters long.', 'warning');
      return;
    }

    const now = new Date().toISOString();
    const userData: User = {
      ...this.user(),
      id: this.user().id || this.storageService.generateUserId(),
      createdAt: this.user().createdAt || now
    };

    if (this.isEdit()) {
      this.storageService.updateUser(userData);
    } else {
      this.storageService.saveUser(userData);
    }

    this.loadUsers();
    this.showForm.set(false);
    this.resetForm();
  }

  async deleteUser(id: string) {
    const confirmed = await this.showConfirm(
      'Delete User',
      'Are you sure you want to delete this user?',
      'Delete',
      'Cancel'
    );
    
    if (!confirmed) return;
    
    this.storageService.deleteUser(id);
    this.loadUsers();
    if (this.selectedUser()?.id === id) {
      this.selectedUser.set(null);
    }
  }

  updateUserStatus(id: string, status: 'active' | 'inactive') {
    this.storageService.updateUserStatus(id, status);
    this.loadUsers();
    const updated = this.storageService.getUserById(id);
    if (updated) {
      this.selectedUser.set(updated);
    }
  }

  async resetForm() {
    const confirmed = await this.showConfirm(
      'Reset Form',
      'Are you sure you want to reset the form? All unsaved changes will be lost.',
      'Reset',
      'Cancel'
    );
    
    if (!confirmed) return;
    
    this.closeModal();
  }

  hasFormData(): boolean {
    const u = this.user();
    return u.username !== '' ||
           u.email !== '' ||
           u.password !== '' ||
           u.firstName !== '' ||
           u.lastName !== '' ||
           u.phone !== '';
  }

  async closeModal() {
    // If form has data, ask for confirmation
    if (this.hasFormData()) {
      const confirmed = await this.showConfirm(
        'Close Form',
        'You have unsaved changes. Are you sure you want to close?',
        'Close',
        'Cancel'
      );
      if (!confirmed) return;
    }
    
    this.showForm.set(false);
    this.user.set({
      id: '',
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      role: 'staff',
      accessLevel: [],
      status: 'active',
      createdAt: '',
      lastLogin: ''
    });
  }

  cancelForm() {
    this.closeModal();
  }

  getRoleBadgeClass(role: string): string {
    const classes: { [key: string]: string } = {
      'admin': 'role-admin',
      'manager': 'role-manager',
      'receptionist': 'role-receptionist',
      'staff': 'role-staff'
    };
    return classes[role] || '';
  }

  getStatusClass(status: string): string {
    return status === 'active' ? 'status-active' : 'status-inactive';
  }

  // Azure AD Sync functionality
  selectedUsersForSync = signal<string[]>([]);
  isSyncing = signal(false);

  toggleUserSelection(userId: string) {
    const current = this.selectedUsersForSync();
    const index = current.indexOf(userId);
    
    if (index > -1) {
      this.selectedUsersForSync.set(current.filter(id => id !== userId));
    } else {
      this.selectedUsersForSync.set([...current, userId]);
    }
  }

  isUserSelected(userId: string): boolean {
    return this.selectedUsersForSync().includes(userId);
  }

  async testAzurePermissions() {
    try {
      const token = await this.azureAdService.getAdminAccessToken().toPromise();
      this.showError(
        'Permissions Test',
        'Successfully acquired admin token! You have the required permissions to create users.',
        'success'
      );
    } catch (error: any) {
      this.showError(
        'Permissions Test Failed',
        `Error: ${error.message}\n\nPlease ensure:\n1. Admin consent is granted in Azure Portal\n2. You have User Administrator or Global Admin role\n3. You are signed in with correct account`,
        'error'
      );
    }
  }

  async syncToAzureAD() {
    const selectedIds = this.selectedUsersForSync();
    
    if (selectedIds.length === 0) {
      this.showError('No Users Selected', 'Please select at least one user to sync to Azure AD.', 'warning');
      return;
    }

    const confirmed = await this.showConfirm(
      'Sync to Azure AD',
      `Are you sure you want to create ${selectedIds.length} user(s) in Azure AD? They will receive temporary passwords and must change them on first login.`,
      'Yes, Sync Now',
      'Cancel'
    );

    if (!confirmed) return;

    this.isSyncing.set(true);
    const usersToSync = this.users().filter(u => selectedIds.includes(u.id));
    
    let successCount = 0;
    let failCount = 0;
    const results: string[] = [];

    for (const user of usersToSync) {
      try {
        const result = await this.azureAdService.createAzureAdUser(user).toPromise();
        if (result.success) {
          successCount++;
          results.push(`✓ ${user.username}: Created (Temp Password: ${result.temporaryPassword})`);
        } else {
          failCount++;
          results.push(`✗ ${user.username}: Failed`);
        }
      } catch (error: any) {
        failCount++;
        const errorMsg = error.message || 'Unknown error';
        results.push(`✗ ${user.username}: ${errorMsg}`);
        console.error(`Failed to create user ${user.username}:`, error);
      }
    }

    this.isSyncing.set(false);
    this.selectedUsersForSync.set([]);

    // Show results
    const resultMessage = results.join('\n\n');
    this.showError(
      'Azure AD Sync Complete',
      `Success: ${successCount} | Failed: ${failCount}\n\n${resultMessage}`,
      successCount > 0 ? 'success' : 'error'
    );
  }

  selectAllUsers() {
    const allIds = this.getFilteredUsers().map(u => u.id);
    this.selectedUsersForSync.set(allIds);
  }

  deselectAllUsers() {
    this.selectedUsersForSync.set([]);
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

  // Confirm popup methods
  showConfirm(title: string, message: string, confirmText = 'Confirm', cancelText = 'Cancel'): Promise<boolean> {
    return new Promise((resolve) => {
      this.confirmResolve = resolve;
      this.confirmMessage.set({ title, message, confirmText, cancelText });
      this.isConfirmPopupOpen.set(true);
    });
  }

  onConfirmed() {
    this.isConfirmPopupOpen.set(false);
    if (this.confirmResolve) {
      this.confirmResolve(true);
      this.confirmResolve = null;
    }
    setTimeout(() => this.confirmMessage.set(null), 300);
  }

  onCancelled() {
    this.isConfirmPopupOpen.set(false);
    if (this.confirmResolve) {
      this.confirmResolve(false);
      this.confirmResolve = null;
    }
    setTimeout(() => this.confirmMessage.set(null), 300);
  }
}
