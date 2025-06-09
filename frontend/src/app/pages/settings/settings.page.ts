import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class SettingsPage implements OnInit {
  darkMode = false;
  notificationsEnabled = true;
  language = 'id';

  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Load saved settings
    this.loadSettings();
  }

  private loadSettings() {
    // Load settings from localStorage
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
    // Implement language change logic here
  }

  async logout() {
    await this.authService.logout();
  }
} 