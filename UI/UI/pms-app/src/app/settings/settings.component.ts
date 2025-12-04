import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StorageService } from '../services/storage.service';
import { LocalizationService } from '../services/localization.service';
import { FormatService } from '../services/format.service';
import { ErrorPopupComponent, ErrorMessage } from '../error-popup/error-popup.component';
import { ConfirmPopupComponent, ConfirmMessage } from '../confirm-popup/confirm-popup.component';

export interface RatePlan {
  id: string;
  name: string;
  description: string;
  roomTypes: string[];
  baseRate: number;
  isActive: boolean;
  createdAt: string;
}

export interface DateRate {
  id: string;
  ratePlanId: string;
  roomTypes: string[];
  date: string;
  rate: number;
  isSpecialRate: boolean;
  notes?: string;
}

export interface PackagePlan {
  id: string;
  name: string;
  description: string;
  nights: number;
  inclusions: string[];
  totalPrice: number;
  discountPercent: number;
  isActive: boolean;
  validFrom: string;
  validTo: string;
  createdAt: string;
}

export interface RatePlanRestriction {
  id: string;
  ratePlanId: string;
  restrictionType: 'min-stay' | 'max-stay' | 'closed-to-arrival' | 'closed-to-departure' | 'stop-sell';
  startDate: string;
  endDate: string;
  minStayNights?: number;
  maxStayNights?: number;
  daysOfWeek?: string[];
  notes?: string;
  isActive: boolean;
}

export interface PackageRestriction {
  id: string;
  packagePlanId: string;
  restrictionType: 'booking-window' | 'blackout-dates' | 'min-advance' | 'max-advance';
  startDate: string;
  endDate: string;
  minAdvanceDays?: number;
  maxAdvanceDays?: number;
  notes?: string;
  isActive: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ErrorPopupComponent, ConfirmPopupComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  private storageService = inject(StorageService);
  private router = inject(Router);
  public i18n = inject(LocalizationService);
  public format = inject(FormatService);

  // Active tab
  activeTab = signal<'rate-plans' | 'date-rates' | 'packages' | 'rate-restrictions' | 'package-restrictions' | 'room-types'>('rate-plans');

  // Rate Plans
  ratePlans = signal<RatePlan[]>([]);
  showRatePlanForm = signal(false);
  editingRatePlan = signal<RatePlan | null>(null);
  ratePlanName = signal('');
  ratePlanDescription = signal('');
  ratePlanRoomTypes = signal<string[]>([]);
  ratePlanBaseRate = signal(0);
  ratePlanActive = signal(true);

  // Date Rates
  dateRates = signal<DateRate[]>([]);
  showDateRateForm = signal(false);
  editingDateRate = signal<DateRate | null>(null);
  dateRateRatePlanId = signal('');
  dateRateRoomTypes = signal<string[]>([]);
  dateRateStartDate = signal('');
  dateRateEndDate = signal('');
  dateRateRate = signal(0);
  dateRateSpecial = signal(false);
  dateRateNotes = signal('');

  // Package Plans
  packagePlans = signal<PackagePlan[]>([]);
  showPackageForm = signal(false);
  editingPackage = signal<PackagePlan | null>(null);
  packageName = signal('');
  packageDescription = signal('');
  packageNights = signal(1);
  packageInclusions = signal<string[]>([]);
  newInclusion = signal('');
  packageTotalPrice = signal(0);
  packageDiscount = signal(0);
  packageActive = signal(true);
  packageValidFrom = signal('');
  packageValidTo = signal('');

  // Room types
  roomTypes = signal<string[]>([]);
  showRoomTypeForm = signal(false);
  editingRoomType = signal<string | null>(null);
  roomTypeName = signal('');

  // Toggle room type selection
  toggleRoomType(roomType: string) {
    const current = this.ratePlanRoomTypes();
    const index = current.indexOf(roomType);
    if (index > -1) {
      this.ratePlanRoomTypes.set(current.filter(t => t !== roomType));
    } else {
      this.ratePlanRoomTypes.set([...current, roomType]);
    }
  }

  isRoomTypeSelected(roomType: string): boolean {
    return this.ratePlanRoomTypes().includes(roomType);
  }

  // Toggle room type selection for date rates
  toggleDateRateRoomType(roomType: string) {
    const current = this.dateRateRoomTypes();
    const index = current.indexOf(roomType);
    if (index > -1) {
      this.dateRateRoomTypes.set(current.filter(t => t !== roomType));
    } else {
      this.dateRateRoomTypes.set([...current, roomType]);
    }
  }

  isDateRateRoomTypeSelected(roomType: string): boolean {
    return this.dateRateRoomTypes().includes(roomType);
  }

  // Rate Plan Restrictions
  ratePlanRestrictions = signal<RatePlanRestriction[]>([]);
  showRatePlanRestrictionForm = signal(false);
  editingRatePlanRestriction = signal<RatePlanRestriction | null>(null);
  restrictionRatePlanId = signal('');
  restrictionType = signal<'min-stay' | 'max-stay' | 'closed-to-arrival' | 'closed-to-departure' | 'stop-sell'>('min-stay');
  restrictionStartDate = signal('');
  restrictionEndDate = signal('');
  restrictionMinStay = signal(1);
  restrictionMaxStay = signal(30);
  restrictionDaysOfWeek = signal<string[]>([]);
  restrictionNotes = signal('');
  restrictionActive = signal(true);

  // Package Restrictions
  packageRestrictions = signal<PackageRestriction[]>([]);
  showPackageRestrictionForm = signal(false);
  editingPackageRestriction = signal<PackageRestriction | null>(null);
  pkgRestrictionPackageId = signal('');
  pkgRestrictionType = signal<'booking-window' | 'blackout-dates' | 'min-advance' | 'max-advance'>('booking-window');
  pkgRestrictionStartDate = signal('');
  pkgRestrictionEndDate = signal('');
  pkgRestrictionMinAdvance = signal(0);
  pkgRestrictionMaxAdvance = signal(365);
  pkgRestrictionNotes = signal('');
  pkgRestrictionActive = signal(true);

  daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Error popup
  isErrorPopupOpen = signal(false);
  errorMessage = signal<ErrorMessage | null>(null);

  // Confirm popup
  isConfirmPopupOpen = signal(false);
  confirmMessage = signal<ConfirmMessage | null>(null);
  private confirmResolve: ((value: boolean) => void) | null = null;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.ratePlans.set(this.storageService.getAllRatePlans());
    this.dateRates.set(this.storageService.getAllDateRates());
    this.packagePlans.set(this.storageService.getAllPackagePlans());
    this.ratePlanRestrictions.set(this.storageService.getAllRatePlanRestrictions());
    this.packageRestrictions.set(this.storageService.getAllPackageRestrictions());
    this.roomTypes.set(this.storageService.getAllRoomTypes());
  }

  // Rate Plan Methods
  openRatePlanForm(ratePlan?: RatePlan) {
    if (ratePlan) {
      this.editingRatePlan.set(ratePlan);
      this.ratePlanName.set(ratePlan.name);
      this.ratePlanDescription.set(ratePlan.description);
      this.ratePlanRoomTypes.set([...ratePlan.roomTypes]);
      this.ratePlanBaseRate.set(ratePlan.baseRate);
      this.ratePlanActive.set(ratePlan.isActive);
    } else {
      this.editingRatePlan.set(null);
      this.resetRatePlanForm();
    }
    this.showRatePlanForm.set(true);
  }

  resetRatePlanForm() {
    this.ratePlanName.set('');
    this.ratePlanDescription.set('');
    this.ratePlanRoomTypes.set([]);
    this.ratePlanBaseRate.set(0);
    this.ratePlanActive.set(true);
  }

  saveRatePlan() {
    if (!this.ratePlanName() || this.ratePlanBaseRate() <= 0) {
      this.showError('Validation Error', 'Please enter a valid name and base rate.', 'error');
      return;
    }

    if (this.ratePlanRoomTypes().length === 0) {
      this.showError('Validation Error', 'Please select at least one room type.', 'error');
      return;
    }

    const ratePlan: RatePlan = {
      id: this.editingRatePlan()?.id || this.storageService.generateRatePlanId(),
      name: this.ratePlanName(),
      description: this.ratePlanDescription(),
      roomTypes: this.ratePlanRoomTypes(),
      baseRate: this.ratePlanBaseRate(),
      isActive: this.ratePlanActive(),
      createdAt: this.editingRatePlan()?.createdAt || new Date().toISOString()
    };

    this.storageService.saveRatePlan(ratePlan);
    this.loadData();
    this.showRatePlanForm.set(false);
    this.showError('Success', `Rate plan ${this.editingRatePlan() ? 'updated' : 'created'} successfully!`, 'success');
  }

  async deleteRatePlan(id: string) {
    const confirmed = await this.showConfirm(
      'Delete Rate Plan',
      'Are you sure you want to delete this rate plan?',
      'Delete',
      'Cancel'
    );
    if (confirmed) {
      this.storageService.deleteRatePlan(id);
      this.loadData();
      this.showError('Success', 'Rate plan deleted successfully!', 'success');
    }
  }

  // Date Rate Methods
  openDateRateForm(dateRate?: DateRate) {
    if (dateRate) {
      this.editingDateRate.set(dateRate);
      this.dateRateRatePlanId.set(dateRate.ratePlanId);
      this.dateRateRoomTypes.set([...dateRate.roomTypes]);
      this.dateRateStartDate.set(dateRate.date);
      this.dateRateEndDate.set(dateRate.date);
      this.dateRateRate.set(dateRate.rate);
      this.dateRateSpecial.set(dateRate.isSpecialRate);
      this.dateRateNotes.set(dateRate.notes || '');
    } else {
      this.editingDateRate.set(null);
      this.resetDateRateForm();
    }
    this.showDateRateForm.set(true);
  }

  resetDateRateForm() {
    this.dateRateRatePlanId.set('');
    this.dateRateRoomTypes.set([]);
    this.dateRateStartDate.set('');
    this.dateRateEndDate.set('');
    this.dateRateRate.set(0);
    this.dateRateSpecial.set(false);
    this.dateRateNotes.set('');
  }

  saveDateRate() {
    if (!this.dateRateRatePlanId() || !this.dateRateStartDate() || this.dateRateRate() <= 0) {
      this.showError('Validation Error', 'Please fill in all required fields.', 'error');
      return;
    }

    if (this.dateRateRoomTypes().length === 0) {
      this.showError('Validation Error', 'Please select at least one room type.', 'error');
      return;
    }

    // If editing a single date rate, just update it
    if (this.editingDateRate()) {
      const dateRate: DateRate = {
        id: this.editingDateRate()!.id,
        ratePlanId: this.dateRateRatePlanId(),
        roomTypes: this.dateRateRoomTypes(),
        date: this.dateRateStartDate(),
        rate: this.dateRateRate(),
        isSpecialRate: this.dateRateSpecial(),
        notes: this.dateRateNotes()
      };
      this.storageService.saveDateRate(dateRate);
      this.loadData();
      this.showDateRateForm.set(false);
      this.showError('Success', 'Date rate updated successfully!', 'success');
      return;
    }

    // Create date rates for the range
    const startDate = new Date(this.dateRateStartDate());
    const endDate = this.dateRateEndDate() ? new Date(this.dateRateEndDate()) : startDate;
    
    let dateCount = 0;
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateRate: DateRate = {
        id: this.storageService.generateDateRateId(),
        ratePlanId: this.dateRateRatePlanId(),
        roomTypes: this.dateRateRoomTypes(),
        date: currentDate.toISOString().split('T')[0],
        rate: this.dateRateRate(),
        isSpecialRate: this.dateRateSpecial(),
        notes: this.dateRateNotes()
      };
      this.storageService.saveDateRate(dateRate);
      dateCount++;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    this.loadData();
    this.showDateRateForm.set(false);
    this.showError('Success', `${dateCount} date rate(s) created successfully!`, 'success');
  }

  async deleteDateRate(id: string) {
    const confirmed = await this.showConfirm(
      'Delete Date Rate',
      'Are you sure you want to delete this date rate?',
      'Delete',
      'Cancel'
    );
    if (confirmed) {
      this.storageService.deleteDateRate(id);
      this.loadData();
      this.showError('Success', 'Date rate deleted successfully!', 'success');
    }
  }

  getRatePlanName(ratePlanId: string): string {
    const plan = this.ratePlans().find(p => p.id === ratePlanId);
    return plan ? plan.name : 'Unknown';
  }

  // Package Plan Methods
  openPackageForm(pkg?: PackagePlan) {
    if (pkg) {
      this.editingPackage.set(pkg);
      this.packageName.set(pkg.name);
      this.packageDescription.set(pkg.description);
      this.packageNights.set(pkg.nights);
      this.packageInclusions.set([...pkg.inclusions]);
      this.packageTotalPrice.set(pkg.totalPrice);
      this.packageDiscount.set(pkg.discountPercent);
      this.packageActive.set(pkg.isActive);
      this.packageValidFrom.set(pkg.validFrom);
      this.packageValidTo.set(pkg.validTo);
    } else {
      this.editingPackage.set(null);
      this.resetPackageForm();
    }
    this.showPackageForm.set(true);
  }

  resetPackageForm() {
    this.packageName.set('');
    this.packageDescription.set('');
    this.packageNights.set(1);
    this.packageInclusions.set([]);
    this.newInclusion.set('');
    this.packageTotalPrice.set(0);
    this.packageDiscount.set(0);
    this.packageActive.set(true);
    this.packageValidFrom.set('');
    this.packageValidTo.set('');
  }

  addInclusion() {
    if (this.newInclusion().trim()) {
      this.packageInclusions.set([...this.packageInclusions(), this.newInclusion().trim()]);
      this.newInclusion.set('');
    }
  }

  removeInclusion(index: number) {
    const inclusions = [...this.packageInclusions()];
    inclusions.splice(index, 1);
    this.packageInclusions.set(inclusions);
  }

  savePackage() {
    if (!this.packageName() || this.packageTotalPrice() <= 0 || !this.packageValidFrom() || !this.packageValidTo()) {
      this.showError('Validation Error', 'Please fill in all required fields.', 'error');
      return;
    }

    const pkg: PackagePlan = {
      id: this.editingPackage()?.id || this.storageService.generatePackagePlanId(),
      name: this.packageName(),
      description: this.packageDescription(),
      nights: this.packageNights(),
      inclusions: this.packageInclusions(),
      totalPrice: this.packageTotalPrice(),
      discountPercent: this.packageDiscount(),
      isActive: this.packageActive(),
      validFrom: this.packageValidFrom(),
      validTo: this.packageValidTo(),
      createdAt: this.editingPackage()?.createdAt || new Date().toISOString()
    };

    this.storageService.savePackagePlan(pkg);
    this.loadData();
    this.showPackageForm.set(false);
    this.showError('Success', `Package plan ${this.editingPackage() ? 'updated' : 'created'} successfully!`, 'success');
  }

  async deletePackage(id: string) {
    const confirmed = await this.showConfirm(
      'Delete Package Plan',
      'Are you sure you want to delete this package plan?',
      'Delete',
      'Cancel'
    );
    if (confirmed) {
      this.storageService.deletePackagePlan(id);
      this.loadData();
      this.showError('Success', 'Package plan deleted successfully!', 'success');
    }
  }

  // Rate Plan Restriction Methods
  openRatePlanRestrictionForm(restriction?: RatePlanRestriction) {
    if (restriction) {
      this.editingRatePlanRestriction.set(restriction);
      this.restrictionRatePlanId.set(restriction.ratePlanId);
      this.restrictionType.set(restriction.restrictionType);
      this.restrictionStartDate.set(restriction.startDate);
      this.restrictionEndDate.set(restriction.endDate);
      this.restrictionMinStay.set(restriction.minStayNights || 1);
      this.restrictionMaxStay.set(restriction.maxStayNights || 30);
      this.restrictionDaysOfWeek.set(restriction.daysOfWeek || []);
      this.restrictionNotes.set(restriction.notes || '');
      this.restrictionActive.set(restriction.isActive);
    } else {
      this.editingRatePlanRestriction.set(null);
      this.resetRatePlanRestrictionForm();
    }
    this.showRatePlanRestrictionForm.set(true);
  }

  resetRatePlanRestrictionForm() {
    this.restrictionRatePlanId.set('');
    this.restrictionType.set('min-stay');
    this.restrictionStartDate.set('');
    this.restrictionEndDate.set('');
    this.restrictionMinStay.set(1);
    this.restrictionMaxStay.set(30);
    this.restrictionDaysOfWeek.set([]);
    this.restrictionNotes.set('');
    this.restrictionActive.set(true);
  }

  toggleDayOfWeek(day: string) {
    const current = this.restrictionDaysOfWeek();
    const index = current.indexOf(day);
    if (index > -1) {
      this.restrictionDaysOfWeek.set(current.filter(d => d !== day));
    } else {
      this.restrictionDaysOfWeek.set([...current, day]);
    }
  }

  isDayOfWeekSelected(day: string): boolean {
    return this.restrictionDaysOfWeek().includes(day);
  }

  saveRatePlanRestriction() {
    if (!this.restrictionRatePlanId() || !this.restrictionStartDate() || !this.restrictionEndDate()) {
      this.showError('Validation Error', 'Please fill in all required fields.', 'error');
      return;
    }

    const restriction: RatePlanRestriction = {
      id: this.editingRatePlanRestriction()?.id || this.storageService.generateRatePlanRestrictionId(),
      ratePlanId: this.restrictionRatePlanId(),
      restrictionType: this.restrictionType(),
      startDate: this.restrictionStartDate(),
      endDate: this.restrictionEndDate(),
      minStayNights: this.restrictionType() === 'min-stay' ? this.restrictionMinStay() : undefined,
      maxStayNights: this.restrictionType() === 'max-stay' ? this.restrictionMaxStay() : undefined,
      daysOfWeek: this.restrictionDaysOfWeek().length > 0 ? this.restrictionDaysOfWeek() : undefined,
      notes: this.restrictionNotes(),
      isActive: this.restrictionActive()
    };

    this.storageService.saveRatePlanRestriction(restriction);
    this.loadData();
    this.showRatePlanRestrictionForm.set(false);
    this.showError('Success', `Rate restriction ${this.editingRatePlanRestriction() ? 'updated' : 'created'} successfully!`, 'success');
  }

  async deleteRatePlanRestriction(id: string) {
    const confirmed = await this.showConfirm(
      'Delete Rate Restriction',
      'Are you sure you want to delete this restriction?',
      'Delete',
      'Cancel'
    );
    if (confirmed) {
      this.storageService.deleteRatePlanRestriction(id);
      this.loadData();
      this.showError('Success', 'Rate restriction deleted successfully!', 'success');
    }
  }

  // Package Restriction Methods
  openPackageRestrictionForm(restriction?: PackageRestriction) {
    if (restriction) {
      this.editingPackageRestriction.set(restriction);
      this.pkgRestrictionPackageId.set(restriction.packagePlanId);
      this.pkgRestrictionType.set(restriction.restrictionType);
      this.pkgRestrictionStartDate.set(restriction.startDate);
      this.pkgRestrictionEndDate.set(restriction.endDate);
      this.pkgRestrictionMinAdvance.set(restriction.minAdvanceDays || 0);
      this.pkgRestrictionMaxAdvance.set(restriction.maxAdvanceDays || 365);
      this.pkgRestrictionNotes.set(restriction.notes || '');
      this.pkgRestrictionActive.set(restriction.isActive);
    } else {
      this.editingPackageRestriction.set(null);
      this.resetPackageRestrictionForm();
    }
    this.showPackageRestrictionForm.set(true);
  }

  resetPackageRestrictionForm() {
    this.pkgRestrictionPackageId.set('');
    this.pkgRestrictionType.set('booking-window');
    this.pkgRestrictionStartDate.set('');
    this.pkgRestrictionEndDate.set('');
    this.pkgRestrictionMinAdvance.set(0);
    this.pkgRestrictionMaxAdvance.set(365);
    this.pkgRestrictionNotes.set('');
    this.pkgRestrictionActive.set(true);
  }

  getPackageName(packageId: string): string {
    const pkg = this.packagePlans().find(p => p.id === packageId);
    return pkg ? pkg.name : 'Unknown';
  }

  savePackageRestriction() {
    if (!this.pkgRestrictionPackageId() || !this.pkgRestrictionStartDate() || !this.pkgRestrictionEndDate()) {
      this.showError('Validation Error', 'Please fill in all required fields.', 'error');
      return;
    }

    const restriction: PackageRestriction = {
      id: this.editingPackageRestriction()?.id || this.storageService.generatePackageRestrictionId(),
      packagePlanId: this.pkgRestrictionPackageId(),
      restrictionType: this.pkgRestrictionType(),
      startDate: this.pkgRestrictionStartDate(),
      endDate: this.pkgRestrictionEndDate(),
      minAdvanceDays: this.pkgRestrictionType() === 'min-advance' ? this.pkgRestrictionMinAdvance() : undefined,
      maxAdvanceDays: this.pkgRestrictionType() === 'max-advance' ? this.pkgRestrictionMaxAdvance() : undefined,
      notes: this.pkgRestrictionNotes(),
      isActive: this.pkgRestrictionActive()
    };

    this.storageService.savePackageRestriction(restriction);
    this.loadData();
    this.showPackageRestrictionForm.set(false);
    this.showError('Success', `Package restriction ${this.editingPackageRestriction() ? 'updated' : 'created'} successfully!`, 'success');
  }

  async deletePackageRestriction(id: string) {
    const confirmed = await this.showConfirm(
      'Delete Package Restriction',
      'Are you sure you want to delete this restriction?',
      'Delete',
      'Cancel'
    );
    if (confirmed) {
      this.storageService.deletePackageRestriction(id);
      this.loadData();
      this.showError('Success', 'Package restriction deleted successfully!', 'success');
    }
  }

  // Room Type Methods
  openRoomTypeForm(roomType?: string) {
    if (roomType) {
      this.editingRoomType.set(roomType);
      this.roomTypeName.set(roomType);
    } else {
      this.editingRoomType.set(null);
      this.roomTypeName.set('');
    }
    this.showRoomTypeForm.set(true);
  }

  saveRoomType() {
    const name = this.roomTypeName().trim().toLowerCase().replace(/\s+/g, '-');
    
    if (!name) {
      this.showError('Validation Error', 'Please enter a room type name.', 'error');
      return;
    }

    const existingRoomTypes = this.roomTypes();
    const editingType = this.editingRoomType();

    // Check if room type already exists (when not editing or editing to a different name)
    if (existingRoomTypes.includes(name) && name !== editingType) {
      this.showError('Validation Error', 'This room type already exists.', 'error');
      return;
    }

    if (editingType) {
      // Update existing room type
      this.storageService.updateRoomType(editingType, name);
    } else {
      // Add new room type
      this.storageService.saveRoomType(name);
    }

    this.loadData();
    this.showRoomTypeForm.set(false);
    this.showError('Success', `Room type ${editingType ? 'updated' : 'added'} successfully!`, 'success');
  }

  async deleteRoomType(roomType: string) {
    const confirmed = await this.showConfirm(
      'Delete Room Type',
      'Are you sure you want to delete this room type? This may affect existing rate plans.',
      'Delete',
      'Cancel'
    );
    if (confirmed) {
      this.storageService.deleteRoomType(roomType);
      this.loadData();
      this.showError('Success', 'Room type deleted successfully!', 'success');
    }
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
