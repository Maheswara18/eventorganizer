import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { Platform, NavController } from '@ionic/angular';

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
    private platform: Platform,
    private navCtrl: NavController
  ) {
    this.initializeApp();
    this.setupPageTransitions();
  }

  private async initializeApp() {
    this.platform.ready().then(async () => {
      await this.authService.initialize();
      this.initializeAdminMenu();
    });
  }

  private setupPageTransitions() {
    // Konfigurasi transisi halaman
    this.navCtrl.setDirection('forward');
    
    // Tambahkan event listener untuk transisi
    this.router.events.subscribe(() => {
      // Gunakan requestAnimationFrame untuk transisi yang lebih smooth
      requestAnimationFrame(() => {
        document.body.classList.add('page-transition');
        setTimeout(() => {
          document.body.classList.remove('page-transition');
        }, 300);
      });
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
