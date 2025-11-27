import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { ReservationComponent } from './reservation/reservation.component';
import { GuestComponent } from './guest/guest.component';
import { ListComponent } from './list/list.component';
import { PaymentsComponent } from './payments/payments.component';
import { ChargesComponent } from './charges/charges.component';
import { FolioComponent } from './folio/folio.component';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.isAuthenticated()) {
    return true;
  }
  
  router.navigate(['/login']);
  return false;
};

const accessGuard = (requiredAccess: string) => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    if (!authService.isAuthenticated()) {
      router.navigate(['/login']);
      return false;
    }
    
    if (authService.hasAccess(requiredAccess)) {
      return true;
    }
    
    // Redirect to dashboard if no access
    router.navigate(['/list']);
    alert('You do not have permission to access this page.');
    return false;
  };
};

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'list', component: ListComponent, canActivate: [authGuard] },
  { path: 'reservation', component: ReservationComponent, canActivate: [accessGuard('reservations')] },
  { path: 'guest', component: GuestComponent, canActivate: [accessGuard('guests')] },
  { 
    path: 'property', 
    loadComponent: () => import('./property/property.component').then(m => m.PropertyComponent),
    canActivate: [accessGuard('property')] 
  },
  { 
    path: 'reports', 
    loadComponent: () => import('./reports/reports.component').then(m => m.ReportsComponent),
    canActivate: [accessGuard('reports')] 
  },
  { 
    path: 'folio', 
    canActivate: [authGuard],
    canActivateChild: [accessGuard('billing')],
    children: [
      { path: '', component: FolioComponent },
      { path: 'charges', component: ChargesComponent },
      { path: 'payments', component: PaymentsComponent }
    ]
  },
  { 
    path: 'folio/:reservationId', 
    canActivate: [authGuard],
    canActivateChild: [accessGuard('billing')],
    children: [
      { path: '', component: FolioComponent },
      { path: 'charges', component: ChargesComponent },
      { path: 'payments', component: PaymentsComponent }
    ]
  },
  { 
    path: 'users', 
    loadComponent: () => import('./users/users.component').then(m => m.UsersComponent),
    canActivate: [accessGuard('users')] 
  }
];
