<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run()
    {
        User::create([
            'name' => 'Admin 12345',
            'email' => 'admin12345@gmail.com',
            'password' => Hash::make('admin12345'),
            'role' => 'admin',
        ]);
    }
}
