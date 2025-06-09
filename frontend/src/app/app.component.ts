import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  private adminPages: any[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private platform: Platform
  ) {
    this.initializeApp();
  }

  private async initializeApp() {
    this.platform.ready().then(async () => {
      await this.authService.initialize();
      this.initializeAdminMenu();
    });
  }

  private initializeAdminMenu() {
    this.adminPages = [
      {
        title: 'Dashboard',
        url: '/home',
        icon: 'home'
      },
      {
        title: 'Statistik Event',
        url: '/statistics',
        icon: 'bar-chart'
      },
      {
        title: 'Kelola Event',
        url: '/events',
        icon: 'calendar'
      },
      {
        title: 'Kelola Pembayaran',
        url: '/payments',
        icon: 'cash'
      },
      {
        title: 'Kelola Peserta',
        url: '/participant-management',
        icon: 'people'
      }
    ];
  }

  async ngOnInit() {
    // Initialization is now handled in initializeApp
  }
}
