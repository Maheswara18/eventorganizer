import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Chart, ChartData, ChartConfiguration, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { EventsService } from '../../services/events.service';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-event-statistics',
  standalone: true,
  imports: [
    CommonModule, 
    IonicModule,
    BaseChartDirective
  ],
  template: `
    <div class="statistics-container">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Statistik Event</ion-card-title>
        </ion-card-header>
        <ion-card-content class="chart-container">
          <canvas baseChart
            [data]="participantChartData"
            [options]="chartOptions"
            type="doughnut">
          </canvas>
        </ion-card-content>
      </ion-card>

      <ion-card>
        <ion-card-header>
          <ion-card-title>Status Kehadiran</ion-card-title>
        </ion-card-header>
        <ion-card-content class="chart-container">
          <canvas baseChart
            [data]="attendanceChartData"
            [options]="chartOptions"
            type="pie">
          </canvas>
        </ion-card-content>
      </ion-card>
    </div>
  `,
  styles: [`
    .statistics-container {
      padding: 16px;
      contain: content;
    }
    .chart-container {
      position: relative;
      height: 300px;
      width: 100%;
      contain: strict;
      overflow: hidden;
    }
    canvas {
      margin: 0;
      max-height: 100%;
      width: 100%;
    }
    ion-card {
      margin-bottom: 16px;
      contain: content;
    }
  `]
})
export class EventStatisticsComponent implements OnInit, OnDestroy {
  @Input() eventId!: number;
  private destroy$ = new Subject<void>();
  private updateStats$ = new Subject<void>();

  participantChartData: ChartData<'doughnut'> = {
    labels: ['Terdaftar', 'Sisa Kuota'],
    datasets: [{
      data: [0, 0],
      backgroundColor: ['#2dd36f', '#92949c'],
      hoverBackgroundColor: ['#28ba62', '#7a7d85']
    }]
  };

  attendanceChartData: ChartData<'pie'> = {
    labels: ['Hadir', 'Tidak Hadir', 'Belum Diverifikasi'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ['#2dd36f', '#eb445a', '#ffc409'],
      hoverBackgroundColor: ['#28ba62', '#d43246', '#e6b400']
    }]
  };

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0 // general animation time
    },
    transitions: {
      active: {
        animation: {
          duration: 0 // animation during interactions
        }
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#000',
          font: {
            size: 14
          },
          padding: 20,
          usePointStyle: true
        }
      },
      tooltip: {
        enabled: true,
        mode: 'nearest',
        intersect: false,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed;
            const dataset = context.dataset;
            const total = dataset.data.reduce((sum: number, current) => {
              const currentValue = typeof current === 'number' ? current : 0;
              return sum + currentValue;
            }, 0);
            const percentage = total > 0 ? Math.round((Number(value) / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  constructor(private eventsService: EventsService) {
    this.updateStats$
      .pipe(
        debounceTime(250),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.loadStatistics();
      });
  }

  async ngOnInit() {
    if (!this.eventId) {
      console.error('Event ID is required');
      return;
    }
    this.updateStats$.next();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadStatistics() {
    try {
      const stats = await this.eventsService.getEventStatistics(this.eventId);
      
      // Update participant chart
      this.participantChartData = {
        ...this.participantChartData,
        datasets: [{
          ...this.participantChartData.datasets[0],
          data: [
            stats.registered_participants || 0,
            Math.max(0, (stats.max_participants || 0) - (stats.registered_participants || 0))
          ]
        }]
      };

      // Update attendance chart
      this.attendanceChartData = {
        ...this.attendanceChartData,
        datasets: [{
          ...this.attendanceChartData.datasets[0],
          data: [
            stats.present_count || 0,
            stats.absent_count || 0,
            stats.pending_count || 0
          ]
        }]
      };
    } catch (error) {
      console.error('Error loading event statistics:', error);
    }
  }
}