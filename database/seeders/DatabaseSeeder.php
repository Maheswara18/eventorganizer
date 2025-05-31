<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run()
    {
    User::updateOrCreate(
        ['email' => 'admin@example.com'],
        [
            'name' => 'Super Admin',
            'password' => Hash::make('password'),
            'role' => 'admin'
        ]
    );
    }
}
