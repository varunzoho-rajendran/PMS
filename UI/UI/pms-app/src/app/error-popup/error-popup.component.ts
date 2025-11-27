import { Component, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ErrorMessage {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
}

@Component({
  selector: 'app-error-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './error-popup.component.html',
  styleUrl: './error-popup.component.css'
})
export class ErrorPopupComponent {
  @Input() isOpen = signal(false);
  @Input() error: ErrorMessage | null = null;
  @Output() closePopup = new EventEmitter<void>();

  close() {
    this.closePopup.emit();
  }

  handleOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  getIcon(): string {
    if (!this.error) return '⚠️';
    
    switch (this.error.type) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'success':
        return '✅';
      default:
        return '⚠️';
    }
  }

  getIconColor(): string {
    if (!this.error) return '#f59e0b';
    
    switch (this.error.type) {
      case 'error':
        return '#dc3545';
      case 'warning':
        return '#f59e0b';
      case 'info':
        return '#17a2b8';
      case 'success':
        return '#28a745';
      default:
        return '#f59e0b';
    }
  }
}
