@extends('layouts.app')

@section('content')
<style>
    .admin-header {
        background: linear-gradient(to bottom right, #3b82f6, #60a5fa);
        color: white;
        padding: 2rem;
        text-align: center;
        border-radius: 0 0 20px 20px;
        margin-bottom: 2rem;
    }

    .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1.5rem;
        padding: 0 1rem;
    }

    .dashboard-card {
        background-color: #f9f9f9;
        border-radius: 12px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.05);
        text-align: center;
        padding: 1.5rem;
        transition: transform 0.2s;
    }

    .dashboard-card:hover {
        transform: translateY(-3px);
    }

    .dashboard-card i {
        font-size: 2.5rem;
        color: #3b82f6;
        margin-bottom: 0.5rem;
    }

    .dashboard-label {
        font-weight: 500;
        font-size: 1.1rem;
    }

    .logo-container {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
}

.logo-img {
    width: 40px;      /* Atur ukuran lebar */
    height: auto;     /* Biarkan tinggi mengikuti proporsi */
}


</style>

<div class="admin-header">
    <div class="logo-container">
            <img src="{{ asset('assets/logo-rundexo.png') }}" alt="Logo" class="logo-img">
            <h3 class="app-name">RUNDEXO</h3>
        </div>
    <h3 class="mt-2">Halo Admin, "{{ auth()->user()->name }}"</h3>
    <p>Kelola event dan pantau aktivitas peserta dengan mudah!</p>
</div>

<div class="dashboard-grid">

    <a href="{{ route('event.qr') }}" class="dashboard-card text-decoration-none text-dark">
        <i class="bi bi-qr-code"></i>
        <div class="dashboard-label">Scan QR Event</div>
    </a>

    <a href="{{ route('event.create') }}" class="dashboard-card text-decoration-none text-dark">
        <i class="bi bi-calendar-plus"></i>
        <div class="dashboard-label">Buat Event</div>
    </a>

    <a href="{{ route('admin.pembayaran') }}" class="dashboard-card text-decoration-none text-dark">
        <i class="bi bi-cash-coin"></i>
        <div class="dashboard-label">Manajemen Pembayaran</div>
    </a>

    <a href="{{ route('admin.certificates.index') }}" class="dashboard-card text-decoration-none text-dark">
        <i class="bi bi-award"></i>
        <div class="dashboard-label">Sertifikat</div>
    </a>

    <a href="{{ route('admin.peserta') }}" class="dashboard-card text-decoration-none text-dark">
        <i class="bi bi-people-fill"></i>
        <div class="dashboard-label">Manajemen Peserta</div>
    </a>

    <a href="{{ route('admin.statistics') }}" class="dashboard-card text-decoration-none text-dark">
        <i class="bi bi-bar-chart-line-fill"></i>
        <div class="dashboard-label">Statistik Event</div>
    </a>
</div>
@endsection
