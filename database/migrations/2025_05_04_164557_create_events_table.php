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
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->constrained('users');
            $table->string('image_path')->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->boolean('provides_certificate')->default(false);
            $table->decimal('price', 10, 2)->default(0.00);
            $table->string('location');
            $table->enum('status', ['active', 'ended'])->default('active');
            $table->integer('max_participants')->nullable();
            $table->dateTime('start_datetime');
            $table->dateTime('end_datetime');
            $table->timestamps();
        });        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
