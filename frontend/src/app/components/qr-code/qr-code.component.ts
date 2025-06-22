/**
 * QR Code Component
 * Component untuk menampilkan QR code peserta event
 * NOTE: Diubah untuk mengambil gambar QR code langsung dari backend (sebagai base64)
 */

import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-qr-code',
  standalone: true,
  imports: [IonicModule, CommonModule],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>QR Code: {{ eventTitle }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismissModal()">
            <ion-icon name="close-outline" color="light"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="qr-container">
        <div *ngIf="qrCodeImageSource" class="qr-code-wrapper">
          <img [src]="qrCodeImageSource" alt="QR Code Peserta" />
        </div>
        <div *ngIf="!qrCodeImageSource && !errorMessage" class="qr-code-placeholder">
            <ion-spinner name="crescent"></ion-spinner>
            <p>Mengambil QR Code...</p>
        </div>
        <div *ngIf="errorMessage" class="qr-code-placeholder error">
            <ion-icon name="alert-circle-outline"></ion-icon>
            <p>{{ errorMessage }}</p>
        </div>
        <div class="qr-info">
          <p class="ion-text-center">Tunjukkan QR code ini kepada panitia saat check-in.</p>
          <ion-note *ngIf="qrData" color="medium" class="ion-text-center qr-data">Data: {{ qrData }}</ion-note>
        </div>
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
    .qr-code-wrapper {
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      margin-bottom: 20px;
    }
    .qr-code-wrapper img {
      display: block;
    }
      
    .qr-code-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 290px;
      height: 290px;
      background: #f0f0f0;
      border-radius: 10px;
      margin-bottom: 20px;
      color: #666;
    }
    .qr-code-placeholder.error {
        background-color: #fbe9e7;
        color: #c92a2a;
    }
    .qr-code-placeholder.error ion-icon {
        font-size: 40px;
        margin-bottom: 10px;
    }
    .qr-info {
      text-align: center;
    }
    .qr-data {
      font-family: monospace;
      font-size: 12px;
      margin-top: 10px;
      word-break: break-all;
    }
  `]
})
export class QrCodeComponent implements OnInit {
  @Input() eventId!: number;
  @Input() eventTitle!: string;
  
  qrData: string = '';
  qrCodeImageSource: string = '';
  errorMessage: string = '';

  constructor(
    private modalController: ModalController,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.fetchParticipantAndQrCode();
  }

  private async fetchParticipantAndQrCode() {
    try {
      const participant = await this.getParticipantData();
      
      if (participant && participant.qr_code_base64) {
        this.qrCodeImageSource = participant.qr_code_base64;
        this.qrData = participant.qr_code_data;
        console.log('QR code image has been successfully received from the backend.');
      } else {
        this.errorMessage = 'QR Code tidak dapat ditemukan untuk pendaftaran ini.';
        console.error('Participant data or QR code not found in backend response.');
      }
    } catch (error: any) {
      this.errorMessage = 'Gagal mengambil data QR Code. Silakan coba lagi.';
      console.error('Error fetching QR code:', error);
    }
  }

  private async getParticipantData(): Promise<any> {
    try {
      return await this.http.get(`${environment.apiUrl}/participants/event/${this.eventId}/me`).toPromise();
    } catch (error) {
      console.error('Error getting participant data:', error);
      throw error;
    }
  }

  dismissModal() {
    this.modalController.dismiss();
  }
} 