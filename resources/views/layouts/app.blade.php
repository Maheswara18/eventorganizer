<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Rundexo')</title>
    <link rel="stylesheet" href="{{ asset('css/app.css') }}"> {{-- opsional --}}
</head>
<body>
    @include('partials.nav') {{-- opsional, kalau kamu punya navbar --}}
    
    <div class="container">
        @yield('content')
    </div>

    <script src="{{ asset('js/app.js') }}"></script> {{-- opsional --}}
</body>
</html>
