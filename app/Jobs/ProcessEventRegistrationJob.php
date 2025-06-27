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
        $qrData = "participant-{$this->user->id}-{$this->event->id}";
        $uuid = \Str::uuid();
        $qrPath = "public/qrcodes/participant-{$this->user->id}-{$this->event->id}-{$uuid}.png";
        $qrImage = QrCode::format('png')->size(300)->generate($qrData);
        Storage::put($qrPath, $qrImage);

        $participant = Participant::create([
            'user_id' => $this->user->id,
            'event_id' => $this->event->id,
            'qr_code_data' => $qrData,
            'qr_code_path' => str_replace('public/', 'storage/', $qrPath),
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
