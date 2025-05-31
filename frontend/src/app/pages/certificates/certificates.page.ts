import { Component, OnInit } from '@angular/core';
import { CertificateService } from '../../services/certificate.service';
import { LoadingController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-certificates',
  templateUrl: './certificates.page.html',
  styleUrls: ['./certificates.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule
  ]
})
export class CertificatesPage implements OnInit {
  certificates: any[] = [];
  loading = false;

  constructor(
    private certificateService: CertificateService,
    private loadingCtrl: LoadingController
  ) { }

  ngOnInit() {
    this.loadCertificates();
  }

  async loadCertificates() {
    const loading = await this.loadingCtrl.create({
      message: 'Loading certificates...'
    });
    await loading.present();

    this.certificateService.getAllCertificates().subscribe({
      next: (response) => {
        this.certificates = response;
        loading.dismiss();
      },
      error: (error) => {
        console.error('Error loading certificates:', error);
        loading.dismiss();
      }
    });
  }

  async verifyCertificate(certificateId: number) {
    const loading = await this.loadingCtrl.create({
      message: 'Verifying certificate...'
    });
    await loading.present();

    this.certificateService.verifyCertificate({ certificateId }).subscribe({
      next: (response) => {
        loading.dismiss();
      },
      error: (error) => {
        console.error('Error verifying certificate:', error);
        loading.dismiss();
      }
    });
  }
} 