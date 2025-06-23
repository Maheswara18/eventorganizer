import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, IonContent } from '@ionic/angular';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subscription, filter } from 'rxjs';
import { PaymentService } from '../../services/payment.service';
import { EventsService } from '../../services/events.service';
import { Event } from '../../interfaces/event.interface';

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
export class HomePage implements OnInit, OnDestroy, AfterViewInit {
  username: string = '';
  isAdmin: boolean = false;
  unpaidEventsCount = 0;
  scrolled: boolean = false;
  activePath: string = '';

  private userSubscription: Subscription | undefined;
  recommendedEvents: Event[] = [];
  isLoading = false;

  @ViewChild(IonContent) pageContent?: IonContent;

  constructor(
    private authService: AuthService,
    private paymentService: PaymentService,
    private eventsService: EventsService,
    private router: Router
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.activePath = event.urlAfterRedirects;
    });
  }

  async ngOnInit() {
    await this.loadUserData();
    if (!this.isAdmin) {
      this.loadUnpaidEventsCount();
      this.loadRecommendedEvents();
    }
  }

  ngAfterViewInit() {
    this.pageContent?.ionScroll.subscribe((event: any) => {
      this.scrolled = event.detail.scrollTop > 10;
    });
  }

  ngOnDestroy() {
    this.userSubscription?.unsubscribe();
  }

  private async loadUserData() {
    this.userSubscription = this.authService.currentUser.subscribe(user => {
      this.username = user?.name || '';
      this.isAdmin = user?.role === 'admin';
    });
  }

  async loadRecommendedEvents() {
    try {
      this.isLoading = true;
      this.recommendedEvents = await this.eventsService.getRandomEvents().toPromise() || [];
    } catch (error) {
      console.error('Error loading recommended events:', error);
    } finally {
      this.isLoading = false;
    }
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
      this.loadRecommendedEvents();
    }
  }
}
