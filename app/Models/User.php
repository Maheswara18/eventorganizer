<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = ['name', 'email', 'password', 'role'];

    protected $hidden = ['password'];

    public function events()
    {
        return $this->hasMany(Event::class, 'admin_id');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function participants()
    {
        return $this->hasMany(Participant::class);
    }
}
