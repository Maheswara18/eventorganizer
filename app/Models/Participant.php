<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Participant extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'event_id', 'payment_id',
        'registration_date', 'qr_code_path', 'qr_code_data', 'attendance_status', 'payment_status', 'attendance_updated_at'
    ];

    protected $with = ['formResponses.field'];

    protected $attributes = [
        'attendance_status' => 'registered',
        'payment_status' => 'belum_bayar'
    ];

    protected $casts = [
        'registration_date' => 'datetime',
        'attendance_updated_at' => 'datetime'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }

    public function certificate()
    {
        return $this->hasOne(Certificate::class);
    }

    public function formResponses()
    {
        return $this->hasMany(FormResponse::class);
    }

    public function updatePaymentStatus()
    {
        if ($this->payment) {
            $this->payment_status = $this->payment->payment_status;
            $this->status = $this->payment->payment_status;
            $this->payment_date = $this->payment->paid_at;
            $this->save();
        } else {
            $this->payment_status = 'belum_bayar';
            $this->save();
        }
    }
}
