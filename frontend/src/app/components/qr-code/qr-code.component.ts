import { Component, Input, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { EventsService } from '../../services/events.service';

@Component({
  selector: 'app-qr-code',
  standalone: true,
  imports: [IonicModule, CommonModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>QR Code {{ eventTitle }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismissModal()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="qr-container">
        <div class="qr-code">
          <canvas #qrCanvas width="300" height="300"></canvas>
        </div>
        <p class="ion-text-center">Tunjukkan QR code ini kepada panitia saat check-in event</p>
      </div>
    </ion-content>
  `,
  styles: [`
    .qr-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 20px;
    }
    .qr-code {
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      margin-bottom: 20px;
    }
  `]
})
export class QrCodeComponent implements OnInit, AfterViewInit {
  @Input() eventId!: number;
  @Input() eventTitle!: string;
  @ViewChild('qrCanvas') qrCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(
    private modalController: ModalController,
    private eventsService: EventsService
  ) {}

  ngOnInit() {}

  ngAfterViewInit() {
    this.generateQRCode();
  }

  private async generateQRCode() {
    try {
      const userId = await this.eventsService.getCurrentUserId();
      const data = `participant-${userId}-${this.eventId}`; // ✅ Sesuai format scanner
  
      const QRCode = await import('qrcode'); // jangan pakai `.default`
      
      await QRCode.toCanvas(this.qrCanvas.nativeElement, data, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 300,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
  
      console.log('QR code content:', data); // optional: debug
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }  

  dismissModal() {
    this.modalController.dismiss();
  }
} 