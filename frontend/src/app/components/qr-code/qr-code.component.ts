import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-qr-code',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>QR Code Check-in</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismissModal()">
            <ion-icon name="close" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="qr-container">
        <h2>{{ eventTitle }}</h2>
        <div class="qr-code">
          <img [src]="qrCodeDataUrl" [alt]="'QR Code untuk ' + eventTitle" *ngIf="qrCodeDataUrl"/>
        </div>
        <p class="ion-text-center">
          Tunjukkan QR Code ini kepada panitia untuk check-in ke event
        </p>
        <ion-button expand="block" (click)="downloadQRCode()">
          <ion-icon name="download" slot="start"></ion-icon>
          Download QR Code
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .qr-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    h2 {
      text-align: center;
      margin-bottom: 20px;
    }

    .qr-code {
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }

    .qr-code img {
      width: 250px;
      height: 250px;
    }

    p {
      color: var(--ion-color-medium);
      margin: 20px 0;
    }

    ion-button {
      margin-top: 20px;
    }
  `]
})
export class QrCodeComponent implements OnInit {
  @Input() eventId!: number;
  @Input() eventTitle!: string;
  qrCodeDataUrl: string = '';

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    this.generateQRCode();
  }

  async generateQRCode() {
    try {
      // Generate a unique check-in code that includes the event ID and timestamp
      const checkInCode = `event_${this.eventId}_${Date.now()}`;
      this.qrCodeDataUrl = await QRCode.toDataURL(checkInCode, {
        width: 250,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }

  async downloadQRCode() {
    if (!this.qrCodeDataUrl) return;

    const link = document.createElement('a');
    link.download = `qr-code-${this.eventTitle.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = this.qrCodeDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  dismissModal() {
    this.modalCtrl.dismiss();
  }
} 