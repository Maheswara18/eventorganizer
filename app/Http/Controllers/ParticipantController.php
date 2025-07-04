<?php

namespace App\Http\Controllers;

use App\Models\Participant;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Facades\Storage;

class ParticipantController extends Controller
{

    public function adminIndex(Request $request)
    {
        $participants = Participant::with(['user', 'event'])->get();
        $events = Event::all();

        return view('admin.peserta', compact('participants', 'events'));
    }
    
    // ✅ Lihat semua partisipasi
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = Participant::with(['user', 'event', 'payment', 'certificate', 'formResponses.field']);
        
        // Filter berdasarkan event jika ada
        if ($request->has('event_id')) {
            $query->where('event_id', $request->event_id);
        }
        
        // Filter berdasarkan pencarian
        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('user', function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter berdasarkan role
        if ($user->role !== 'admin') {
            $query->where('user_id', $user->id);
        }

        // Paginasi
        $perPage = $request->get('per_page', 10);
        $participants = $query->paginate($perPage);

        return response()->json($participants);
    }

    // ✅ Detail 1 partisipasi
    public function show($id)
    {
        $participant = Participant::with(['user', 'event', 'payment', 'certificate', 'formResponses.field'])->findOrFail($id);

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

        $userId = Auth::id();
        $eventId = $validated['event_id'];
        $qrData = "participant-{$userId}-{$eventId}";
        $uuid = Str::uuid();
        $qrPath = "public/qrcodes/participant-{$userId}-{$eventId}-{$uuid}.png";

        // Simpan QR code ke file
        QrCode::format('png')
    ->size(300)
    ->errorCorrection('M')
    ->generate($qrData, Storage::path($qrPath));

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

    public function registerToEvent($eventId)
    {
        $user = auth()->user();
        $event = Event::findOrFail($eventId);

        if (Participant::where('user_id', $user->id)->where('event_id', $eventId)->exists()) {
            return response()->json(['message' => 'Sudah mendaftar'], 409);
        }

        $qrData = Str::uuid()->toString();
        $qrPath = 'qrcodes/' . $qrData . '.png';
        $qrData = "participant-{$user->id}-{$event->id}";
        $uuid = Str::uuid();
        $qrPath = "qrcodes/participant-{$user->id}-{$event->id}-{$uuid}.png";
        QrCode::format('png')
    ->size(300)
    ->errorCorrection('M')
    ->generate($qrData, public_path('storage/' . $qrPath));

        $participant = Participant::create([
            'user_id' => $user->id,
            'event_id' => $eventId,
            'qr_code_data' => $qrData,
            'qr_code_path' => $qrPath,
        ]);

        return response()->json(['participant' => $participant], 201);
    }

    public function myEvents()
    {
        $user = auth()->user();

        $participations = Participant::with(['event', 'payment'])
            ->where('user_id', $user->id)
            ->get()
            ->map(function ($participant) {
                $event = $participant->event;
                
                // Sync status with payment if exists
                if ($participant->payment && $participant->status !== $participant->payment->payment_status) {
                    $participant->status = $participant->payment->payment_status;
                    $participant->save();
                }
                
                return [
                    'id' => $participant->id,
                    'event' => [
                        'id' => $event->id,
                        'title' => $event->title,
                        'description' => $event->description,
                        'start_datetime' => $event->start_datetime,
                        'end_datetime' => $event->end_datetime,
                        'location' => $event->location,
                        'image_path' => $event->image_path,
                        'price' => $event->price
                    ],
                    'qr_code_path' => $participant->qr_code_path,
                    'qr_code_data' => $participant->qr_code_data,
                    'attendance_status' => $participant->attendance_status,
                    'payment_status' => $participant->payment ? $participant->payment->payment_status : null,
                    'registration_date' => $participant->created_at,
                    'payment_date' => $participant->payment ? $participant->payment->paid_at : null
                ];
            });

        return response()->json($participations);
    }

    public function export(Request $request)
    {
        $user = Auth::user();
        
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = Participant::with(['user', 'event']);
        
        // Filter berdasarkan event jika ada
        if ($request->has('event_id')) {
            $query->where('event_id', $request->event_id);
        }
        
        // Filter berdasarkan pencarian
        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('user', function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $participants = $query->get();

        // Generate CSV
        $filename = 'participants_' . date('Y-m-d_His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"'
        ];

        $handle = fopen('php://temp', 'r+');
        
        // Add headers
        fputcsv($handle, [
            'ID',
            'Nama Peserta',
            'Email',
            'Event',
            'Tanggal Registrasi',
            'Status Kehadiran',
            'QR Code'
        ]);

        // Add data rows
        foreach ($participants as $participant) {
            fputcsv($handle, [
                $participant->id,
                $participant->user->name,
                $participant->user->email,
                $participant->event->title,
                $participant->created_at,
                $participant->attendance_status,
                $participant->qr_code_data
            ]);
        }

        rewind($handle);
        $content = stream_get_contents($handle);
        fclose($handle);

        return response($content, 200, $headers);
    }

    public function updateStatus(Request $request, $id)
    {
        $user = Auth::user();
        
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'status' => 'required|in:registered,present,absent'
        ]);

        $participant = Participant::findOrFail($id);
        $participant->attendance_status = $request->status;
        $participant->save();

        return response()->json([
            'message' => 'Status berhasil diperbarui',
            'participant' => $participant
        ]);
    }

    // Mendapatkan data participant berdasarkan event dan user yang sedang login
    public function getMyParticipantByEvent($eventId)
    {
        $user = Auth::user();
        $participant = Participant::with(['user', 'event', 'formResponses.field'])
            ->where('user_id', $user->id)
            ->where('event_id', $eventId)
            ->first();

        if (!$participant) {
            return response()->json(['message' => 'Not registered'], 404);
        }

        // Ambil QR code yang sudah ada dari storage dan encode ke base64
        if ($participant->qr_code_path) {
            $path = str_replace('storage/', 'public/', $participant->qr_code_path);
            if (Storage::exists($path)) {
                $fileContent = Storage::get($path);
                // Tambahkan properti baru ke objek participant untuk dikirim ke frontend
                $participant->qr_code_base64 = 'data:image/png;base64,' . base64_encode($fileContent);
            }
        }

        return response()->json($participant);
    }

    public function getParticipantStatus($eventId)
    {
        $user = auth()->user();
        
        $participant = Participant::with(['event', 'certificate'])
            ->where('user_id', $user->id)
            ->where('event_id', $eventId)
            ->first();

        if (!$participant) {
            return response()->json(['message' => 'Participant not found'], 404);
        }

        $status = [
            'attendance_status' => $participant->attendance_status,
            'attendance_updated_at' => $participant->attendance_updated_at,
            'certificate_status' => $participant->certificate ? 'ready' : 'not_ready',
            'certificate_download_url' => $participant->certificate ? url('/certificates/' . $participant->certificate->id . '/download') : null,
            'certificate_issued_at' => $participant->certificate ? $participant->certificate->issued_at : null
        ];

        return response()->json($status);
    }
    public function verifyQrCode(Request $request)
{
    // Pastikan hanya admin yang bisa melakukan scan
    if (Auth::user()->role !== 'admin') {
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    $validated = $request->validate([
        'qr_code_data' => 'required|string'
    ]);

    $qrData = $validated['qr_code_data'];

    // Cari partisipan berdasarkan data QR yang unik
    $participant = Participant::with(['user', 'event'])
        ->where('qr_code_data', $qrData)
        ->first();

    if ($participant) {
        // Jika ditemukan, kirim kembali data lengkapnya
        return response()->json([
            'success' => true,
            'participant' => [
                'id' => $participant->id,
                'name' => $participant->user->name,
                'email' => $participant->user->email,
                'event_id' => $participant->event->id,
                'event_title' => $participant->event->title,
                'attendance_status' => $participant->attendance_status,
                'payment_status' => $participant->payment ? $participant->payment->payment_status : 'free' // asumsikan free jika tidak ada payment
            ]
        ]);
    } else {
        // Jika tidak ditemukan
        return response()->json([
            'success' => false,
            'message' => 'Participant not found for the given QR code.'
        ], 404);
    }
}
}
