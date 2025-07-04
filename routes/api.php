<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ParticipantController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\FormTemplateController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\CertificateTemplateController;
use App\Http\Controllers\AdminController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

////AUTH/////////////

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
});

////////CRUD EVENT//////////////////

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/events', [EventController::class, 'index']);
    Route::get('/events/registered', [EventController::class, 'getRegisteredEvents']);
    Route::get('/events/random', [EventController::class, 'getRandomEvents']);
    Route::get('/events/{id}', [EventController::class, 'show']);
    Route::post('/events', [EventController::class, 'store']);
    Route::put('/events/{id}', [EventController::class, 'update']);
    Route::delete('/events/{id}', [EventController::class, 'destroy']);
    Route::post('/events/{event}/register', [EventController::class, 'register']);
    Route::delete('/events/{event}/unregister', [EventController::class, 'unregister']);
    Route::get('/events/{event}/check-registration', [EventController::class, 'checkRegistration']);
    Route::get('/events/{id}/statistics', [EventController::class, 'getStatistics']);
    Route::get('/registered-events', [EventController::class, 'getRegisteredEvents']);
    Route::delete('/events/{id}/registration', [EventController::class, 'cancelRegistration']);
    Route::post('/events/{event}/simulate-payment', [EventController::class, 'simulatePayment']);
});

////////PAYMENT//////////

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/payments', [PaymentController::class, 'index']);
    Route::get('/payments/admin', [PaymentController::class, 'getAdminPayments']);
    Route::get('/payments/event/{eventId}', [PaymentController::class, 'getEventPayments']);
    Route::get('/payments/user/{userId}', [PaymentController::class, 'getUserPayments']);
    Route::get('/payments/events/registered', [PaymentController::class, 'getRegisteredEvents']);
    Route::post('/payments', [PaymentController::class, 'store']);
    Route::get('/payments/{id}', [PaymentController::class, 'show']);
    Route::put('/payments/{id}', [PaymentController::class, 'update']); // update status
    Route::patch('/payments/{id}/status', [PaymentController::class, 'updateStatus']);
    Route::post('/payments/simulate/{eventId}', [PaymentController::class, 'simulatePayment']);
});

///////////PARTICIPANT///////////

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/participants/export', [ParticipantController::class, 'export']);
    Route::get('/participants', [ParticipantController::class, 'index']);
    Route::post('/participants', [ParticipantController::class, 'store']);
    Route::get('/participants/{id}', [ParticipantController::class, 'show']);
    Route::put('/participants/{id}', [ParticipantController::class, 'update']);
    Route::patch('/participants/{id}/status', [ParticipantController::class, 'updateStatus']);
    Route::get('/participants/event/{eventId}/me', [\App\Http\Controllers\ParticipantController::class, 'getMyParticipantByEvent']);
    Route::get('/events/{eventId}/participant-status', [ParticipantController::class, 'getParticipantStatus']);
});


//////////////CERTIFICATE//////////////

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/certificates', [CertificateController::class, 'index']);
    Route::post('/certificates', [CertificateController::class, 'store']);
    Route::get('/certificates/{id}', [CertificateController::class, 'show']);
    Route::get('/certificates/{id}/download', [CertificateController::class, 'download']);
});

// endpoint publik untuk verifikasi sertifikat
Route::post('/certificates/verify', [CertificateController::class, 'verify']);


///////////////////PRofile//////////////
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'updatePassword']);
});


// Admin routes
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::post('/events', [EventController::class, 'store']);
    Route::put('/events/{id}', [EventController::class, 'update']);
    Route::delete('/events/{id}', [EventController::class, 'destroy']);
    Route::post('/scan-qr', [AdminController::class, 'scanQr']);
    Route::post('/scan-qr/check', [ParticipantController::class, 'verifyQrCode']);
});

////////FORM TEMPLATES//////////
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/events/{event}/form-template', [FormTemplateController::class, 'index']);
    Route::post('/events/{event}/form-template', [FormTemplateController::class, 'store']);
    Route::put('/events/{event}/form-template/{template}', [FormTemplateController::class, 'update']);
    Route::delete('/events/{event}/form-template/{template}', [FormTemplateController::class, 'destroy']);
    
    // Form responses routes
    Route::post('/events/{event}/form-responses', [FormTemplateController::class, 'storeResponses']);
    Route::get('/events/{event}/form-responses', [FormTemplateController::class, 'getResponses']);
});

// Dashboard routes
Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::get('/dashboard/stats', [DashboardController::class, 'getStats']);
    Route::get('/dashboard/registrations', [DashboardController::class, 'getRegistrations']);
    Route::get('/dashboard/revenue', [DashboardController::class, 'getRevenue']);
    Route::get('/dashboard/activities', [DashboardController::class, 'getActivities']);
});

// Certificate Template Routes
Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::apiResource('certificate-templates', CertificateTemplateController::class);
    Route::post('certificate-templates/{template}/preview', [CertificateTemplateController::class, 'preview']);
    Route::post('certificate-templates/{template}/generate', [CertificateTemplateController::class, 'generate']);
});
