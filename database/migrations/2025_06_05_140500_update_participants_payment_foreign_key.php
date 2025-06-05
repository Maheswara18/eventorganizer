<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('participants', function (Blueprint $table) {
            // Drop the existing foreign key
            $table->dropForeign(['payment_id']);
            
            // Add the new foreign key with cascade on delete
            $table->foreign('payment_id')
                ->references('id')
                ->on('payments')
                ->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::table('participants', function (Blueprint $table) {
            // Drop the cascading foreign key
            $table->dropForeign(['payment_id']);
            
            // Restore the original foreign key without cascade
            $table->foreign('payment_id')
                ->references('id')
                ->on('payments');
        });
    }
}; 