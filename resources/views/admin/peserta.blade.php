<!-- resources/views/admin/participants.blade.php -->

@php use App\Helpers\ParticipantHelper; @endphp

@extends('layouts.app')

@section('title', 'Manajemen Peserta')

@section('content')
<div class="container my-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
        <h2>Manajemen Peserta</h2>
        <div>
            
            <a href="#" class="btn btn-primary" onclick="exportData()"><i class="bi bi-download me-1"></i>Export</a>
        </div>
    </div>

    <div class="row mb-3">
        <div class="col-md-6">
            <input type="text" id="searchInput" class="form-control" placeholder="Cari peserta...">
        </div>
        <div class="col-md-6">
            <select id="eventSelect" class="form-select">
                <option value="">Semua Event</option>
                @foreach ($events as $event)
                    <option value="{{ $event->id }}">{{ $event->title }}</option>
                @endforeach
            </select>
        </div>
    </div>

    <div id="participantsContainer">
        @forelse ($participants as $participant)
            <div class="card mb-3">
                <div class="card-header">
                    <h5 class="mb-0">{{ $participant->user->name ?? '-' }}</h5>
                    <small>{{ $participant->user->email ?? '-' }}</small>
                </div>
                <div class="card-body">
                    <p><strong>Event:</strong> {{ $participant->event->title ?? '-' }}</p>
                    @if ($participant->notes)
                        <p>{{ $participant->notes }}</p>
                    @endif

                    <span class="badge bg-{{ ParticipantHelper::getPaymentStatusColor($participant->payment_status) }}">
                        {{ ParticipantHelper::getPaymentStatusText($participant->payment_status) }}
                    </span>

                    @if (in_array($participant->payment_status, ['paid', 'completed']))
                        <span class="badge bg-{{ ParticipantHelper::getStatusColor($participant->attendance_status) }}">
                            {{ $participant->attendance_status === 'present' ? 'Hadir' : ($participant->attendance_status === 'absent' ? 'Tidak Hadir' : 'Terdaftar') }}
                        </span>
                    @endif

                </div>
                <div class="card-footer d-flex justify-content-between">
                    <button class="btn btn-outline-info btn-sm" onclick="showFormResponses({{ $participant->id }})">
                        <i class="bi bi-file-earmark-text"></i> Lihat Jawaban Form
                    </button>
                    <div>
                        @if (in_array($participant->payment_status, ['paid', 'completed']))
                            <button class="btn btn-outline-{{ $participant->attendance_status === 'present' ? 'warning' : 'success' }} btn-sm" onclick="updateAttendanceStatus({{ $participant->id }}, '{{ $participant->attendance_status === 'present' ? 'absent' : 'present' }}')">
                                <i class="bi {{ $participant->attendance_status === 'present' ? 'bi-x-circle' : 'bi-check-circle' }}"></i>
                            </button>
                        @endif
                        <button class="btn btn-outline-danger btn-sm" onclick="deleteParticipant({{ $participant->id }})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        @empty
            <div class="alert alert-secondary text-center">Tidak ada peserta yang ditemukan.</div>
        @endforelse
    </div>
</div>

<!-- Modal jawaban form -->
<div class="modal fade" id="formResponsesModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Jawaban Form Registrasi</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body" id="formResponsesBody">
                <!-- konten diisi via JS -->
            </div>
        </div>
    </div>
</div>

<script>
    function exportData() {
        // Panggil backend export
        alert('Export data dipanggil.');
    }
    function showFormResponses(id) {
        // Fetch dan tampilkan modal jawaban form
        const modal = new bootstrap.Modal(document.getElementById('formResponsesModal'));
        document.getElementById('formResponsesBody').innerHTML = '<p>Loading...</p>';
        modal.show();
        // Simulasi fetch data jawaban form
        setTimeout(() => {
            document.getElementById('formResponsesBody').innerHTML = '<p>Tampilkan data jawaban form untuk ID: ' + id + '</p>';
        }, 1000);
    }
    function updateAttendanceStatus(id, status) {
        alert('Ubah status kehadiran peserta ID ' + id + ' menjadi ' + status);
    }
    function deleteParticipant(id) {
        if (confirm('Yakin ingin menghapus peserta?')) {
            alert('Peserta dengan ID ' + id + ' dihapus.');
        }
    }
</script>
@endsection
