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
            'payment_proof' => 'required|image|max:2048' // max 2MB
        ]);

        // Upload bukti pembayaran
        $paymentProofPath = null;
        if ($request->hasFile('payment_proof')) {
            $file = $request->file('payment_proof');
            $paymentProofPath = $file->store('payment_proofs', 'public');
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
        $participant = Participant::where('user_id', auth()->id())
            ->where('event_id', $request->event_id)
            ->first();

        if ($participant) {
            $participant->payment_id = $payment->id;
            $participant->save();
            $participant->updatePaymentStatus();
        }

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
                    'payment_status' => $participant->payment ? $participant->payment->payment_status : 'pending',
                    'registration_date' => $participant->payment ? $participant->payment->paid_at : $participant->registration_date,
                    'payment_proof_path' => $participant->payment ? $participant->payment->payment_proof_path : null
                ];
            });

        return response()->json($registeredEvents);
    }
}
