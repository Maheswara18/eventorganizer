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
    });
  }

  async ngOnInit() {
    // Initialization is now handled in initializeApp
  }
}
