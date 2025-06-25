<?php
// NOTE: Observer ini memastikan sertifikat otomatis dibuat setiap kali status peserta menjadi 'present', tidak peduli dari endpoint manapun.
namespace App\Observers;

use App\Models\Participant;
use App\Models\Certificate;
use App\Models\CertificateTemplate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class ParticipantObserver
{
    public function updated(Participant $participant)
    {
        // Jika status kehadiran berubah ke 'present' dan event menyediakan sertifikat
        if ($participant->isDirty('attendance_status') && $participant->attendance_status === 'present') {
            $event = $participant->event;
            if ($event && $event->provides_certificate) {
                // Cek apakah sudah ada sertifikat
                $existing = Certificate::where('participant_id', $participant->id)
                    ->where('event_id', $event->id)
                    ->first();
                if (!$existing) {
                    // Ambil template default
                    $template = CertificateTemplate::where('is_default', 1)->first();
                    if ($template) {
                        // --- Logic generate file sertifikat (PDF) ---
                        $participantName = $participant->user->name ?? 'Peserta Tidak Dikenal';
                        $eventTitle = $event->title ?? 'Event Tidak Dikenal';
                        $code = strtoupper(Str::random(10));
                        $verificationLink = url('/certificates/verify?code=' . $code);
                        $qrCodeBase64 = base64_encode(QrCode::format('png')->size(100)->errorCorrection('H')->generate($verificationLink));
                        $html = "
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <meta charset=\"utf-8\">
                                <title>Sertifikat Partisipasi</title>
                                <style>
                                    @page { margin: 0; }
                                    body { font-family: 'Arial', sans-serif; text-align: center; margin: 0; padding: 0; background-color: #ffffff; }
                                    .certificate-container { width: 297mm; height: 210mm; margin: 0; padding: 0; position: relative; overflow: hidden; }
                                    .content { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80%; }
                                    h1 { color: #003366; font-size: 2.5em; margin-bottom: 20px; font-weight: bold; }
                                    p { font-size: 1.2em; margin-bottom: 10px; line-height: 1.5; }
                                    .name { font-size: 2.2em; font-weight: bold; margin: 30px 0; color: #333; text-transform: uppercase; }
                                    .event-title { font-size: 1.8em; color: #555; margin-bottom: 30px; font-style: italic; }
                                    .verification-code { margin-top: 40px; font-size: 1em; color: #777; font-family: monospace; }
                                    .qr-code-img { margin-top: 20px; width: 100px; height: 100px; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges; }
                                </style>
                            </head>
                            <body>
                                <div class=\"certificate-container\">
                                    <div class=\"content\">
                                        <h1>Sertifikat Partisipasi</h1>
                                        <p>Diberikan kepada:</p>
                                        <p class=\"name\">{$participantName}</p>
                                        <p>Atas partisipasinya dalam acara:</p>
                                        <p class=\"event-title\">\"{$eventTitle}\"</p>
                                        <div class=\"verification-code\">Kode Verifikasi: {$code}</div>
                                        <img class=\"qr-code-img\" src=\"data:image/png;base64,{$qrCodeBase64}\" alt=\"QR Code Verifikasi\">
                                        <p>Pindai untuk Verifikasi</p>
                                    </div>
                                </div>
                            </body>
                            </html>
                        ";
                        try {
                            $pdf = Pdf::loadHtml($html)
                                ->setPaper('A4', 'landscape')
                                ->setOptions([
                                    'isHtml5ParserEnabled' => true,
                                    'isRemoteEnabled' => true,
                                    'dpi' => 300,
                                    'defaultFont' => 'Arial'
                                ]);
                            $filename = 'certificates/' . $code . '.pdf';
                            Storage::put('public/' . $filename, $pdf->output());
                            $certificate = Certificate::create([
                                'participant_id' => $participant->id,
                                'event_id' => $event->id,
                                'certificate_path' => 'storage/' . $filename,
                                'verification_code' => $code,
                                'issued_at' => now(),
                            ]);
                            Log::info('DEBUG: Sertifikat otomatis dibuat oleh observer', [
                                'participant_id' => $participant->id,
                                'event_id' => $event->id,
                                'certificate_id' => $certificate->id
                            ]);
                        } catch (\Exception $e) {
                            Log::error('Certificate generation failed in observer: ' . $e->getMessage());
                        }
                    } else {
                        Log::warning('Tidak ada template sertifikat default saat generate otomatis');
                    }
                }
            }
        }
    }
} 