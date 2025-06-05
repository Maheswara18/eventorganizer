import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoadingController, ToastController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, IonicModule],
  template: `
    <ion-split-pane contentId="main-content">
      <ion-menu contentId="main-content">
        <ion-header>
          <ion-toolbar>
            <ion-title>Admin Panel</ion-title>
          </ion-toolbar>
        </ion-header>

        <ion-content>
          <ion-list>
            <ion-menu-toggle auto-hide="false">
              <ion-item *ngFor="let page of appPages" [routerLink]="page.url" routerLinkActive="selected">
                <ion-icon [name]="page.icon" slot="start"></ion-icon>
                <ion-label>{{ page.title }}</ion-label>
              </ion-item>

              <ion-item (click)="logout()" button>
                <ion-icon name="log-out" slot="start"></ion-icon>
                <ion-label>Logout</ion-label>
              </ion-item>
            </ion-menu-toggle>
          </ion-list>
        </ion-content>
      </ion-menu>

      <div class="ion-page" id="main-content">
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-menu-button></ion-menu-button>
            </ion-buttons>
            <ion-title>Admin Panel</ion-title>
          </ion-toolbar>
        </ion-header>

        <ion-content>
          <router-outlet></router-outlet>
        </ion-content>
      </div>
    </ion-split-pane>
  `,
  styles: [`
    .selected {
      --background: var(--ion-color-light);
      font-weight: bold;
    }
  `]
})
export class AdminLayoutComponent implements OnInit {
  public appPages = [
    { title: 'Dashboard', url: '/admin/dashboard', icon: 'home' },
    { title: 'Events', url: '/admin/events', icon: 'calendar' },
    { title: 'Users', url: '/admin/users', icon: 'people' },
    { title: 'Profile', url: '/admin/profile', icon: 'person' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    // Check if user is admin
    const userData = this.authService.getUserData();
    if (!userData || userData.role !== 'admin') {
      this.router.navigate(['/login']);
    }
  }

  async logout() {
    const loading = await this.loadingController.create({
      message: 'Logging out...',
    });
    await loading.present();

    try {
      this.authService.logout();
      await loading.dismiss();
      this.router.navigate(['/login']);
    } catch (error: any) {
      await loading.dismiss();
      const toast = await this.toastController.create({
        message: error.message || 'Logout failed',
        duration: 3000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    }
  }
} 