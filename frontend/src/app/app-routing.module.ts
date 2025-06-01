import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AdminGuard } from './guards/admin.guard';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { 
    path: '', 
    redirectTo: 'login', 
    pathMatch: 'full' 
  },
  { 
    path: 'login', 
    loadChildren: () => import('./pages/login/login.module').then(m => m.LoginPageModule) 
  },
  { 
    path: 'home', 
    loadChildren: () => import('./pages/home/home.module').then(m => m.HomePageModule),
    canActivate: [AuthGuard]
  },
  { 
    path: 'register', 
    loadChildren: () => import('./pages/register/register.module').then(m => m.RegisterPageModule) 
  },
  { 
    path: 'events', 
    loadChildren: () => import('./pages/events/events.module').then(m => m.EventsPageModule),
    canActivate: [AuthGuard]
  },
  { 
    path: 'create-event', 
    loadChildren: () => import('./pages/create-event/create-event.module').then(m => m.CreateEventPageModule),
    canActivate: [AdminGuard]
  },
  { 
    path: 'certificates', 
    loadChildren: () => import('./pages/certificates/certificates.module').then(m => m.CertificatesPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'event-detail/:id',
    loadComponent: () => import('./pages/event-detail/event-detail.page').then(m => m.EventDetailPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'edit-event/:id',
    loadComponent: () => import('./pages/edit-event/edit-event.page').then(m => m.EditEventPage),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'registered-events',
    loadComponent: () => import('./pages/registered-events/registered-events.page').then(m => m.RegisteredEventsPage),
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}