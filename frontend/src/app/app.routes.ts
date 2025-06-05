import { Routes } from '@angular/router';
import { RegistrationFormComponent } from './components/registration-form/registration-form.component';

export const routes: Routes = [
  {
    path: 'registered-events',
    loadComponent: () => import('./pages/registered-events/registered-events.page').then(m => m.RegisteredEventsPage)
  },
  {
    path: 'registration-form',
    component: RegistrationFormComponent
  }
]; 