<?php

use Illuminate\Support\Facades\Route;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Facades\Storage;

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
