<?php

namespace App\Jobs;

use App\Models\Event;
use App\Models\Participant;
use App\Models\FormResponse;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class ProcessEventRegistrationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $user;
    protected $event;
    protected $responses;

    public function __construct($user, $event, $responses = [])
    {
        $this->user = $user;
        $this->event = $event;
        $this->responses = $responses;
    }

    public function handle()
    {
        // Hapus proses generate QR code, hanya buat participant tanpa qr_code_data dan qr_code_path
        $participant = Participant::create([
            'user_id' => $this->user->id,
            'event_id' => $this->event->id,
            'attendance_status' => 'registered',
            'payment_status' => 'belum_bayar'
        ]);

        // Simpan jawaban form jika ada
        if (is_array($this->responses)) {
            foreach ($this->responses as $formResponseData) {
                FormResponse::create([
                    'participant_id' => $participant->id,
                    'form_field_id' => $formResponseData['field_id'],
                    'value' => $formResponseData['value'] ?? null,
                ]);
            }
        }
    }
}
