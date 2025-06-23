<nav style="background: #f8f9fa; padding: 1rem;">
    <a href="{{ route('admin.dashboard') }}">Dashboard</a> |
    
    
    <form action="{{ route('admin.logout') }}" method="POST" style="display:inline">
        @csrf
        <button type="submit">Logout</button>
    </form>
</nav>
