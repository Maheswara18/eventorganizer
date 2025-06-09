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
    Route::get('/events/{id}', [EventController::class, 'show']);
    Route::post('/events/{event}/register', [EventController::class, 'register']);
    Route::delete('/events/{event}/unregister', [EventController::class, 'unregister']);
    Route::get('/events/{id}/check-registration', [EventController::class, 'checkRegistration']);
    Route::get('/registered-events', [EventController::class, 'getRegisteredEvents']);
    Route::delete('/events/{id}/registration', [EventController::class, 'cancelRegistration']);
});

////////PAYMENT//////////

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/payments', [PaymentController::class, 'index']);
    Route::post('/payments', [PaymentController::class, 'store']);
    Route::get('/payments/{id}', [PaymentController::class, 'show']);
    Route::put('/payments/{id}', [PaymentController::class, 'update']); // update status
});

///////////PARTICIPANT///////////

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/participants/export', [ParticipantController::class, 'export']);
    Route::get('/participants', [ParticipantController::class, 'index']);
    Route::post('/participants', [ParticipantController::class, 'store']);
    Route::get('/participants/{id}', [ParticipantController::class, 'show']);
    Route::put('/participants/{id}', [ParticipantController::class, 'update']);
    Route::patch('/participants/{id}/status', [ParticipantController::class, 'updateStatus']);
});


//////////////CERTIFICATE//////////////

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/certificates', [CertificateController::class, 'index']);
    Route::post('/certificates', [CertificateController::class, 'store']);
    Route::get('/certificates/{id}', [CertificateController::class, 'show']);
});

// endpoint publik untuk verifikasi sertifikat
Route::post('/certificates/verify', [CertificateController::class, 'verify']);


///////////////////PRofile//////////////
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'updatePassword']);
});

use App\Http\Controllers\AdminController;

// Admin routes
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::post('/events', [EventController::class, 'store']);
    Route::put('/events/{id}', [EventController::class, 'update']);
    Route::delete('/events/{id}', [EventController::class, 'destroy']);
    Route::post('/scan-qr', [AdminController::class, 'scanQr']);
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
