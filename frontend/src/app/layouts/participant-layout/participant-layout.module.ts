import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ParticipantLayoutComponent } from './participant-layout.component';

const routes: Routes = [
  {
    path: '',
    component: ParticipantLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadChildren: () => import('../../pages/participant/home/home.module').then(m => m.HomePageModule)
      },
      {
        path: 'events',
        loadChildren: () => import('../../pages/participant/events/events.module').then(m => m.EventsPageModule)
      },
      {
        path: 'certificates',
        loadChildren: () => import('../../pages/participant/certificates/certificates.module').then(m => m.CertificatesPageModule)
      },
      {
        path: 'profile',
        loadChildren: () => import('../../pages/participant/profile/profile.module').then(m => m.ProfilePageModule)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ParticipantLayoutModule {} 