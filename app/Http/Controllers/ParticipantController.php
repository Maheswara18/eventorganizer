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
    // ✅ Lihat semua partisipasi
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = Participant::with(['user', 'event', 'formResponses.field']);
        
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
        $participant = Participant::with(['user', 'event', 'formResponses.field'])->findOrFail($id);

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

    public function registerToEvent($eventId)
    {
        $user = auth()->user();
        $event = Event::findOrFail($eventId);

        if (Participant::where('user_id', $user->id)->where('event_id', $eventId)->exists()) {
            return response()->json(['message' => 'Sudah mendaftar'], 409);
        }

        $qrData = Str::uuid()->toString();
        $qrPath = 'qrcodes/' . $qrData . '.png';
        QrCode::format('png')->size(300)->generate($qrData, public_path('storage/' . $qrPath));

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
}
