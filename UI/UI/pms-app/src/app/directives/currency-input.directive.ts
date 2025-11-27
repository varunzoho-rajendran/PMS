import { Directive, ElementRef, HostListener, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: '[appCurrencyInput]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CurrencyInputDirective),
      multi: true
    }
  ]
})
export class CurrencyInputDirective implements ControlValueAccessor {
  private onChange: (value: number) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private el: ElementRef) {}

  writeValue(value: number): void {
    if (value !== null && value !== undefined) {
      this.el.nativeElement.value = this.formatCurrency(value);
    }
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  @HostListener('focus', ['$event'])
  onFocus(event: FocusEvent): void {
    const target = event.target as HTMLInputElement;
    // Remove formatting on focus for easier editing
    const value = this.unformatCurrency(target.value);
    target.value = value !== null ? value.toString() : '';
    target.select();
  }

  @HostListener('blur', ['$event'])
  onBlur(event: FocusEvent): void {
    const target = event.target as HTMLInputElement;
    this.onTouched();
    const value = this.unformatCurrency(target.value);
    if (value !== null) {
      target.value = this.formatCurrency(value);
      this.onChange(value);
    }
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    // Allow only numbers and decimal point during input
    let value = target.value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    target.value = value;
    
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      this.onChange(numValue);
    }
  }

  private formatCurrency(value: number): string {
    return '$' + value.toFixed(2);
  }

  private unformatCurrency(value: string): number | null {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }
}
