<nav style="background: #f8f9fa; padding: 1rem;">
    <a href="{{ route('admin.dashboard') }}">Dashboard</a> |
    <a href="{{ route('event.create') }}">Buat Event</a> |
    <a href="{{ route('event.qr') }}">QR Event</a> |
    <a href="{{ route('admin.payments') }}">Pembayaran</a> |
    <a href="{{ route('certificates.index') }}">Sertifikat</a> |
    <a href="{{ route('participants.index') }}">Peserta</a> |
    <a href="{{ route('admin.statistics') }}">Statistik</a> |
    
    <form action="{{ route('admin.logout') }}" method="POST" style="display:inline">
        @csrf
        <button type="submit">Logout</button>
    </form>
</nav>
