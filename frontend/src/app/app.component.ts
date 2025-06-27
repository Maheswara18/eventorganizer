import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { Platform, NavController, AlertController } from '@ionic/angular';

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
    private navCtrl: NavController,
    private alertController: AlertController
  ) {
    this.initializeApp();
    this.setupPageTransitions();
    // Handler tombol back global
    this.platform.ready().then(() => {
      this.platform.backButton.subscribeWithPriority(10, async () => {
        if (this.router.url === '/home') {
          const alert = await this.alertController.create({
            header: 'Konfirmasi',
            message: 'Keluar aplikasi?',
            buttons: [
              {
                text: 'Batal',
                role: 'cancel'
              },
              {
                text: 'Keluar',
                role: 'confirm',
                handler: () => {
                  (navigator as any)['app'].exitApp();
                }
              }
            ]
          });
          await alert.present();
        } else {
          this.navCtrl.back();
        }
      });
    });
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
    // Cek status login saat aplikasi dibuka
    const isLoggedIn = await this.authService.isLoggedIn();
    if (isLoggedIn) {
      // Jika sudah login, langsung ke home
      this.router.navigate(['/home'], { replaceUrl: true });
    } else {
      // Jika belum login, ke login
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }
}
