<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Login Admin - Rundexo</title>
    <link rel="stylesheet" href="{{ asset('css/app.css') }}"> <!-- jika kamu pakai Tailwind -->
    <style>
        
         body {
        background: url("{{ asset('bg-pattern.png') }}") center center / cover no-repeat !important;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        }

        .login-container {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            width: 100%;
            max-width: 400px;
        }

        .logo-img {
        width: 80px;
        height: auto;
        object-fit: contain;
        display: block;
        background-color: #2563eb;
        padding: 8px;
        border-radius: 8px;
        }

        .logo-container {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
        }

        .app-name {
            font-size: 1.5rem;
            font-weight: bold;
        }

        .tagline {
            text-align: center;
            margin-bottom: 1.5rem;
            color: #666;
        }

        .form-group {
            margin-bottom: 1rem;
        }

        .form-control {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid #ccc;
            border-radius: 6px;
        }

        .login-button {
            width: 100%;
            padding: 0.75rem;
            background-color: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
        }

        .login-button:disabled {
            background-color: #9ca3af;
        }

        .error-text {
            color: red;
            font-size: 0.875rem;
        }

        .forgot-password, .register-link {
            text-align: center;
            margin-top: 0.5rem;
        }

        .register-link a {
            color: #3b82f6;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo-container">
            <img src="{{ asset('assets/logo-rundexo.png') }}" alt="Logo" class="logo-img">
            <h1 class="app-name">RUNDEXO</h1>
        </div>
        <p class="tagline">Run Your Event Like a Pro</p>

        @if($errors->any())
            <div class="error-text">
                {{ $errors->first() }}
            </div>
        @endif

        <form method="POST" action="{{ route('admin.login') }}">
            @csrf

            <div class="form-group">
                <label for="email">EMAIL</label>
                <input type="email" name="email" id="email" class="form-control" value="{{ old('email') }}" required>
            </div>

            <div class="form-group">
                <label for="password">PASSWORD</label>
                <input type="password" name="password" id="password" class="form-control" required>
            </div>

            <div class="forgot-password">
                <a href="#">Lupa password?</a>
            </div>

            <button type="submit" class="login-button">LOGIN</button>
<!--  -->
        </form>
    </div>
</body>
</html>
