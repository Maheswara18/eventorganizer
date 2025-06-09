import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { Chart, ChartData, ChartConfiguration, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { DashboardService } from '../../services/dashboard.service';
import { lastValueFrom } from 'rxjs';

// Register Chart.js components
Chart.register(...registerables);

interface DashboardStats {
  totalEvents: number;
  totalParticipants: number;
  pendingPayments: number;
}

interface Activity {
  icon: string;
  color: string;
  title: string;
  description: string;
  time: string;
}

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.page.html',
  styleUrls: ['./statistics.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    BaseChartDirective
  ]
})
export class StatisticsPage implements OnInit {
  // Dashboard Stats
  dashboardStats: DashboardStats = {
    totalEvents: 0,
    totalParticipants: 0,
    pendingPayments: 0
  };

  // Chart Data
  registrationChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{
      label: 'Pendaftaran',
      data: [],
      borderColor: '#3880ff',
      backgroundColor: 'rgba(56, 128, 255, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  revenueChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      label: 'Pendapatan',
      data: [],
      backgroundColor: '#2dd36f'
    }]
  };

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || '';
            if (label === 'Pendapatan') {
              return `${label}: Rp${context.parsed.y.toLocaleString('id-ID')}`;
            }
            return `${label}: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => {
            if (this.revenueChartData.datasets[0].data.length > 0) {
              return `Rp${Number(value).toLocaleString('id-ID')}`;
            }
            return value;
          }
        }
      }
    }
  };

  // Recent Activities
  recentActivities: Activity[] = [];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.loadData();
  }

  async refreshData() {
    const refresher = document.createElement('ion-refresher');
    refresher.complete();
    await this.loadData();
  }

  private async loadData() {
    try {
      // Load stats
      const stats = await lastValueFrom(this.dashboardService.getStats());
      this.dashboardStats = {
        totalEvents: stats.totalEvents || 0,
        totalParticipants: stats.totalParticipants || 0,
        pendingPayments: stats.pendingPayments || 0
      };

      // Load registration chart data
      const registrationResponse = await lastValueFrom(this.dashboardService.getRegistrationChart());
      const registrationData = {
        labels: (registrationResponse as any).labels || [],
        values: (registrationResponse as any).values || []
      };
      
      this.registrationChartData = {
        labels: registrationData.labels,
        datasets: [{
          ...this.registrationChartData.datasets[0],
          data: registrationData.values
        }]
      };

      // Load revenue chart data
      const revenueResponse = await lastValueFrom(this.dashboardService.getRevenueChart());
      const revenueData = {
        labels: (revenueResponse as any).labels || [],
        values: (revenueResponse as any).values || []
      };

      this.revenueChartData = {
        labels: revenueData.labels,
        datasets: [{
          ...this.revenueChartData.datasets[0],
          data: revenueData.values
        }]
      };

      // Load recent activities
      const activities = await lastValueFrom(this.dashboardService.getRecentActivities());
      this.recentActivities = activities;
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }
} 