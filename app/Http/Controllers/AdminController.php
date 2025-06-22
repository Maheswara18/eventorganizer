<?php

namespace App\Http\Controllers;

use App\Models\Participant;
use App\Models\Event;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AdminController extends Controller
{
    /**
     * Scan QR Code untuk mencatat kehadiran peserta
     * Format QR: participant-{participantId}-{eventId}
     */
    public function scanQr(Request $request)
    {
        try {
            $request->validate([
                'qr_code_data' => 'required|string'
            ]);

            Log::info('QR Scan attempt with data: ' . $request->qr_code_data);

            // Parse QR code data
            $qrData = $request->qr_code_data;
            $parts = explode('-', $qrData);
            
            if (count($parts) !== 3 || $parts[0] !== 'participant') {
                return response()->json([
                    'success' => false,
                    'message' => 'Format QR code tidak valid'
                ], 400);
            }

            $participantId = $parts[1];
            $eventId = $parts[2];

            // Cari participant berdasarkan ID dan event
            $participant = Participant::with(['user', 'event'])
                ->where('id', $participantId)
                ->where('event_id', $eventId)
                ->first();

            if (!$participant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Peserta tidak ditemukan untuk event ini'
                ], 404);
            }

            // Cek apakah sudah hadir
            if ($participant->attendance_status === 'present') {
                return response()->json([
                    'success' => false,
                    'message' => 'Peserta sudah hadir sebelumnya',
                    'participant' => [
                        'id' => $participant->id,
                        'name' => $participant->user->name,
                        'email' => $participant->user->email,
                        'event_title' => $participant->event->title,
                        'attendance_status' => $participant->attendance_status,
                        'registration_date' => $participant->created_at
                    ]
                ], 409);
            }

            // Update status kehadiran
            $participant->attendance_status = 'present';
            $participant->attendance_updated_at = now();
            $participant->save();

            Log::info('Attendance recorded for participant: ' . $participant->id);

            return response()->json([
                'success' => true,
                'message' => 'Kehadiran berhasil dicatat',
                'participant' => [
                    'id' => $participant->id,
                    'name' => $participant->user->name,
                    'email' => $participant->user->email,
                    'event_title' => $participant->event->title,
                    'attendance_status' => $participant->attendance_status,
                    'registration_date' => $participant->created_at,
                    'attendance_updated_at' => $participant->attendance_updated_at
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error in QR scan: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat memproses QR code'
            ], 500);
        }
    }

    /**
     * Get participant details by QR code data
     */
    public function getParticipantByQr(Request $request)
    {
        try {
            $request->validate([
                'qr_code_data' => 'required|string'
            ]);

            $qrData = $request->qr_code_data;
            $parts = explode('-', $qrData);
            
            if (count($parts) !== 3 || $parts[0] !== 'participant') {
                return response()->json([
                    'success' => false,
                    'message' => 'Format QR code tidak valid'
                ], 400);
            }

            $participantId = $parts[1];
            $eventId = $parts[2];

            $participant = Participant::with(['user', 'event'])
                ->where('id', $participantId)
                ->where('event_id', $eventId)
                ->first();

            if (!$participant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Peserta tidak ditemukan'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'participant' => [
                    'id' => $participant->id,
                    'name' => $participant->user->name,
                    'email' => $participant->user->email,
                    'event_title' => $participant->event->title,
                    'attendance_status' => $participant->attendance_status,
                    'registration_date' => $participant->created_at,
                    'payment_status' => $participant->payment_status
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error getting participant by QR: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengambil data peserta'
            ], 500);
        }
    }
}

