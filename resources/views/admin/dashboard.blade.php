@extends('layouts.app')

@section('content')
<div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <a href="/profile" class="btn btn-outline-secondary">
            <i class="bi bi-person-circle"></i>
        </a>
        <div class="text-center">
            <img src="{{ asset('assets/logo-rundexo.png') }}" alt="Logo" height="40">
            <span class="ms-2 fw-bold">Rundexo</span>
        </div>
        <form action="/logout" method="POST">
            @csrf
            <button type="submit" class="btn btn-outline-danger">
                <i class="bi bi-box-arrow-right"></i>
            </button>
        </form>
    </div>

    @if(auth()->user()->role === 'admin')
        <div class="alert alert-info text-center">
            <h4>Halo Admin, "{{ auth()->user()->name }}"</h4>
            <p>Kelola event dan pantau aktivitas peserta dengan mudah!</p>
        </div>
    @endif

    <div class="row g-3">
        <div class="col-md-4">
            <a href="{{ route('event.qr') }}">QR Event</a>
        </div>

        <div class="col-md-4">
            <a href="{{ route('event.create') }}">Buat Event</a>
        </div>

        <div class="col-md-4">
            <a href="{{ route('admin.pembayaran') }}">Pembayaran</a>
        </div>

        <div class="col-md-4">
            <a href="{{ route('admin.certificates.index') }}">sertifikat</a>
        </div>

        <div class="col-md-4">
            <a href="{{ route('admin.peserta') }}">manajemen peserta</a>
        </div>

        <div class="col-md-4">
            <a href="{{ route('admin.statistics') }}">Lihat Statistik</a>

        </div>
    </div>
</div>
@endsection
