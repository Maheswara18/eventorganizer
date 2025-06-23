@extends('layouts.app')

@section('content')
<div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
        <a href="{{ route('admin.dashboard') }}" class="btn btn-secondary">← Kembali</a>
        <h4>Scanner QR Peserta</h4>
        <button class="btn btn-outline-primary" onclick="viewScanHistory()">
            <i class="bi bi-list"></i> <!-- Bootstrap Icon -->
        </button>
    </div>

    <!-- QR Scanner Container -->
    <div id="qr-reader" class="mb-4" style="width: 100%; max-width: 500px;"></div>

    <!-- Participant Info Modal -->
    <div id="participant-info" class="card d-none">
        <div class="card-body text-center">
            <h4 id="participant-name"></h4>
            <p id="participant-email"></p>

            <div class="mb-2">
                <strong>Event:</strong> <span id="participant-event-title"></span><br>
                <strong>Status Kehadiran:</strong>
                <span id="participant-attendance-status" class="badge"></span><br>
                <strong>Status Pembayaran:</strong>
                <span id="participant-payment-status" class="badge"></span>
            </div>

            <div id="attendance-actions">
                <button class="btn btn-success w-100 mb-2" id="btn-confirm-attendance">
                    <i class="bi bi-check-circle"></i> Catat Kehadiran
                </button>
                <button class="btn btn-warning w-100 mb-2 d-none" disabled>
                    <i class="bi bi-check-circle-fill"></i> Sudah Hadir
                </button>
                <button class="btn btn-outline-secondary w-100" onclick="cancelAttendance()">
                    <i class="bi bi-x-circle"></i> Batal
                </button>
            </div>
        </div>
    </div>

    <!-- Scan Controls -->
    <div id="scan-controls" class="mt-4 text-center">
        <div id="scan-placeholder" class="mb-3">
            <i class="bi bi-qr-code" style="font-size: 3rem;"></i>
            <h5>Scan QR Code Peserta</h5>
            <p>Arahkan kamera ke QR code peserta untuk mencatat kehadiran</p>
            <button class="btn btn-primary" onclick="startScan()">
                <i class="bi bi-camera"></i> Mulai Scan
            </button>
        </div>
        <button class="btn btn-danger d-none" id="stop-scan-btn" onclick="stopScan()">
            <i class="bi bi-x-circle"></i> Berhenti Scan
        </button>
    </div>

    <!-- Scan History Summary -->
    <div id="scan-summary" class="card mt-4 d-none">
        <div class="card-header">Ringkasan Scan Hari Ini</div>
        <div class="card-body">
            <p>Total scan: <span id="scan-count">0</span> peserta</p>
            <button class="btn btn-outline-primary" onclick="viewScanHistory()">Lihat Detail</button>
            <button class="btn btn-outline-danger" onclick="clearScanHistory()">Hapus Riwayat</button>
        </div>
    </div>
</div>
@endsection

@section('scripts')
<!-- Tambahkan html5-qrcode atau lib scanner lain -->
<script src="https://unpkg.com/html5-qrcode" type="text/javascript"></script>
<script>
    let scanHistory = [];

    function startScan() {
        document.getElementById("stop-scan-btn").classList.remove("d-none");
        // Ganti dengan inisialisasi scanner kamu
        const scanner = new Html5Qrcode("qr-reader");
        scanner.start(
            { facingMode: "environment" },
            {
                fps: 10,
                qrbox: 250
            },
            qrCodeMessage => {
                stopScan();
                handleScanResult(qrCodeMessage);
            },
            errorMessage => {
                // optionally handle scan errors
            }
        ).then(() => {
            window.scannerInstance = scanner;
        });
    }

    function stopScan() {
        if (window.scannerInstance) {
            window.scannerInstance.stop().then(() => {
                window.scannerInstance.clear();
            });
        }
        document.getElementById("stop-scan-btn").classList.add("d-none");
    }

    function handleScanResult(code) {
        // Simulasi panggil API (gantilah dengan AJAX ke server)
        const dummy = {
            name: "Budi Santoso",
            email: "budi@example.com",
            event_title: "Seminar AI Nasional",
            attendance_status: "absent",
            payment_status: "paid"
        };
        scanHistory.push(dummy);
        showParticipantInfo(dummy);
        updateScanCount();
    }

    function showParticipantInfo(participant) {
        document.getElementById("participant-name").innerText = participant.name;
        document.getElementById("participant-email").innerText = participant.email;
        document.getElementById("participant-event-title").innerText = participant.event_title;

        const attStatus = document.getElementById("participant-attendance-status");
        attStatus.innerText = participant.attendance_status === "present" ? "Sudah Hadir" : "Belum Hadir";
        attStatus.className = participant.attendance_status === "present" ? "badge bg-success" : "badge bg-secondary";

        const payStatus = document.getElementById("participant-payment-status");
        payStatus.innerText = participant.payment_status === "paid" ? "Sudah Bayar" : "Belum Bayar";
        payStatus.className = participant.payment_status === "paid" ? "badge bg-success" : "badge bg-warning";

        document.getElementById("participant-info").classList.remove("d-none");
    }

    function cancelAttendance() {
        document.getElementById("participant-info").classList.add("d-none");
    }

    function updateScanCount() {
        document.getElementById("scan-count").innerText = scanHistory.length;
        document.getElementById("scan-summary").classList.remove("d-none");
    }

    function viewScanHistory() {
        alert("Fitur lihat riwayat belum dibuat");
    }

    function clearScanHistory() {
        scanHistory = [];
        updateScanCount();
        document.getElementById("scan-summary").classList.add("d-none");
    }
</script>
@endsection
