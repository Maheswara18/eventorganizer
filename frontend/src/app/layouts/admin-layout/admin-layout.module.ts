import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AdminLayoutComponent } from './admin-layout.component';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    AdminLayoutComponent,
    RouterModule.forChild([
      {
        path: '',
        component: AdminLayoutComponent,
        children: [
          {
            path: 'dashboard',
            loadChildren: () => import('../../pages/admin/dashboard/dashboard.module').then(m => m.DashboardPageModule)
          },
          {
            path: 'events',
            loadChildren: () => import('../../pages/admin/events/events.module').then(m => m.EventsPageModule)
          },
          {
            path: 'certificates',
            loadChildren: () => import('../../pages/admin/certificates/certificates.module').then(m => m.CertificatesPageModule)
          },
          {
            path: 'profile',
            loadChildren: () => import('../../pages/profile/profile.module').then(m => m.ProfilePageModule)
          },
          {
            path: '',
            redirectTo: 'dashboard',
            pathMatch: 'full'
          }
        ]
      }
    ])
  ]
})
export class AdminLayoutModule {} 