<?php

use Illuminate\Support\Facades\Route;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Facades\Storage;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AdminDashboardController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/


Route::get('/login', [AuthController::class, 'showAdminLoginForm'])->name('login');
Route::post('/login', [AuthController::class, 'loginAdmin'])->name('admin.login');
Route::post('/logout', [AuthController::class, 'logoutAdmin'])->name('admin.logout');
Route::get('/profile', [App\Http\Controllers\ParticipantController::class, 'profile'])->name('profile');


Route::middleware(['auth', 'admin'])->group(function () {
    Route::get('/admin/dashboard', [AuthController::class, 'dashboardAdmin'])->name('admin.dashboard');
});



Route::get('/', function () {
    return view('welcome');
});

Route::get('/test-qr', function() {
    // Generate QR code
    $generator = QrCode::format('png');
    $generator->size(300);
    $generator->backgroundColor(255,255,255);
    $generator->color(0,0,0);
    $qrImage = $generator->generate('Test QR Code');
    
    // Simpan file
    Storage::put('public/test_qr.png', $qrImage);
    
    // Return image langsung
    return response($qrImage)
        ->header('Content-Type', 'image/png')
        ->header('Content-Disposition', 'inline; filename="qr-code.png"');
});
