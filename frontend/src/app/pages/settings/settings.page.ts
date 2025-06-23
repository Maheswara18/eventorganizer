import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, RouterModule]
})
export class SettingsPage implements OnInit {
  darkMode = false;
  notificationsEnabled = true;
  language = 'id';

  // ✅ Untuk deteksi tab aktif di footer
  activePath: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // ✅ Update activePath setiap kali route berubah
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.activePath = event.urlAfterRedirects;
      }
    });
  }

  ngOnInit() {
    this.loadSettings();
  }

  private loadSettings() {
    this.darkMode = localStorage.getItem('darkMode') === 'true';
    this.notificationsEnabled = localStorage.getItem('notifications') !== 'false';
    this.language = localStorage.getItem('language') || 'id';
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    document.body.classList.toggle('dark', this.darkMode);
    localStorage.setItem('darkMode', this.darkMode.toString());
  }

  toggleNotifications() {
    this.notificationsEnabled = !this.notificationsEnabled;
    localStorage.setItem('notifications', this.notificationsEnabled.toString());
  }

  changeLanguage() {
    localStorage.setItem('language', this.language);
    // Tambahkan logika penggantian bahasa jika diperlukan
  }

  async logout() {
    await this.authService.logout();
  }
}
