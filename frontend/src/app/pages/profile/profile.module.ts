import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ProfilePage } from './profile.page';

@NgModule({
  imports: [
    ProfilePage,
    RouterModule.forChild([
      {
        path: '',
        component: ProfilePage
      }
    ])
  ]
})
export class ProfilePageModule {} 