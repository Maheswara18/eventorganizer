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
use App\Models\FormTemplate;
use App\Models\FormField;
use Illuminate\Support\Facades\Validator;
use App\Jobs\ProcessEventRegistrationJob;
use App\Jobs\CancelEventRegistrationJob;
use App\Services\ImageOptimizationService;

class EventController extends Controller
{
    // ✅ List semua event
    public function index()
    {
        try {
            $events = Event::with(['admin', 'participants', 'payments', 'certificates', 'formTemplate'])->get();
            return response()->json($events);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error fetching events', 'error' => $e->getMessage()], 500);
        }
    }

    public function showStatistics()
    {
        // Ambil statistik umum untuk semua event
        $dashboardStats = [
            'totalEvents' => Event::count(),
            'totalParticipants' => Participant::count(),
            'pendingPayments' => Participant::where('payment_status', 'pending')->count(),
        ];

        // Data chart (dummy, bisa diubah sesuai kebutuhan)
        $registrationChartData = [
            'labels' => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            'datasets' => [[
                'label' => 'Pendaftaran',
                'data' => [100, 120, 90, 140, 130, 110],
                'backgroundColor' => 'rgba(54, 162, 235, 0.6)',
            ]]
        ];

        $revenueChartData = [
            'labels' => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            'datasets' => [[
                'label' => 'Pendapatan (Rp)',
                'data' => [1200000, 900000, 1500000, 1000000, 1700000, 800000],
                'backgroundColor' => 'rgba(255, 206, 86, 0.6)',
            ]]
        ];

        // Aktivitas terakhir (opsional dummy)
        $recentActivities = [
            [
                'icon' => 'fa-user-plus',
                'title' => 'Peserta Baru Terdaftar',
                'description' => 'Rizky mendaftar pada event Laravel Workshop',
                'time' => '2 jam yang lalu',
                'color' => 'info'
            ],
            [
                'icon' => 'fa-credit-card',
                'title' => 'Pembayaran Berhasil',
                'description' => 'Pembayaran untuk event VueJS telah dikonfirmasi',
                'time' => '5 jam yang lalu',
                'color' => 'success'
            ]
        ];

        return view('admin.statistics', compact(
            'dashboardStats',
            'registrationChartData',
            'revenueChartData',
            'recentActivities'
        ));
    }


    public function qr()
    {
        return view('admin.qr');
    }


    public function create()
    {
        return view('admin.createEvent'); // Sesuaikan dengan nama view kamu
    }

    public function storeWithForm(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'location' => 'required|string',
            'date' => 'required|date',
            'form.name' => 'required|string|max:255',
            'form.description' => 'nullable|string',
            'form.fields' => 'required|array|min:1',
            'form.fields.*.label' => 'required|string|max:255',
            'form.fields.*.type' => 'required|string|in:text,number,email,select,radio,checkbox',
            'form.fields.*.options' => 'required_if:form.fields.*.type,select,radio,checkbox|array',
            'form.fields.*.is_required' => 'required|boolean',
            'form.fields.*.order' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();

            // Simpan event
            $event = Event::create([
                'title' => $request->title,
                'location' => $request->location,
                'date' => $request->date,
            ]);

            // Simpan form template
            $form = FormTemplate::create([
                'event_id' => $event->id,
                'name' => $request->form['name'],
                'description' => $request->form['description'],
            ]);

            foreach ($request->form['fields'] as $field) {
                FormField::create([
                    'form_template_id' => $form->id,
                    'label' => $field['label'],
                    'type' => $field['type'],
                    'options' => $field['options'] ?? null,
                    'is_required' => $field['is_required'],
                    'order' => $field['order'],
                ]);
            }

            DB::commit();
            return redirect()->route('admin.dashboard')->with('success', 'Event dan form berhasil dibuat.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Gagal menyimpan data: ' . $e->getMessage());
        }
    }



    // ✅ Detail satu event
    public function show($id)
    {
        try {
            $event = Event::with(['admin', 'participants', 'payments', 'certificates', 'formTemplate'])->findOrFail($id);
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

            // Optimasi upload gambar jika ada
            if ($request->hasFile('image_path')) {
                $imageService = new ImageOptimizationService();
                $optimizedPath = $imageService->optimize($request->file('image_path'), 'images');
                $validated['image_path'] = 'storage/' . $optimizedPath;
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

            // Optimasi upload gambar jika ada
            if ($request->hasFile('image_path')) {
                // Hapus gambar lama jika ada
                if ($event->image_path && \Storage::exists('public/' . str_replace('storage/', '', $event->image_path))) {
                    \Storage::delete('public/' . str_replace('storage/', '', $event->image_path));
                }
                $imageService = new ImageOptimizationService();
                $optimizedPath = $imageService->optimize($request->file('image_path'), 'images');
                $validated['image_path'] = 'storage/' . $optimizedPath;
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
            $event = Event::findOrFail($event);
            $user = Auth::user();
            $request->validate([
                'responses' => 'array',
                'responses.*.field_id' => 'required|exists:form_fields,id',
                'responses.*.value' => 'nullable|string',
            ]);
            if ($event->status !== 'active') {
                return response()->json(['message' => 'Event is not active'], 400);
            }
            if ($event->max_participants !== null) {
                $currentParticipants = $event->participants()->count();
                if ($currentParticipants >= $event->max_participants) {
                    return response()->json(['message' => 'Event is full'], 400);
                }
            }
            $alreadyRegistered = $event->participants()->where('user_id', $user->id)->exists();
            if ($alreadyRegistered) {
                return response()->json(['message' => 'Already registered for this event'], 409);
            }
            // Dispatch job ke queue
            ProcessEventRegistrationJob::dispatch($user, $event, $request->responses ?? []);
            return response()->json(['message' => 'Pendaftaran sedang diproses, silakan cek beberapa saat lagi.'], 202);
        } catch (\Exception $e) {
            \Log::error('Error in event registration: ' . $e->getMessage());
            return response()->json(['message' => 'Error registering for event', 'error' => $e->getMessage()], 500);
        }
    }

    public function checkRegistration(Event $event)
    {
        \Log::info('Check registration', [
            'user_id' => auth()->id(),
            'event_id' => $event->id,
            'found' => $event->participants()->where('user_id', auth()->id())->exists()
        ]);
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
            $user = auth()->user();
            $registration = Participant::where('user_id', $user->id)
                ->where('event_id', $id)
                ->first();

            if (!$registration) {
                return response()->json(['message' => 'Registrasi tidak ditemukan'], 404);
            }
            if ($registration->payment && $registration->payment->status === 'paid') {
                return response()->json(['message' => 'Tidak dapat membatalkan registrasi yang sudah dibayar'], 400);
            }
            // Dispatch job ke queue
            CancelEventRegistrationJob::dispatch($registration->id);
            return response()->json(['message' => 'Pembatalan sedang diproses, silakan cek beberapa saat lagi.'], 202);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Terjadi kesalahan saat membatalkan registrasi: ' . $e->getMessage()], 500);
        }
    }

    public function unregister($event)
    {
        try {
            $user = Auth::user();
            $participant = Participant::where('event_id', $event)
                ->where('user_id', $user->id)
                ->first();
            if (!$participant) {
                return response()->json(['message' => 'You are not registered for this event'], 404);
            }
            // Dispatch job ke queue
            CancelEventRegistrationJob::dispatch($participant->id);
            return response()->json(['message' => 'Pembatalan sedang diproses, silakan cek beberapa saat lagi.'], 202);
        } catch (\Exception $e) {
            \Log::error('Error in event unregistration: ' . $e->getMessage());
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
