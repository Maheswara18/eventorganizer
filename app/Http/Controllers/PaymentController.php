<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class PaymentController extends Controller
{
    // ✅ List semua pembayaran (admin lihat semua, user hanya miliknya)
    public function index()
    {
        if (Auth::user()->role === 'admin') {
            return response()->json(Payment::with(['user', 'event'])->get());
        }

        return response()->json(
            Payment::with('event')
                ->where('user_id', Auth::id())
                ->get()
        );
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
        if (Auth::user()->role !== 'participant') {
            return response()->json(['message' => 'Only participants can make payment'], 403);
        }

        $validated = $request->validate([
            'event_id' => 'required|exists:events,id',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|in:transfer,credit_card,e_wallet',
            'payment_proof' => 'required|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        // Simpan file bukti pembayaran
        $path = $request->file('payment_proof')->store('public/payment_proofs');
        $publicPath = str_replace('public/', 'storage/', $path);

        $payment = Payment::create([
            'user_id' => Auth::id(),
            'event_id' => $validated['event_id'],
            'amount' => $validated['amount'],
            'payment_method' => $validated['payment_method'],
            'payment_status' => 'pending',
            'payment_proof_path' => $publicPath,
            'transaction_id' => uniqid('TRX_'),
            'paid_at' => now()
        ]);

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
}
