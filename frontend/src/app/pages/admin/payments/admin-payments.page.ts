import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PaymentService } from '../../../services/payment.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-payments',
  templateUrl: './admin-payments.page.html',
  styleUrls: ['./admin-payments.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AdminPaymentsPage implements OnInit {
  payments: any[] = [];
  filteredPayments: any[] = [];
  selectedStatus: string = 'all';
  isLoading: boolean = true;
  isModalOpen: boolean = false;
  selectedPaymentProof: string = '';

  constructor(private paymentService: PaymentService) {}

  ngOnInit() {
    this.loadPayments();
  }

  loadPayments() {
    this.isLoading = true;
    this.paymentService.getAllPayments().subscribe({
      next: (data) => {
        this.payments = data;
        this.filterPayments();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Gagal memuat data pembayaran:', error);
        this.isLoading = false;
      }
    });
  }

  filterPayments() {
    if (this.selectedStatus === 'all') {
      this.filteredPayments = this.payments;
    } else {
      this.filteredPayments = this.payments.filter(
        payment => payment.payment_status === this.selectedStatus
      );
    }
  }

  updatePaymentStatus(paymentId: number, newStatus: 'pending' | 'completed' | 'failed') {
    this.paymentService.updatePaymentStatus(paymentId, newStatus).subscribe({
      next: () => {
        const payment = this.payments.find(p => p.id === paymentId);
        if (payment) {
          payment.payment_status = newStatus;
        }
        this.filterPayments();
      },
      error: (error) => {
        console.error('Gagal memperbarui status pembayaran:', error);
      }
    });
  }

  viewPaymentProof(payment: any) {
    if (payment.payment_proof_path) {
      this.selectedPaymentProof = `${environment.baseUrl}/storage/${payment.payment_proof_path}`;
      this.isModalOpen = true;
    }
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedPaymentProof = '';
  }
}
