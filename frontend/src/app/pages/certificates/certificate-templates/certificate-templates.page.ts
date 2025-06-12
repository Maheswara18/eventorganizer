import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, LoadingController, ToastController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { CertificateTemplateService, CertificateTemplate } from '../../../services/certificate-template.service';
import { CertificateBuilderComponent } from '../../../components/certificate-builder/certificate-builder.component';

@Component({
  selector: 'app-certificate-templates',
  templateUrl: './certificate-templates.page.html',
  styleUrls: ['./certificate-templates.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, CertificateBuilderComponent]
})
export class CertificateTemplatesPage implements OnInit {
  templates: CertificateTemplate[] = [];
  isLoading = true;

  constructor(
    private templateService: CertificateTemplateService,
    private modalCtrl: ModalController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
    this.loadTemplates();
  }

  async loadTemplates() {
    const loading = await this.loadingCtrl.create({
      message: 'Memuat template...'
    });
    await loading.present();

    try {
      this.templates = await this.templateService.getTemplates().toPromise();
    } catch (error) {
      console.error('Error loading templates:', error);
      this.showToast('Gagal memuat template', 'danger');
    } finally {
      this.isLoading = false;
      loading.dismiss();
    }
  }

  async openBuilder(template?: CertificateTemplate) {
    const modal = await this.modalCtrl.create({
      component: CertificateBuilderComponent,
      componentProps: {
        templateId: template?.id
      },
      cssClass: 'fullscreen-modal'
    });

    modal.onDidDismiss().then(async (result) => {
      if (result.data) {
        const loading = await this.loadingCtrl.create({
          message: template ? 'Memperbarui template...' : 'Membuat template baru...'
        });
        await loading.present();

        try {
          if (template) {
            await this.templateService.updateTemplate(template.id!, result.data).toPromise();
            this.showToast('Template berhasil diperbarui', 'success');
          } else {
            await this.templateService.createTemplate(result.data).toPromise();
            this.showToast('Template berhasil dibuat', 'success');
          }
          this.loadTemplates();
        } catch (error) {
          console.error('Error saving template:', error);
          this.showToast('Gagal menyimpan template', 'danger');
        } finally {
          loading.dismiss();
        }
      }
    });

    return await modal.present();
  }

  async deleteTemplate(template: CertificateTemplate) {
    const loading = await this.loadingCtrl.create({
      message: 'Menghapus template...'
    });
    await loading.present();

    try {
      await this.templateService.deleteTemplate(template.id!).toPromise();
      this.showToast('Template berhasil dihapus', 'success');
      this.loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      this.showToast('Gagal menghapus template', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
} 