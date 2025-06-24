{{-- Catatan: Tampilan dashboard sudah diperbarui agar modern, rapi, dan responsif. Gunakan class dari app.css --}}
@extends('layouts.app')

@section('content')
<div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-4" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <div class="d-flex align-items-center">
            <img src="{{ asset('assets/logo-rundexo.png') }}" alt="Logo" height="40" style="vertical-align: middle; margin-right: 12px;">
            <span class="fw-bold" style="font-weight: bold; font-size: 1.3rem;">Rundexo Admin</span>
        </div>
        <div>
            <a href="/profile" class="btn btn-outline-secondary me-2" title="Profil Admin">
                <i class="bi bi-person-circle"></i> Profil
            </a>
            <form action="/logout" method="POST" style="display: inline;">
                @csrf
                <button type="submit" class="btn btn-outline-danger" title="Logout">
                    <i class="bi bi-box-arrow-right"></i> Logout
                </button>
            </form>
        </div>
    </div>

    <div class="alert alert-info text-center mb-4">
        <h4 style="margin-bottom: 0.5rem;">Halo Admin, <b>{{ auth()->user()->name }}</b></h4>
        <p style="margin-bottom: 0;">Kelola event dan pantau aktivitas peserta dengan mudah!</p>
    </div>

    <div class="dashboard-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-top: 2rem;">
        <div class="card text-center">
            <div class="card-header">QR Event</div>
            <div class="card-body">
                <i class="bi bi-qr-code" style="font-size: 2.5rem; color: #2563eb;"></i>
                <p class="mt-2">Scan & Kelola QR Event</p>
                <a href="{{ route('event.qr') }}" class="btn btn-primary w-100 mt-2">Buka QR Event</a>
            </div>
        </div>
        <div class="card text-center">
            <div class="card-header">Buat Event</div>
            <div class="card-body">
                <i class="bi bi-calendar-plus" style="font-size: 2.5rem; color: #2563eb;"></i>
                <p class="mt-2">Buat event baru dengan mudah</p>
                <a href="{{ route('event.create') }}" class="btn btn-primary w-100 mt-2">Buat Event</a>
            </div>
        </div>
        <div class="card text-center">
            <div class="card-header">Pembayaran</div>
            <div class="card-body">
                <i class="bi bi-cash-stack" style="font-size: 2.5rem; color: #2563eb;"></i>
                <p class="mt-2">Kelola pembayaran peserta</p>
                <a href="{{ route('admin.pembayaran') }}" class="btn btn-primary w-100 mt-2">Kelola Pembayaran</a>
            </div>
        </div>
        <div class="card text-center">
            <div class="card-header">Sertifikat</div>
            <div class="card-body">
                <i class="bi bi-award" style="font-size: 2.5rem; color: #2563eb;"></i>
                <p class="mt-2">Kelola & unduh sertifikat</p>
                <a href="{{ route('admin.certificates.index') }}" class="btn btn-primary w-100 mt-2">Kelola Sertifikat</a>
            </div>
        </div>
        <div class="card text-center">
            <div class="card-header">Manajemen Peserta</div>
            <div class="card-body">
                <i class="bi bi-people" style="font-size: 2.5rem; color: #2563eb;"></i>
                <p class="mt-2">Lihat & kelola peserta event</p>
                <a href="{{ route('admin.peserta') }}" class="btn btn-primary w-100 mt-2">Kelola Peserta</a>
            </div>
        </div>
        <div class="card text-center">
            <div class="card-header">Statistik</div>
            <div class="card-body">
                <i class="bi bi-bar-chart" style="font-size: 2.5rem; color: #2563eb;"></i>
                <p class="mt-2">Lihat statistik event</p>
                <a href="{{ route('admin.statistics') }}" class="btn btn-primary w-100 mt-2">Lihat Statistik</a>
            </div>
        </div>
    </div>
</div>
@endsection
