<?php

namespace App\Helpers;

class ParticipantHelper
{
    public static function getPaymentStatusText($status)
    {
        return match ($status) {
            'unpaid' => 'Belum Bayar',
            'paid' => 'Sudah Bayar',
            'completed' => 'Selesai',
            default => 'Tidak Diketahui',
        };
    }

    public static function getPaymentStatusColor($status)
    {
        return match ($status) {
            'unpaid' => 'danger',
            'paid' => 'primary',
            'completed' => 'success',
            default => 'secondary',
        };
    }

    public static function getStatusColor($status)
    {
        return match ($status) {
            'present' => 'success',
            'absent' => 'danger',
            'registered' => 'warning',
            default => 'secondary',
        };
    }
}
