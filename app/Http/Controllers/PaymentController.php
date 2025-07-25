<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Event;
use App\Models\User;
use App\Models\Participant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class PaymentController extends Controller
{
    public function adminIndex()
    {
        $payments = Payment::with(['user', 'event'])->get();
    
        return view('admin.payment', compact('payments'));
    }
    
    // ✅ List semua pembayaran (admin lihat semua, user hanya miliknya)
    public function index()
    {
        $payments = Payment::with(['user', 'event'])->get();
        return response()->json($payments);
    }

    public function getAdminPayments()
    {
        $payments = Payment::with(['user', 'event'])->orderBy('created_at', 'desc')->get();
        return response()->json($payments);
    }

    public function getEventPayments($eventId)
    {
        $payments = Payment::where('event_id', $eventId)
            ->with(['user'])
            ->get();
        return response()->json($payments);
    }

    public function getUserPayments($userId)
    {
        $payments = Payment::where('user_id', $userId)
            ->with(['event'])
            ->get();
        return response()->json($payments);
    }

    // ✅ Lihat detail 1 pembayaran
    public function show($id)
    {
        $payment = Payment::with(['user', 'event'])->findOrFail($id);

        if (Auth::user()->role !== 'admin' && $payment->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($payment);
    }

    // ✅ Buat pembayaran baru (participant)
    public function store(Request $request)
    {
        $request->validate([
            'event_id' => 'required|exists:events,id',
            'amount' => 'required|numeric',
            'payment_method' => 'required|in:transfer,credit_card,e_wallet',
            'payment_proof_path' => 'required|image|max:2048' // max 2MB
        ]);

        // Upload bukti pembayaran
        $paymentProofPath = null;
        if ($request->hasFile('payment_proof_path')) {
            $file = $request->file('payment_proof_path');
            $filename = time() . '_' . $file->getClientOriginalName();
            // Simpan langsung ke public/storage/payment_proofs
            $file->move(public_path('storage/payment_proofs'), $filename);
            $paymentProofPath = 'payment_proofs/' . $filename;
        }

        // Cek apakah participant sudah ada
        $participant = Participant::where('user_id', auth()->id())
            ->where('event_id', $request->event_id)
            ->first();

        if (!$participant) {
            return response()->json(['message' => 'Anda belum terdaftar di event ini'], 404);
        }

        // Cek status pembayaran sebelumnya
        if ($participant->payment_status !== 'belum_bayar') {
            return response()->json(['message' => 'Status pembayaran tidak valid'], 400);
        }

        $payment = new Payment();
        $payment->user_id = auth()->id();
        $payment->event_id = $request->event_id;
        $payment->amount = $request->amount;
        $payment->payment_method = $request->payment_method;
        $payment->payment_status = 'pending';
        $payment->payment_proof_path = $paymentProofPath;
        $payment->save();

        // Update participant payment_id and status
        $participant->payment_id = $payment->id;
        $participant->payment_status = 'pending';
        $participant->save();

        // Load the payment with relationships for response
        $payment = Payment::with(['user', 'event'])->find($payment->id);

        return response()->json($payment, 201);
    }

    // ✅ Update status pembayaran (admin only)
    public function update(Request $request, $id)
    {
        $payment = Payment::findOrFail($id);

        if (Auth::user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'payment_status' => 'required|in:pending,completed,failed'
        ]);

        $payment->update([
            'payment_status' => $validated['payment_status']
        ]);

        return response()->json($payment);
    }

    public function updateStatus(Request $request, $id)
    {
        $payment = Payment::findOrFail($id);
        
        $request->validate([
            'status' => 'required|in:pending,completed,failed'
        ]);

        $payment->payment_status = $request->status;
        
        if ($request->status === 'completed') {
            $payment->paid_at = now();
        }
        
        $payment->save();

        // Update participant status menggunakan method baru
        $participant = Participant::where('payment_id', $payment->id)->first();
        if ($participant) {
            $participant->updatePaymentStatus();
            // Tambahkan: generate QR code jika pembayaran completed dan participant belum punya QR
            if ($payment->payment_status === 'completed' && (empty($participant->qr_code_data) || empty($participant->qr_code_path))) {
                $qrData = "participant-{$participant->user_id}-{$participant->event_id}";
                $uuid = \Str::uuid();
                $qrPath = "public/qrcodes/participant-{$participant->user_id}-{$participant->event_id}-{$uuid}.png";
                $qrImage = \SimpleSoftwareIO\QrCode\Facades\QrCode::format('png')->size(300)->generate($qrData);
                \Storage::put($qrPath, $qrImage);
                $participant->qr_code_data = $qrData;
                $participant->qr_code_path = str_replace('public/', 'storage/', $qrPath);
                $participant->save();
            }
        }

        return response()->json([
            'message' => 'Status pembayaran berhasil diperbarui',
            'payment' => $payment->fresh(['user', 'event'])
        ]);
    }

    public function simulatePayment($eventId)
    {
        $event = Event::findOrFail($eventId);
        $user = Auth::user();

        $payment = new Payment();
        $payment->user_id = $user->id;
        $payment->event_id = $event->id;
        $payment->amount = $event->price;
        $payment->payment_method = 'transfer';
        $payment->payment_status = 'pending';
        $payment->save();

        return response()->json(['message' => 'Pembayaran berhasil disimulasikan']);
    }

    public function getRegisteredEvents()
    {
        $user = auth()->user();
        
        // Get all events the user is registered for through participants table
        $registeredEvents = $user->participants()
            ->with(['event', 'payment'])
            ->get()
            ->map(function ($participant) {
                $event = $participant->event;
                
                // Sync participant status with payment status if needed
                if ($participant->payment) {
                    $participant->updatePaymentStatus();
                }
                
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'price' => $event->price,
                    'start_datetime' => $event->start_datetime,
                    'image_path' => $event->image_path,
                    'payment_status' => $participant->payment_status,
                    'registration_date' => $participant->payment ? $participant->payment->paid_at : $participant->registration_date,
                    'payment_proof_path' => $participant->payment ? $participant->payment->payment_proof_path : null
                ];
            });

        return response()->json($registeredEvents);
    }
}
