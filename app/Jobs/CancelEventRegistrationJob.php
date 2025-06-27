<?php

namespace App\Jobs;

use App\Models\Participant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class CancelEventRegistrationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $participantId;

    /**
     * Create a new job instance.
     */
    public function __construct($participantId)
    {
        $this->participantId = $participantId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $participant = Participant::find($this->participantId);
        if (!$participant) return;

        // Hapus QR code jika ada
        if ($participant->qr_code_path) {
            $qrPath = str_replace('storage/', 'public/', $participant->qr_code_path);
            if (Storage::exists($qrPath)) {
                Storage::delete($qrPath);
            }
        }

        // Hapus payment jika ada
        if ($participant->payment) {
            $participant->payment->delete();
        }

        // Hapus participant
        $participant->delete();
    }
}
