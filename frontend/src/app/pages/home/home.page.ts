import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { PaymentService } from '../../services/payment.service';

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
  unpaidEventsCount = 0;
  private userSubscription: Subscription | undefined;

  constructor(
    private authService: AuthService,
    private paymentService: PaymentService
  ) {}

  async ngOnInit() {
    await this.loadUserData();
    if (!this.isAdmin) {
      this.loadUnpaidEventsCount();
    }
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

  async loadUnpaidEventsCount() {
    try {
      const registeredEvents = await this.paymentService.getRegisteredEvents();
      this.unpaidEventsCount = registeredEvents.filter(event => 
        !event.payment_status || event.payment_status === 'pending' || event.payment_status === 'failed'
      ).length;
    } catch (error) {
      console.error('Error loading unpaid events count:', error);
    }
  }

  ionViewWillEnter() {
    if (!this.isAdmin) {
      this.loadUnpaidEventsCount();
    }
  }
}