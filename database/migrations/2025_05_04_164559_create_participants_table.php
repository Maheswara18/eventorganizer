<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('event_id')->constrained('events');
            $table->foreignId('payment_id')->nullable()->constrained('payments');
            $table->timestamp('registration_date')->useCurrent();
            $table->string('qr_code_path');
            $table->string('qr_code_data')->unique();
            $table->enum('attendance_status', ['registered', 'present', 'absent'])->default('registered');
            $table->timestamps();
        
            $table->unique(['user_id', 'event_id'], 'unique_participation');
        });        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('participants');
    }
};
