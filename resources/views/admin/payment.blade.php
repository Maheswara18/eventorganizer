@extends('layouts.app')

@section('content')
<div class="container mt-4">
    <h3>Daftar Pembayaran</h3>
    <table class="table table-bordered table-hover">
        <thead class="table-light">
            <tr>
                <th>#</th>
                <th>Nama Peserta</th>
                <th>Event</th>
                <th>Jumlah</th>
                <th>Metode</th>
                <th>Status</th>
                <th>Bukti</th>
                <th>Tanggal Bayar</th>
            </tr>
        </thead>
        <tbody>
            @forelse($payments as $index => $payment)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>{{ $payment->user->name ?? '-' }}</td>
                <td>{{ $payment->event->title ?? '-' }}</td>
                <td>Rp{{ number_format($payment->amount, 0, ',', '.') }}</td>
                <td>{{ ucfirst($payment->payment_method) }}</td>
                <td>
                    <span class="badge bg-{{ $payment->payment_status === 'completed' ? 'success' : ($payment->payment_status === 'failed' ? 'danger' : 'warning') }}">
                        {{ ucfirst($payment->payment_status) }}
                    </span>
                </td>
                <td>
                    @if ($payment->payment_proof_path)
                        <a href="{{ asset($payment->payment_proof_path) }}" target="_blank">Lihat</a>
                    @else
                        -
                    @endif
                </td>
                <td>{{ \Carbon\Carbon::parse($payment->paid_at)->format('d M Y H:i') ?? '-' }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="8" class="text-center">Belum ada data pembayaran.</td>
            </tr>
            @endforelse
        </tbody>
    </table>
</div>
@endsection
