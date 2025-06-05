import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-participant-layout',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
  template: `
    <ion-app>
      <ion-split-pane contentId="main-content">
        <ion-menu contentId="main-content">
          <ion-header>
            <ion-toolbar>
              <ion-title>Menu</ion-title>
            </ion-toolbar>
          </ion-header>

          <ion-content>
            <ion-list>
              <ion-menu-toggle auto-hide="false">
                <ion-item routerLink="/participant/home" routerLinkActive="selected" detail="false">
                  <ion-icon name="home" slot="start"></ion-icon>
                  <ion-label>Beranda</ion-label>
                </ion-item>

                <ion-item routerLink="/participant/events" routerLinkActive="selected" detail="false">
                  <ion-icon name="calendar" slot="start"></ion-icon>
                  <ion-label>Events</ion-label>
                </ion-item>

                <ion-item routerLink="/participant/certificates" routerLinkActive="selected" detail="false">
                  <ion-icon name="ribbon" slot="start"></ion-icon>
                  <ion-label>Sertifikat</ion-label>
                </ion-item>

                <ion-item routerLink="/participant/profile" routerLinkActive="selected" detail="false">
                  <ion-icon name="person" slot="start"></ion-icon>
                  <ion-label>Profil</ion-label>
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
              <ion-title>Event Organizer</ion-title>
            </ion-toolbar>
          </ion-header>

          <ion-content>
            <ion-router-outlet></ion-router-outlet>
          </ion-content>
        </div>
      </ion-split-pane>
    </ion-app>
  `,
  styles: [`
    .selected {
      --background: var(--ion-color-light);
      --color: var(--ion-color-primary);
      font-weight: bold;
    }

    ion-menu ion-content {
      --background: var(--ion-item-background, var(--ion-background-color, #fff));
    }

    ion-menu ion-item {
      --padding-start: 16px;
      --padding-end: 16px;
      border-radius: 4px;
      margin: 8px;
    }

    ion-menu ion-item.selected {
      --background: rgba(var(--ion-color-primary-rgb), 0.14);
    }

    ion-menu ion-item.selected ion-icon {
      color: var(--ion-color-primary);
    }

    ion-menu ion-list {
      padding: 20px 0;
    }

    ion-menu ion-icon {
      margin-right: 20px;
      color: var(--ion-color-medium);
    }

    ion-menu ion-item:hover {
      --background: rgba(var(--ion-color-primary-rgb), 0.08);
    }
  `]
})
export class ParticipantLayoutComponent {} 