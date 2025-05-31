<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use App\Models\Participant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

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

        $participant = Participant::findOrFail($validated['participant_id']);

        if ($participant->attendance_status !== 'present') {
            return response()->json(['message' => 'Participant must be marked as present'], 400);
        }

        // generate kode verifikasi unik
        $code = strtoupper(Str::random(10));

        // Simulasikan pembuatan file sertifikat (di dunia nyata bisa pakai DOMPDF atau Image)
        $filename = 'certificates/' . $code . '.txt';
        Storage::put('public/' . $filename, "Certificate for participant_id: {$participant->id}");

        $certificate = Certificate::create([
            'participant_id' => $validated['participant_id'],
            'event_id' => $validated['event_id'],
            'certificate_path' => 'storage/' . $filename,
            'verification_code' => $code,
        ]);

        return response()->json($certificate, 201);
    }

    // ✅ Verifikasi kode sertifikat
    public function verify(Request $request)
    {
        $validated = $request->validate([
            'verification_code' => 'required|string',
        ]);

        $certificate = Certificate::with(['participant.user', 'event'])
            ->where('verification_code', $validated['verification_code'])
            ->first();

        if (!$certificate) {
            return response()->json(['valid' => false, 'message' => 'Certificate not found'], 404);
        }

        return response()->json([
            'valid' => true,
            'certificate' => $certificate
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
