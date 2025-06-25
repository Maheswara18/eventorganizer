<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use App\Models\Participant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\CertificateTemplate;
use App\Notifications\CertificateGenerated;

class CertificateController extends Controller
{

    public function adminIndex()
    {
        $certificates = Certificate::with(['participant.user', 'event'])
            ->orderBy('created_at', 'desc')
            ->get();

        return view('admin.certificate', compact('certificates'));
    }



    // ✅ Lihat semua sertifikat
    public function index()
    {
        $user = Auth::user();

        if ($user->role === 'admin') {
            return response()->json(Certificate::with(['participant', 'event'])->get());
        }

        return response()->json(
            Certificate::with('event')
                ->whereHas('participant', function ($query) use ($user) {
                    $query->where('user_id', $user->id);
                })
                ->get()
        );
    }

    // ✅ Lihat 1 sertifikat
    public function show($id)
    {
        $certificate = Certificate::with(['participant', 'event'])->findOrFail($id);

        if (Auth::user()->role !== 'admin' && $certificate->participant->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($certificate);
    }

    // ✅ Generate sertifikat
    public function store(Request $request)
    {
        $validated = $request->validate([
            'participant_id' => 'required|exists:participants,id',
            'event_id' => 'required|exists:events,id',
        ]);

        // Check if certificate already exists
        $existingCertificate = Certificate::where('participant_id', $validated['participant_id'])
            ->where('event_id', $validated['event_id'])
            ->first();

        if ($existingCertificate) {
            return response()->json(['message' => 'Certificate already exists', 'certificate' => $existingCertificate], 200);
        }

        // Eager load user and event for participant
        $participant = Participant::with(['user', 'event'])->findOrFail($validated['participant_id']);

        if ($participant->attendance_status !== 'present') {
            return response()->json(['message' => 'Participant must be marked as present'], 400);
        }

        // Get participant name and event title
        $participantName = $participant->user->name ?? 'Peserta Tidak Dikenal';
        $eventTitle = $participant->event->title ?? 'Event Tidak Dikenal';

        // Fetch a certificate template (for now, use default)
        $certificateTemplate = CertificateTemplate::where('is_default', true)->first();

        if (!$certificateTemplate) {
            return response()->json(['message' => 'No default certificate template found. Please create one.'], 404);
        }

        // Generate unique verification code
        $code = strtoupper(Str::random(10));
        $verificationLink = url('/certificates/verify?code=' . $code);

        // Generate QR Code as base64 to embed directly in HTML
        $qrCodeBase64 = base64_encode(\SimpleSoftwareIO\QrCode\Facades\QrCode::format('png')
            ->size(100)
            ->errorCorrection('H') // High error correction for better scanning
            ->generate($verificationLink));

        // Build HTML content from template elements
        $html = "
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset=\"utf-8\">
                <title>Sertifikat Partisipasi</title>
                <style>
                    @page { margin: 0; }
                    body { 
                        font-family: 'Arial', sans-serif; 
                        text-align: center; 
                        margin: 0; 
                        padding: 0; 
                        background-color: #ffffff;
                    }
                    .certificate-container { 
                        width: 297mm;
                        height: 210mm;
                        margin: 0;
                        padding: 0;
                        position: relative;
                        overflow: hidden;
                    }
                    .content { 
                        position: absolute; 
                        top: 50%; 
                        left: 50%; 
                        transform: translate(-50%, -50%);
                        width: 80%;
                    }
                    h1 { 
                        color: #003366; 
                        font-size: 2.5em; 
                        margin-bottom: 20px;
                        font-weight: bold;
                    }
                    p { 
                        font-size: 1.2em; 
                        margin-bottom: 10px;
                        line-height: 1.5;
                    }
                    .name { 
                        font-size: 2.2em; 
                        font-weight: bold; 
                        margin: 30px 0; 
                        color: #333;
                        text-transform: uppercase;
                    }
                    .event-title { 
                        font-size: 1.8em; 
                        color: #555; 
                        margin-bottom: 30px;
                        font-style: italic;
                    }
                    .verification-code { 
                        margin-top: 40px; 
                        font-size: 1em; 
                        color: #777;
                        font-family: monospace;
                    }
                    .qr-code-img { 
                        margin-top: 20px; 
                        width: 100px; 
                        height: 100px;
                        image-rendering: -webkit-optimize-contrast;
                        image-rendering: crisp-edges;
                    }
                </style>
            </head>
            <body>
                <div class=\"certificate-container\">
                    <div class=\"content\">
                        <h1>Sertifikat Partisipasi</h1>
                        <p>Diberikan kepada:</p>
                        <p class=\"name\">{$participantName}</p>
                        <p>Atas partisipasinya dalam acara:</p>
                        <p class=\"event-title\">\"{$eventTitle}\"</p>
                        <div class=\"verification-code\">Kode Verifikasi: {$code}</div>
                        <img class=\"qr-code-img\" src=\"data:image/png;base64,{$qrCodeBase64}\" alt=\"QR Code Verifikasi\">
                        <p>Pindai untuk Verifikasi</p>
                    </div>
                </div>
            </body>
            </html>
        ";

        try {
            // Generate PDF with higher quality settings
            $pdf = Pdf::loadHtml($html)
                ->setPaper('A4', 'landscape')
                ->setOptions([
                    'isHtml5ParserEnabled' => true,
                    'isRemoteEnabled' => true,
                    'dpi' => 300,
                    'defaultFont' => 'Arial'
                ]);

            // Generate unique filename for PDF
            $filename = 'certificates/' . $code . '.pdf';
            
            // Save PDF to storage
            Storage::put('public/' . $filename, $pdf->output());

            // Create certificate record
        $certificate = Certificate::create([
            'participant_id' => $validated['participant_id'],
            'event_id' => $validated['event_id'],
                'certificate_path' => $filename,
            'verification_code' => $code,
                'issued_at' => now(),
            ]);
            
            \Log::info('DEBUG: Sertifikat berhasil dibuat', [
                'participant_id' => $validated['participant_id'],
                'event_id' => $validated['event_id'],
                'certificate_id' => $certificate->id
        ]);

            // Send notification to participant
            $participant->user->notify(new CertificateGenerated($certificate));

            return response()->json([
                'message' => 'Certificate generated successfully',
                'certificate' => $certificate
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Certificate generation failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to generate certificate',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ✅ Download sertifikat
    public function download($id)
    {
        $certificate = Certificate::with(['participant.user', 'event'])->findOrFail($id);
        
        // Cek akses
        if (Auth::user()->role !== 'admin' && $certificate->participant->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $path = $certificate->certificate_path;

        // Jika path di database masih mengandung 'storage/', hapus awalan tersebut
        // karena disk 'public' Laravel sudah mengarah ke storage/app/public
        if (Str::startsWith($path, 'storage/')) {
            $path = Str::after($path, 'storage/');
        }
        
        if (!Storage::disk('public')->exists($path)) {
            return response()->json(['message' => 'Certificate file not found'], 404);
        }

        return Storage::disk('public')->download($path);
    }

    // ✅ Verifikasi kode sertifikat
    public function verify(Request $request)
    {
        $validated = $request->validate([
            'verification_code' => 'required|string|size:10',
        ]);

        $certificate = Certificate::with(['participant.user', 'event'])
            ->where('verification_code', $validated['verification_code'])
            ->first();

        if (!$certificate) {
            return response()->json([
                'valid' => false, 
                'message' => 'Sertifikat tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'valid' => true,
            'certificate' => [
                'participant_name' => $certificate->participant->user->name,
                'event_title' => $certificate->event->title,
                'issued_at' => $certificate->issued_at,
                'verification_code' => $certificate->verification_code
            ]
        ]);
    }

    public function myCertificates()
{
    $user = auth()->user();

    $certificates = Certificate::with('event')
        ->whereHas('participant', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->get();

    return response()->json($certificates);
}
}
