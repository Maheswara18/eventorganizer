<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Rundexo')</title>
    <link rel="stylesheet" href="{{ asset('css/app.css') }}"> {{-- opsional --}}
    <!-- Bootstrap Icons -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">

    <!-- <style>
        /* Tambahkan CSS khusus di sini */
        
         body {
        background: url("{{ asset('bg-pattern.png') }}") center center / cover no-repeat !important;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
    </style> -->
</head>
<body>
    @include('partials.nav') {{-- opsional, kalau kamu punya navbar --}}
    
    <div class="container">
        @yield('content')
    </div>

    <script src="{{ asset('js/app.js') }}"></script> {{-- opsional --}}
</body>
</html>
