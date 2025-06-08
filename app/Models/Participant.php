<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Participant extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'event_id', 'payment_id',
        'registration_date', 'qr_code_path', 'qr_code_data', 'attendance_status'
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
}
