import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { RegistrationFormComponent } from './components/registration-form/registration-form.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage),
    canActivate: [AuthGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then(m => m.RegisterPage)
  },
  {
    path: 'events',
    loadComponent: () => import('./pages/events/events.page').then(m => m.EventsPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'create-event',
    loadComponent: () => import('./pages/create-event/create-event.page').then(m => m.CreateEventPage),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'edit-event/:id',
    loadComponent: () => import('./pages/edit-event/edit-event.page').then(m => m.EditEventPage),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'event-detail/:id',
    loadComponent: () => import('./pages/event-detail/event-detail.page').then(m => m.EventDetailPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'registered-events',
    loadComponent: () => import('./pages/registered-events/registered-events.page').then(m => m.RegisteredEventsPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'payments',
    loadComponent: () => import('./pages/payments/payments.page').then(m => m.PaymentsPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'certificates',
    loadComponent: () => import('./pages/certificates/certificates.page').then(m => m.CertificatesPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'certificate-templates',
    loadComponent: () => import('./pages/certificates/certificate-templates/certificate-templates.page').then(m => m.CertificateTemplatesPage),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage),
    canActivate: [AuthGuard]
  },
  {
    path: 'registration-form',
    component: RegistrationFormComponent
  },
  {
    path: 'admin',
    children: [
      {
        path: 'statistics',
        loadComponent: () => import('./pages/statistics/statistics.page').then(m => m.StatisticsPage),
        canActivate: [AuthGuard, AdminGuard]
      }
    ]
  },
  {
    path: 'event-qr',
    loadComponent: () => import('./pages/event-qr/event-qr.page').then(m => m.EventQrPage)
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.page').then(m => m.SettingsPage)
  },
  {
    path: 'admin/payments',
    loadComponent: () => import('./pages/admin/payments/admin-payments.page').then(m => m.AdminPaymentsPage),
    canActivate: [AuthGuard, AdminGuard]
  }
]; 