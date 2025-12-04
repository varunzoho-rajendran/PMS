import { Component, signal, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LocalizationService } from '../services/localization.service';


/**
 * Login component for user authentication
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements AfterViewInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  public i18n = inject(LocalizationService);

  @ViewChild('usernameInput') usernameInput!: ElementRef<HTMLInputElement>;
  @ViewChild('passwordInput') passwordInput!: ElementRef<HTMLInputElement>;
  @ViewChild('loginForm') loginForm!: NgForm;

  username = signal('');
  password = signal('');
  errorMessage = signal('');
  loading = signal(false);
  azureLoading = signal(false);

  ngAfterViewInit() {
    // Auto-focus username input on load
    setTimeout(() => this.usernameInput?.nativeElement.focus(), 100);
  }

  login() {
    this.errorMessage.set('');
    this.loading.set(true);

    // Basic validation
    if (!this.username() || !this.password()) {
      this.errorMessage.set('Please enter both username and password');
      this.loading.set(false);
      // Focus on empty field
      if (!this.username()) {
        this.usernameInput.nativeElement.focus();
      } else {
        this.passwordInput.nativeElement.focus();
      }
      return;
    }

    // Attempt login
    const success = this.authService.login(this.username(), this.password());

    if (success) {
      this.router.navigate(['/list']);
    } else {
      this.errorMessage.set('Invalid username or password');
      this.loading.set(false);
      // Clear password and focus username
      this.password.set('');
      this.usernameInput.nativeElement.select();
    }
  }

  /**
   * Login with Azure AD (Microsoft Account)
   */
  loginWithAzureAd() {
    this.errorMessage.set('');
    this.azureLoading.set(true);

    this.authService.loginWithAzureAD().subscribe({
      next: (success) => {
        if (success) {
          // Navigate to main application
          this.router.navigate(['/list']);
        } else {
          this.errorMessage.set('Azure AD login failed. Please try again.');
          this.azureLoading.set(false);
        }
      },
      error: (error) => {
        console.error('Azure AD login error:', error);
        this.errorMessage.set(
          error.message || 'Unable to sign in with Microsoft. Please try again or use username/password.'
        );
        this.azureLoading.set(false);
      },
      complete: () => {
        this.azureLoading.set(false);
      }
    });
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.login();
    }
  }
}
