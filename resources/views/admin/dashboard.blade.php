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
            <a href="/admin/scanqr" class="text-decoration-none">
                <div class="card text-center p-4">
                    <i class="bi bi-qr-code fs-1 mb-2"></i>
                    <div>Scan QR Event</div>
                </div>
            </a>
        </div>

        <div class="col-md-4">
            <a href="/admin/createEvent" class="text-decoration-none">
                <div class="card text-center p-4">
                    <i class="bi bi-plus-circle fs-1 mb-2"></i>
                    <div>Buat Event</div>
                </div>
            </a>
        </div>

        <div class="col-md-4">
            <a href="/admin/payments" class="text-decoration-none">
                <div class="card text-center p-4">
                    <i class="bi bi-cash-stack fs-1 mb-2"></i>
                    <div>Manajemen Pembayaran</div>
                </div>
            </a>
        </div>

        <div class="col-md-4">
            <a href="/admin/sertifikat" class="text-decoration-none">
                <div class="card text-center p-4">
                    <i class="bi bi-award fs-1 mb-2"></i>
                    <div>Sertifikat</div>
                </div>
            </a>
        </div>

        <div class="col-md-4">
            <a href="/admin/peserta" class="text-decoration-none">
                <div class="card text-center p-4">
                    <i class="bi bi-people fs-1 mb-2"></i>
                    <div>Manajemen Peserta</div>
                </div>
            </a>
        </div>

        <div class="col-md-4">
            <a href="/admin/statistik" class="text-decoration-none">
                <div class="card text-center p-4">
                    <i class="bi bi-bar-chart fs-1 mb-2"></i>
                    <div>Statistik Event</div>
                </div>
            </a>
        </div>
    </div>
</div>
@endsection
