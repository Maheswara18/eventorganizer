import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterLink
  ]
})
export class HomePage implements OnInit, OnDestroy {
  username: string = '';
  isAdmin: boolean = false;
  private userSubscription: Subscription | undefined;

  constructor(
    private authService: AuthService
  ) {}

  async ngOnInit() {
    await this.loadUserData();
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  private async loadUserData() {
    this.userSubscription = this.authService.currentUser.subscribe(user => {
      this.username = user?.name || '';
      this.isAdmin = user?.role === 'admin';
    });
  }

  logout() {
    this.authService.logout();
  }
}