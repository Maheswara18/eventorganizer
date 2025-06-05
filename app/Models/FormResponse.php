<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class FormResponse extends Model
{
    use HasFactory;

    protected $fillable = [
        'participant_id',
        'form_field_id',
        'value'
    ];

    public function participant()
    {
        return $this->belongsTo(Participant::class);
    }

    public function field()
    {
        return $this->belongsTo(FormField::class, 'form_field_id');
    }
} 