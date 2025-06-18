<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Certificate;

class CertificateGenerated extends Notification implements ShouldQueue
{
    use Queueable;

    protected $certificate;

    public function __construct(Certificate $certificate)
    {
        $this->certificate = $certificate;
    }

    public function via($notifiable)
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable)
    {
        $event = $this->certificate->event;
        $downloadUrl = url('/certificates/' . $this->certificate->id . '/download');

        return (new MailMessage)
            ->subject('Sertifikat Anda Siap Diunduh')
            ->greeting('Selamat!')
            ->line('Sertifikat Anda untuk acara "' . $event->title . '" telah siap.')
            ->line('Anda dapat mengunduh sertifikat Anda melalui tombol di bawah ini.')
            ->action('Unduh Sertifikat', $downloadUrl)
            ->line('Terima kasih telah berpartisipasi dalam acara kami!');
    }

    public function toArray($notifiable)
    {
        return [
            'certificate_id' => $this->certificate->id,
            'event_title' => $this->certificate->event->title,
            'message' => 'Sertifikat Anda untuk acara "' . $this->certificate->event->title . '" telah siap diunduh.',
            'download_url' => url('/certificates/' . $this->certificate->id . '/download')
        ];
    }
} 