@extends('layouts.app') {{-- Buat layout utama jika belum ada --}}

@section('content')
<div class="container py-4">

    {{-- Header --}}
    <div class="d-flex justify-content-between align-items-center mb-4">
        <div class="d-flex align-items-center">
            <img src="{{ asset('assets/logo-rundexo.png') }}" alt="Logo" width="50">
            <h2 class="ms-3 mb-0">Rundexo</h2>
        </div>
        <div>
            <a href="{{ route('profile') }}" class="btn btn-outline-secondary me-2">
                <i class="bi bi-person-circle"></i>
            </a>
            <a href="{{ route('logout') }}" class="btn btn-outline-danger"
               onclick="event.preventDefault(); document.getElementById('logout-form').submit();">
                <i class="bi bi-box-arrow-right"></i>
            </a>
            <form id="logout-form" action="{{ route('logout') }}" method="POST" class="d-none">
                @csrf
            </form>
        </div>
    </div>

    {{-- Welcome Section --}}
    <div class="alert alert-primary">
        @if(auth()->user()->role === 'admin')
            <h4>Halo Admin, "{{ auth()->user()->name }}"</h4>
            <p>Kelola event dan pantau aktivitas peserta dengan mudah!</p>
        @else
            <h4>Selamat Datang, "{{ auth()->user()->name }}"</h4>
            <p>Siap menghadiri event menarik hari ini?</p>
        @endif
    </div>

    {{-- Admin Menu --}}
    @if(auth()->user()->role === 'admin')
    <div class="row row-cols-1 row-cols-md-3 g-4">
        <div class="col">
            <a href="{{ route('event.qr') }}" class="text-decoration-none">
                <div class="card text-center h-100">
                    <div class="card-body">
                        <i class="bi bi-qr-code" style="font-size: 2rem;"></i>
                        <p class="mt-2">Scan QR Event</p>
                    </div>
                </div>
            </a>
        </div>
        <div class="col">
            <a href="{{ route('event.create') }}" class="text-decoration-none">
                <div class="card text-center h-100">
                    <div class="card-body">
                        <i class="bi bi-plus-circle" style="font-size: 2rem;"></i>
                        <p class="mt-2">Buat Event</p>
                    </div>
                </div>
            </a>
        </div>
        <div class="col">
            <a href="{{ route('admin.payments') }}" class="text-decoration-none">
                <div class="card text-center h-100">
                    <div class="card-body">
                        <i class="bi bi-cash-stack" style="font-size: 2rem;"></i>
                        <p class="mt-2">Manajemen Pembayaran</p>
                    </div>
                </div>
            </a>
        </div>
        <div class="col">
            <a href="{{ route('certificates') }}" class="text-decoration-none">
                <div class="card text-center h-100">
                    <div class="card-body">
                        <i class="bi bi-award" style="font-size: 2rem;"></i>
                        <p class="mt-2">Sertifikat</p>
                    </div>
                </div>
            </a>
        </div>
        <div class="col">
            <a href="{{ route('participants.manage') }}" class="text-decoration-none">
                <div class="card text-center h-100">
                    <div class="card-body">
                        <i class="bi bi-people" style="font-size: 2rem;"></i>
                        <p class="mt-2">Manajemen Peserta</p>
                    </div>
                </div>
            </a>
        </div>
        <div class="col">
            <a href="{{ route('admin.statistics') }}" class="text-decoration-none">
                <div class="card text-center h-100">
                    <div class="card-body">
                        <i class="bi bi-bar-chart-line" style="font-size: 2rem;"></i>
                        <p class="mt-2">Statistik Event</p>
                    </div>
                </div>
            </a>
        </div>
    </div>
    @endif

    {{-- Rekomendasi Event untuk Peserta --}}
    @if(auth()->user()->role !== 'admin')
        <div class="mt-5">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h5>Event Rekomendasi</h5>
                <a href="{{ route('events.index') }}" class="btn btn-sm btn-outline-primary">
                    Lihat Semua
                </a>
            </div>
            @if(isset($recommendedEvents) && count($recommendedEvents) > 0)
                <div class="row">
                    @foreach($recommendedEvents as $event)
                    <div class="col-md-4 mb-3">
                        <a href="{{ route('event.detail', $event->id) }}" class="text-decoration-none">
                            <div class="card">
                                <div class="card-body">
                                    <h6>{{ $event->title }}</h6>
                                    <p>
                                        <i class="bi bi-calendar"></i>
                                        {{ \Carbon\Carbon::parse($event->start_datetime)->translatedFormat('d F Y') }}
                                    </p>
                                </div>
                            </div>
                        </a>
                    </div>
                    @endforeach
                </div>
            @else
                <p>Belum ada event rekomendasi tersedia.</p>
            @endif
        </div>
    @endif

</div>
@endsection
