<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Participant;
use App\Models\EventRegistration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use App\Models\FormResponse;

class EventController extends Controller
{
    // ✅ List semua event
    public function index()
    {
        try {
            $events = Event::with('admin')->get();
            return response()->json($events);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error fetching events', 'error' => $e->getMessage()], 500);
        }
    }


    // ✅ Detail satu event
    public function show($id)
    {
        try {
            $event = Event::with('admin')->findOrFail($id);
            return response()->json($event);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Event not found', 'error' => $e->getMessage()], 404);
        }
    }

    // ✅ Create event (admin only)
    public function store(Request $request)
    {
        try {
            \Log::info('User attempting to create event: ' . Auth::user()->name);
            \Log::info('User role: ' . Auth::user()->role);

            if (Auth::user()->role !== 'admin') {
                \Log::info('Access denied: User is not admin');
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $validated = $request->validate([
                'title' => 'required|string',
                'description' => 'nullable|string',
                'provides_certificate' => 'boolean',
                'price' => 'numeric|min:0',
                'location' => 'required|string',
                'status' => 'in:active,ended',
                'max_participants' => 'nullable|integer|min:1',
                'start_datetime' => 'required|date',
                'end_datetime' => 'required|date|after_or_equal:start_datetime',
                'image_path' => 'nullable|image|mimes:jpeg,png,jpg|max:2048'
            ]);

            // ✅ Upload gambar jika ada
            if ($request->hasFile('image_path')) {
                $imageName = time() . '_' . uniqid() . '.' . $request->file('image_path')->extension();
                $request->file('image_path')->move(public_path('storage/images'), $imageName);
                $validated['image_path'] = 'storage/images/' . $imageName;
            }

            $validated['admin_id'] = Auth::id();

            $event = Event::create($validated);

            return response()->json($event, 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error creating event', 'error' => $e->getMessage()], 500);
        }
    }


    // ✅ Update event (admin only)
    public function update(Request $request, $id)
    {
        try {
            \Log::info('Update event request received for ID: ' . $id);
            \Log::info('Request data:', $request->all());
            
            $event = Event::findOrFail($id);

            if (Auth::user()->id !== $event->admin_id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $validated = $request->validate([
                'title' => 'required|string',
                'description' => 'required|string',
                'provides_certificate' => 'boolean',
                'price' => 'nullable|numeric|min:0',
                'location' => 'required|string',
                'status' => 'required|in:active,ended',
                'max_participants' => 'required|integer|min:1',
                'start_datetime' => 'required|date',
                'end_datetime' => 'required|date|after_or_equal:start_datetime',
                'image_path' => 'nullable|image|mimes:jpeg,png,jpg|max:2048'
            ]);

            \Log::info('Validated data:', $validated);

            // Handle image upload if new image is provided
            if ($request->hasFile('image_path')) {
                \Log::info('Processing new image upload');
                    // Delete old image if exists
                if ($event->image_path && Storage::exists('public/' . str_replace('storage/', '', $event->image_path))) {
                    Storage::delete('public/' . str_replace('storage/', '', $event->image_path));
                    }

                    $imageName = time() . '_' . uniqid() . '.' . $request->file('image_path')->extension();
                    $request->file('image_path')->move(public_path('storage/images'), $imageName);
                    $validated['image_path'] = 'storage/images/' . $imageName;
            }

            // Convert provides_certificate to boolean
            $validated['provides_certificate'] = filter_var($validated['provides_certificate'] ?? false, FILTER_VALIDATE_BOOLEAN);

            // Convert dates to proper format
            if (isset($validated['start_datetime'])) {
                $validated['start_datetime'] = date('Y-m-d H:i:s', strtotime($validated['start_datetime']));
            }
            if (isset($validated['end_datetime'])) {
                $validated['end_datetime'] = date('Y-m-d H:i:s', strtotime($validated['end_datetime']));
            }

            \Log::info('Final data for update:', $validated);
            
            \DB::beginTransaction();
            try {
                $event->update($validated);
                \DB::commit();
                
                // Reload event to verify changes
                $event = Event::with('admin')->findOrFail($id);
                \Log::info('Updated event data:', $event->toArray());
                
                return response()->json($event);
            } catch (\Exception $e) {
                \DB::rollback();
                throw $e;
            }
        } catch (\Exception $e) {
            \Log::error('Error updating event: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json([
                'message' => 'Error updating event',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ✅ Hapus event (admin only)
    public function destroy($id)
    {
        try {
            \Log::info('Starting event deletion for ID: ' . $id);
            
            $event = Event::with('participants')->findOrFail($id);

            // Cek apakah user adalah admin dari event ini
            if (Auth::user()->id !== $event->admin_id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Hapus QR code untuk setiap participant
            foreach ($event->participants as $participant) {
                if ($participant->qr_code_path) {
                    $qrPath = str_replace('storage/', 'public/', $participant->qr_code_path);
                    if (Storage::exists($qrPath)) {
                        Storage::delete($qrPath);
                        \Log::info('Deleted QR code: ' . $qrPath);
                    }
                }
            }

            // Hapus gambar event jika ada
            if ($event->image_path && Storage::exists('public/' . str_replace('storage/', '', $event->image_path))) {
                Storage::delete('public/' . str_replace('storage/', '', $event->image_path));
                \Log::info('Deleted event image: ' . $event->image_path);
            }

            // Hapus event (akan menghapus participants dan payments karena cascade)
            $event->delete();
            \Log::info('Event deleted successfully');

            return response()->json(['message' => 'Event berhasil dihapus']);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Event tidak ditemukan'], 404);
        } catch (\Exception $e) {
            \Log::error('Error in event deletion: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json([
                'message' => 'Terjadi kesalahan saat menghapus event',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function register(Request $request, $event)
    {
        try {
            \Log::info('Starting event registration for event ID: ' . $event);
            
            $event = Event::findOrFail($event);
            \Log::info('Event found: ' . $event->title);
            
            $user = Auth::user();
            \Log::info('User authenticated: ' . $user->name);

            // Validate incoming request for responses
            $request->validate([
                'responses' => 'array',
                'responses.*.field_id' => 'required|exists:form_fields,id',
                'responses.*.value' => 'nullable|string',
            ]);

            // Cek apakah event masih aktif
            if ($event->status !== 'active') {
                \Log::info('Event not active');
                return response()->json(['message' => 'Event is not active'], 400);
            }

            // Cek apakah masih ada slot tersedia
            if ($event->max_participants !== null) {
                $currentParticipants = $event->participants()->count();
                \Log::info('Current participants: ' . $currentParticipants . ' of ' . $event->max_participants);
                if ($currentParticipants >= $event->max_participants) {
                    return response()->json(['message' => 'Event is full'], 400);
                }
            }

            // Cek apakah user sudah terdaftar
            $alreadyRegistered = $event->participants()->where('user_id', $user->id)->exists();
            \Log::info('Already registered: ' . ($alreadyRegistered ? 'yes' : 'no'));
            if ($alreadyRegistered) {
                return response()->json(['message' => 'Already registered for this event'], 409);
            }

            // Generate QR code dengan data unik
            \Log::info('Generating QR code');
            $qrData = 'QR_' . Str::uuid();
            $qrPath = 'public/qrcodes/' . $qrData . '.png';

            // Setup QR code generator
            $generator = QrCode::format('png');
            $generator->size(300);
            $generator->backgroundColor(255,255,255);
            $generator->color(0,0,0);
            
            // Generate dan simpan QR code
            \Log::info('Saving QR code to: ' . $qrPath);
            $qrImage = $generator->generate($qrData);
            Storage::put($qrPath, $qrImage);

            // Buat registrasi participant
            \Log::info('Creating participant record');
            $participant = Participant::create([
                'user_id' => $user->id,
                'event_id' => $event->id,
                'qr_code_data' => $qrData,
                'qr_code_path' => str_replace('public/', 'storage/', $qrPath),
                'attendance_status' => 'registered',
                'payment_status' => 'belum_bayar'
            ]);

            // Simpan jawaban form jika ada
            if ($request->has('responses') && is_array($request->responses)) {
                foreach ($request->responses as $formResponseData) {
                    FormResponse::create([
                        'participant_id' => $participant->id,
                        'form_field_id' => $formResponseData['field_id'],
                        'value' => $formResponseData['value'] ?? null,
                    ]);
                }
                \Log::info('Form responses saved for participant: ' . $participant->id);
            }

            \Log::info('Registration successful');
            return response()->json([
                'message' => 'Successfully registered for event',
                'participant' => $participant
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Error in event registration: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json(['message' => 'Error registering for event', 'error' => $e->getMessage()], 500);
        }
    }

    public function checkRegistration(Event $event)
    {
        $isRegistered = $event->participants()->where('user_id', auth()->id())->exists();
        return response()->json(['registered' => $isRegistered]);
    }

    public function simulatePayment(Event $event)
    {
        try {
            \Log::info('Starting payment simulation', [
                'event_id' => $event->id,
                'user_id' => auth()->id()
            ]);

            // Cari pendaftaran peserta
            $participant = $event->participants()
                ->where('user_id', auth()->id())
                ->first();

            \Log::info('Found participant', [
                'participant_id' => $participant ? $participant->id : null,
                'current_payment_status' => $participant ? $participant->payment_status : null
            ]);

            if (!$participant) {
                return response()->json([
                    'message' => 'Anda belum terdaftar di event ini'
                ], 404);
            }

            // Update status pembayaran
            $participant->payment_status = 'paid';
            $participant->save();

            \Log::info('Payment status updated', [
                'participant_id' => $participant->id,
                'new_payment_status' => $participant->payment_status
            ]);

            // Verifikasi perubahan
            $updatedParticipant = $event->participants()
                ->where('user_id', auth()->id())
                ->first();

            \Log::info('Verified payment status', [
                'participant_id' => $updatedParticipant->id,
                'verified_payment_status' => $updatedParticipant->payment_status
            ]);

            return response()->json([
                'message' => 'Pembayaran berhasil diproses',
                'payment_status' => $updatedParticipant->payment_status
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in payment simulation', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Gagal memproses pembayaran',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getRegisteredEvents()
    {
        try {
            $user = auth()->user();
            $registeredEvents = Event::join('participants', 'events.id', '=', 'participants.event_id')
                ->where('participants.user_id', $user->id)
                ->select(
                    'events.*',
                    'participants.created_at as registration_date',
                    'participants.payment_status',
                    'participants.id as participant_id'
                )
                ->get()
                ->map(function ($event) {
                    return [
                        'id' => $event->id,
                        'title' => $event->title,
                        'description' => $event->description,
                        'location' => $event->location,
                        'start_datetime' => $event->start_datetime,
                        'end_datetime' => $event->end_datetime,
                        'image_path' => $event->image_path,
                        'max_participants' => $event->max_participants,
                        'registered_participants' => $event->registered_participants,
                        'registration_date' => $event->registration_date,
                        'payment_status' => $event->payment_status,
                        'participant_id' => $event->participant_id
                    ];
                });

            return response()->json($registeredEvents);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching registered events',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function cancelRegistration($id)
    {
        try {
            Log::info('Starting registration cancellation', [
                'event_id' => $id,
                'user_id' => auth()->id()
            ]);

            $user = auth()->user();
            Log::info('User authenticated', [
                'user_id' => $user->id,
                'name' => $user->name
            ]);

            // Find the registration
            $registration = Participant::where('user_id', $user->id)
                ->where('event_id', $id)
                ->first();

            Log::info('Registration found', [
                'registration' => $registration ? $registration->toArray() : null
            ]);

            if (!$registration) {
                Log::warning('Registration not found', [
                    'event_id' => $id,
                    'user_id' => $user->id
                ]);
                return response()->json([
                    'message' => 'Registrasi tidak ditemukan'
                ], 404);
            }

            // Check if already paid
            if ($registration->payment && $registration->payment->status === 'paid') {
                Log::warning('Cannot cancel paid registration', [
                    'registration_id' => $registration->id,
                    'payment_status' => $registration->payment->status
                ]);
                return response()->json([
                    'message' => 'Tidak dapat membatalkan registrasi yang sudah dibayar'
                ], 400);
            }

            // Delete payment if exists
            if ($registration->payment) {
                Log::info('Deleting payment', [
                    'payment_id' => $registration->payment->id
                ]);
                $registration->payment->delete();
            }

            // Delete QR code if exists
            if ($registration->qr_code_path) {
                Log::info('Attempting to delete QR code', [
                    'qr_path' => $registration->qr_code_path
                ]);
                $qrPath = 'public/' . $registration->qr_code_path;
                if (Storage::exists($qrPath)) {
                    Storage::delete($qrPath);
                    Log::info('QR code deleted successfully');
                } else {
                    Log::warning('QR code file not found', [
                        'qr_path' => $qrPath
                    ]);
                }
            }

            // Delete registration
            $registration->delete();
            Log::info('Registration cancelled successfully', [
                'registration_id' => $registration->id
            ]);

            return response()->json([
                'message' => 'Registrasi berhasil dibatalkan'
            ]);
        } catch (\Exception $e) {
            Log::error('Error in cancelRegistration', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'event_id' => $id,
                'user_id' => auth()->id()
            ]);
            return response()->json([
                'message' => 'Terjadi kesalahan saat membatalkan registrasi: ' . $e->getMessage()
            ], 500);
        }
    }

    public function unregister($event)
    {
        try {
            \Log::info('Starting event unregistration for event ID: ' . $event);
            
            $user = Auth::user();
            \Log::info('User authenticated: ' . $user->name);

            // Cari participant record
            $participant = Participant::where('event_id', $event)
                ->where('user_id', $user->id)
                ->first();

            if (!$participant) {
                return response()->json(['message' => 'You are not registered for this event'], 404);
            }

            // Hapus QR code jika ada
            if ($participant->qr_code_path) {
                $qrPath = str_replace('storage/', 'public/', $participant->qr_code_path);
                if (Storage::exists($qrPath)) {
                    Storage::delete($qrPath);
                    \Log::info('Deleted QR code: ' . $qrPath);
                }
            }

            // Hapus participant record
            $participant->delete();
            \Log::info('Successfully unregistered from event');

            return response()->json(['message' => 'Successfully unregistered from event']);
        } catch (\Exception $e) {
            \Log::error('Error in event unregistration: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json(['message' => 'Error unregistering from event', 'error' => $e->getMessage()], 500);
        }
    }

    public function getStatistics($id)
    {
        try {
            \Log::info('Getting statistics for event ID: ' . $id);
            
            $event = Event::findOrFail($id);
            
            // Get total registered participants
            $registeredParticipants = Participant::where('event_id', $id)->count();
            \Log::info('Total registered participants: ' . $registeredParticipants);
            
            // Get attendance counts using raw SQL to ensure proper quoting
            $presentCount = \DB::table('participants')
                ->where('event_id', $id)
                ->where('attendance_status', '=', 'present')
                ->count();
            \Log::info('Present count: ' . $presentCount);
                
            $absentCount = \DB::table('participants')
                ->where('event_id', $id)
                ->where('attendance_status', '=', 'absent')
                ->count();
            \Log::info('Absent count: ' . $absentCount);
                
            $pendingCount = \DB::table('participants')
                ->where('event_id', $id)
                ->where('attendance_status', '=', 'registered')
                ->count();
            \Log::info('Pending count: ' . $pendingCount);

            $response = [
                'registered_participants' => $registeredParticipants,
                'max_participants' => $event->max_participants,
                'present_count' => $presentCount,
                'absent_count' => $absentCount,
                'pending_count' => $pendingCount
            ];
            
            \Log::info('Statistics response:', $response);
            return response()->json($response);
        } catch (\Exception $e) {
            \Log::error('Error getting event statistics: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json([
                'message' => 'Error getting event statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getRandomEvents()
    {
        try {
            \Log::info('Fetching random events');
            
            // Gunakan query builder dengan inRandomOrder
            $randomEvents = Event::select([
                'id',
                'title',
                'description',
                'image_path',
                'location',
                'price',
                'start_datetime',
                'end_datetime',
                'max_participants',
                'status'
            ])
            ->where('status', 'active')
            ->inRandomOrder()
            ->limit(3)
            ->get();

            \Log::info('Found ' . $randomEvents->count() . ' random events');

            return response()->json($randomEvents);
        } catch (\Exception $e) {
            \Log::error('Error in getRandomEvents: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            
            return response()->json([
                'message' => 'Error fetching random events',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
