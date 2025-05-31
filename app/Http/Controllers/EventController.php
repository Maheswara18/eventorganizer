<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Participant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Facades\DB;

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
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    // ✅ Hapus event (admin only)
    public function destroy($id)
    {
        try {
            \Log::info('Delete event request received for ID: ' . $id);
            
            $event = Event::findOrFail($id);
            \Log::info('Event found:', $event->toArray());

            if (Auth::user()->id !== $event->admin_id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Gunakan transaction untuk memastikan semua operasi berhasil
            DB::beginTransaction();
            try {
                // Hapus gambar jika ada
                if ($event->image_path) {
                    $imagePath = str_replace('storage/', '', $event->image_path);
                    if (Storage::exists('public/' . $imagePath)) {
                        Storage::delete('public/' . $imagePath);
                    }
                }

                // Hapus data terkait
                $event->participants()->delete();
                $event->payments()->delete();
                $event->certificates()->delete();
                
                // Hapus event
                $event->delete();
                
                DB::commit();
                return response()->json(['message' => 'Event deleted successfully']);
            } catch (\Exception $e) {
                DB::rollback();
                throw $e;
            }
        } catch (\Exception $e) {
            \Log::error('Error deleting event: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json([
                'message' => 'Error deleting event',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    public function register($event)
    {
        try {
            \Log::info('Starting event registration for event ID: ' . $event);
            
            $event = Event::findOrFail($event);
            \Log::info('Event found: ' . $event->title);
            
            $user = Auth::user();
            \Log::info('User authenticated: ' . $user->name);

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
                'attendance_status' => 'registered'
            ]);

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

    public function checkRegistration($eventId)
    {
        try {
            $user = Auth::user();
            $isRegistered = Participant::where('user_id', $user->id)
                ->where('event_id', $eventId)
                ->exists();

            return response()->json(['registered' => $isRegistered]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error checking registration', 'error' => $e->getMessage()], 500);
        }
    }

    public function getRegisteredEvents()
    {
        try {
            $user = Auth::user();
            $registeredEvents = Event::whereHas('participants', function($query) use ($user) {
                $query->where('user_id', $user->id);
            })->get();

            return response()->json($registeredEvents);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error fetching registered events', 'error' => $e->getMessage()], 500);
        }
    }
}
