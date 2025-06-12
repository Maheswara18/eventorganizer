<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CertificateTemplate extends Model
{
    protected $fillable = [
        'name',
        'elements',
        'is_default'
    ];

    protected $casts = [
        'elements' => 'array',
        'is_default' => 'boolean'
    ];
} 