<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class FormField extends Model
{
    use HasFactory;

    protected $fillable = [
        'form_template_id',
        'label',
        'type',
        'options',
        'is_required',
        'order'
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'options' => 'array'
    ];

    public function template()
    {
        return $this->belongsTo(FormTemplate::class, 'form_template_id');
    }

    public function responses()
    {
        return $this->hasMany(FormResponse::class);
    }
} 