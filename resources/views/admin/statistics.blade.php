@extends('layouts.app')

@section('content')
<div class="container mt-4">

    <div class="d-flex justify-content-between align-items-center mb-3">
        <a href="{{ route('admin.dashboard') }}" class="btn btn-secondary">← Kembali</a>
        <h2>Statistik Event</h2>
        <a href="{{ route('admin.statistics') }}" class="btn btn-outline-primary">
            <i class="fas fa-sync-alt"></i> Refresh
        </a>
    </div>

    <!-- Summary Cards -->
    <div class="row text-center">
        <div class="col-md-4 mb-3">
            <div class="card border-primary">
                <div class="card-body">
                    <i class="fas fa-calendar fa-2x text-primary mb-2"></i>
                    <h5>Total Event</h5>
                    <h3>{{ $dashboardStats['totalEvents'] ?? 0 }}</h3>
                </div>
            </div>
        </div>

        <div class="col-md-4 mb-3">
            <div class="card border-success">
                <div class="card-body">
                    <i class="fas fa-users fa-2x text-success mb-2"></i>
                    <h5>Total Peserta</h5>
                    <h3>{{ $dashboardStats['totalParticipants'] ?? 0 }}</h3>
                </div>
            </div>
        </div>

        <div class="col-md-4 mb-3">
            <div class="card border-warning">
                <div class="card-body">
                    <i class="fas fa-money-bill-alt fa-2x text-warning mb-2"></i>
                    <h5>Pembayaran Pending</h5>
                    <h3>{{ $dashboardStats['pendingPayments'] ?? 0 }}</h3>
                </div>
            </div>
        </div>
    </div>

    <!-- Charts -->
    <div class="row mt-4">
        <div class="col-md-6">
            <div class="card">
                <div class="card-header">
                    <strong><i class="fas fa-chart-line text-primary"></i> Pendaftaran Event</strong>
                    <div class="small text-muted">6 Bulan Terakhir</div>
                </div>
                <div class="card-body">
                    <canvas id="registrationChart"></canvas>
                </div>
            </div>
        </div>

        <div class="col-md-6">
            <div class="card">
                <div class="card-header">
                    <strong><i class="fas fa-chart-bar text-success"></i> Pendapatan</strong>
                    <div class="small text-muted">6 Bulan Terakhir</div>
                </div>
                <div class="card-body">
                    <canvas id="revenueChart"></canvas>
                </div>
            </div>
        </div>
    </div>

    <!-- Recent Activities -->
    <div class="row mt-4">
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    <strong><i class="fas fa-clock text-info"></i> Aktivitas Terbaru</strong>
                </div>
                <div class="card-body">
                    @forelse ($recentActivities as $activity)
                        <div class="d-flex align-items-start mb-3">
                            <i class="fas {{ $activity['icon'] }} fa-lg text-{{ $activity['color'] ?? 'secondary' }} me-3"></i>
                            <div>
                                <strong>{{ $activity['title'] }}</strong><br>
                                <small class="text-muted">{{ $activity['description'] }}</small><br>
                                <small class="text-muted"><i class="far fa-clock"></i> {{ $activity['time'] }}</small>
                            </div>
                        </div>
                    @empty
                        <p class="text-muted">Tidak ada aktivitas terbaru.</p>
                    @endforelse
                </div>
            </div>
        </div>
    </div>

</div>

<!-- Chart.js -->
<!-- <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
    const registrationChart = new Chart(document.getElementById('registrationChart'), {
        type: 'line',
        data: @json($registrationChartData),
        options: {!! json_encode($chartOptions ?? [], JSON_HEX_TAG) !!}
    });

    const revenueChart = new Chart(document.getElementById('revenueChart'), {
        type: 'bar',
        data: @json($revenueChartData),
        options: {!! json_encode($chartOptions ?? [], JSON_HEX_TAG) !!}
    });
</script> -->
@endsection
