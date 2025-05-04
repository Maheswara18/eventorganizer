<?php

namespace App\Http\Controllers;

use App\Models\Participant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Facades\Storage;

class ParticipantController extends Controller
{
    // ✅ Lihat semua partisipasi
    public function index()
    {
        $user = Auth::user();

        if ($user->role === 'admin') {
            return response()->json(Participant::with(['user', 'event'])->get());
        }

        return response()->json(
            Participant::with('event')
                ->where('user_id', $user->id)
                ->get()
        );
    }

    // ✅ Detail 1 partisipasi
    public function show($id)
    {
        $participant = Participant::with(['user', 'event'])->findOrFail($id);

        if (Auth::user()->role !== 'admin' && $participant->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($participant);
    }

    // ✅ Register event (generate QR)
    public function store(Request $request)
    {
        if (Auth::user()->role !== 'participant') {
            return response()->json(['message' => 'Only participants allowed'], 403);
        }

        $validated = $request->validate([
            'event_id' => 'required|exists:events,id',
            'payment_id' => 'nullable|exists:payments,id'
        ]);

        // Cek apakah sudah terdaftar
        $exists = Participant::where('user_id', Auth::id())
            ->where('event_id', $validated['event_id'])
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Already registered for this event'], 409);
        }

        // Generate kode unik
        $qrData = 'QR_' . Str::uuid();
        $qrPath = 'public/qrcodes/' . $qrData . '.png';

        // Simpan QR code ke file
        $qrImage = QrCode::format('png')->size(300)->generate($qrData);
        Storage::put($qrPath, $qrImage);

        $participant = Participant::create([
            'user_id' => Auth::id(),
            'event_id' => $validated['event_id'],
            'payment_id' => $validated['payment_id'] ?? null,
            'qr_code_data' => $qrData,
            'qr_code_path' => str_replace('public/', 'storage/', $qrPath),
            'attendance_status' => 'registered',
        ]);

        return response()->json($participant, 201);
    }

    // ✅ Update kehadiran (admin only)
    public function update(Request $request, $id)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'attendance_status' => 'required|in:registered,present,absent'
        ]);

        $participant = Participant::findOrFail($id);
        $participant->attendance_status = $validated['attendance_status'];
        $participant->save();

        return response()->json($participant);
    }
}
