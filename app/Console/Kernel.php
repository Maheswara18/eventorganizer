<?php

namespace App\Console;
use App\Models\Participant;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        $schedule->call(function () {
        Participant::where('attendance_status', 'registered')
            ->whereHas('event', function ($query) {
                $query->where('end_datetime', '<', now());
            })->update(['attendance_status' => 'absent']);
    })->everyMinute();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }

    
}
