@extends('layouts.app')

@section('title', 'Daftar Sertifikat')

@section('content')
<style>
    body {
        background: url("{{ asset('bg-pattern.png') }}") center center / cover no-repeat !important;
    }
    .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
</style>
<div class="container">
    <h2 class="my-4">Daftar Sertifikat</h2>

    <table class="table table-bordered">
        <thead>
            <tr>
                <th>Nama Peserta</th>
                <th>Event</th>
                <th>Tanggal Diterbitkan</th>
                <th>Kode Verifikasi</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($certificates as $certificate)
                <tr>
                    <td>{{ $certificate->participant->user->name ?? '-' }}</td>
                    <td>{{ $certificate->event->title ?? '-' }}</td>
                    <td>{{ \Carbon\Carbon::parse($certificate->issued_at)->format('d M Y') }}</td>
                    <td>{{ $certificate->verification_code }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="4" class="text-center">Belum ada sertifikat</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</div>
@endsection
