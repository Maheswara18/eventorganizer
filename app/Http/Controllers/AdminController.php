<?php

namespace App\Http\Controllers;

use App\Models\Participant;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function scanQr(Request $request)
    {
        $request->validate([
            'qr_code_data' => 'required'
        ]);

        $participant = Participant::where('qr_code_data', $request->qr_code_data)->first();

        if (!$participant) {
            return response()->json(['message' => 'QR Code tidak ditemukan'], 404);
        }

        $participant->attendance_status = 'present';
        $participant->save();

        return response()->json(['message' => 'Absensi berhasil']);
    }
}

