<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\Participant;
use App\Observers\ParticipantObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Participant::observe(ParticipantObserver::class);
    }
}
