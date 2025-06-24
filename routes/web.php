<?php

use Illuminate\Support\Facades\Route;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Facades\Storage;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\ParticipantController;
use App\Http\Controllers\FormTemplateController;

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
Route::post('/logout', [AuthController::class, 'logoutAdmin'])->name('logout'); // Alias
Route::post('/logout', [AuthController::class, 'logoutAdmin'])->name('admin.logout');



Route::get('/profile', [App\Http\Controllers\ParticipantController::class, 'profile'])->name('profile');

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/admin/dashboard', function () {
        return view('admin.dashboard');
    })->name('admin.dashboard');

    Route::get('/events/create', [EventController::class, 'create'])->name('event.create');
    Route::get('/events/qr', [EventController::class, 'qr'])->name('event.qr');

    Route::get('/form-template/create/{event}', [FormTemplateController::class, 'create'])->name('formtemplate.create');
    Route::post('/form-template/store', [FormTemplateController::class, 'store'])->name('formtemplate.store');
    Route::get('/form-template/{event}', [FormTemplateController::class, 'show'])->name('formtemplate.show');
    Route::get('/form-template/{event}/edit', [FormTemplateController::class, 'edit'])->name('formtemplate.edit');
    Route::put('/form-template/{event}', [FormTemplateController::class, 'update'])->name('formtemplate.update');
    Route::delete('/form-template/{event}', [FormTemplateController::class, 'destroy'])->name('formtemplate.destroy');
    Route::post('/events-with-form', [EventController::class, 'storeWithForm'])->name('events.storeWithForm');

    // Ini yang sekarang bikin konflik (JSON):
    Route::get('/admin/payment', [PaymentController::class, 'index']);
    Route::get('/admin/pembayaran', [PaymentController::class, 'adminIndex'])->name('admin.pembayaran');
    

    Route::post('/events', [EventController::class, 'store'])->name('event.store');
    Route::get('/events/qr', [EventController::class, 'qr'])->name('event.qr');
    
    
    Route::get('/admin/certificate', [CertificateController::class, 'adminIndex'])->name('admin.certificates.index');

    Route::get('/admin/peserta', [ParticipantController::class, 'adminIndex'])->name('admin.peserta');
    Route::get('/admin/participants', [ParticipantController::class, 'adminIndex'])->name('admin.participants.index');
    
    Route::get('/admin/statistics', [EventController::class, 'showStatistics'])->name('admin.statistics');

    


    Route::get('/certificates/download/{id}', [CertificateController::class, 'download'])->name('certificate.download');
    Route::get('/certificates/verify/{id}', [CertificateController::class, 'verify'])->name('certificate.verify');
    Route::get('/certificate-templates', [CertificateController::class, 'index'])->name('certificate.templates');
    Route::get('/create-certificate', [CertificateController::class, 'create'])->name('certificate.create');
});


Route::middleware(['auth', 'admin'])->group(function () {
    Route::get('/admin/dashboard', [AuthController::class, 'dashboardAdmin'])->name('admin.dashboard');
});



Route::get('/', function () {
    return redirect()->route('login');
});

Route::get('/event', function () {
    return view('event');
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

Route::get('/app/{any}', function () {
    return file_get_contents(public_path('app/index.html'));
})->where('any', '.*');
