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

class CertificateController extends Controller
{
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
        if (Auth::user()->role !== 'admin') {
            return response()->json(['message' => 'Only admin can issue certificate'], 403);
        }

        $validated = $request->validate([
            'participant_id' => 'required|exists:participants,id',
            'event_id' => 'required|exists:events,id',
        ]);

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
        // Assuming frontend has a verification route like /certificates/verify
        $verificationLink = url('/certificates/verify?code=' . $code);

        // Generate QR Code as base64 to embed directly in HTML
        $qrCodeBase64 = base64_encode(\SimpleSoftwareIO\QrCode\Facades\QrCode::format('png')->size(100)->generate($verificationLink));

        // Build HTML content from template elements (simplified for now)
        // In a full template builder, this would be more dynamic based on $certificateTemplate->elements
        $html = "
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset=\"utf-8\">
                <title>Sertifikat Partisipasi</title>
                <style>
                    body { font-family: sans-serif; text-align: center; margin: 0; padding: 0; }
                    .certificate-container { 
                        width: 297mm; /* A4 width */
                        height: 210mm; /* A4 height */
                        margin: 0; padding: 0;
                        background-color: #f0f0f0;
                        box-sizing: border-box;
                        position: relative;
                        overflow: hidden;
                    }
                    .content { 
                        position: absolute; 
                        top: 50%; left: 50%; 
                        transform: translate(-50%, -50%);
                        width: 80%;
                    }
                    h1 { color: #003366; font-size: 2.5em; margin-bottom: 20px; }
                    p { font-size: 1.2em; margin-bottom: 10px; }
                    .name { font-size: 2.2em; font-weight: bold; margin: 30px 0; color: #333; }
                    .event-title { font-size: 1.8em; color: #555; margin-bottom: 30px; }
                    .verification-code { margin-top: 40px; font-size: 1em; color: #777; }
                    .qr-code-img { margin-top: 20px; width: 100px; height: 100px; }
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

        $pdf = Pdf::loadHtml($html)->setPaper('A4', 'landscape');

        // Generate unique filename for PDF
        $filename = 'certificates/' . $code . '.pdf';
        Storage::put('public/' . $filename, $pdf->output()); // Save PDF to storage

        $certificate = Certificate::create([
            'participant_id' => $validated['participant_id'],
            'event_id' => $validated['event_id'],
            'certificate_path' => $filename, // Path to the saved PDF
            'verification_code' => $code,
        ]);

        return response()->json($certificate, 201);
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
