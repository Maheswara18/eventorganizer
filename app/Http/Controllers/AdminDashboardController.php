<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Participant;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    public function getStats()
    {
        $stats = [
            'totalEvents' => Event::count(),
            'activeEvents' => Event::where('status', 'active')->count(),
            'totalParticipants' => Participant::count(),
            'pendingPayments' => Payment::where('payment_status', 'pending')->count()
        ];

        return response()->json($stats);
    }

    public function getRegistrations()
    {
        $sixMonthsAgo = Carbon::now()->subMonths(6);
        
        $registrations = Participant::select(
            DB::raw('DATE_FORMAT(created_at, "%b") as month'),
            DB::raw('COUNT(*) as count')
        )
        ->where('created_at', '>=', $sixMonthsAgo)
        ->groupBy('month')
        ->orderBy('created_at')
        ->get();

        return response()->json([
            'labels' => $registrations->pluck('month'),
            'data' => $registrations->pluck('count')
        ]);
    }

    public function getRevenue()
    {
        $sixMonthsAgo = Carbon::now()->subMonths(6);
        
        $revenue = Payment::select(
            DB::raw('DATE_FORMAT(created_at, "%b") as month'),
            DB::raw('SUM(amount) as total')
        )
        ->where('payment_status', 'completed')
        ->where('created_at', '>=', $sixMonthsAgo)
        ->groupBy('month')
        ->orderBy('created_at')
        ->get();

        return response()->json([
            'labels' => $revenue->pluck('month'),
            'data' => $revenue->pluck('total')
        ]);
    }

    public function getActivities()
    {
        $activities = [];

        // Get recent registrations
        $registrations = Participant::with(['user', 'event'])
            ->latest()
            ->take(3)
            ->get()
            ->map(function ($participant) {
                return [
                    'icon' => 'person-add',
                    'color' => 'primary',
                    'title' => 'New Registration',
                    'description' => "{$participant->user->name} registered for \"{$participant->event->title}\"",
                    'time' => $participant->created_at->diffForHumans()
                ];
            });

        // Get recent payments
        $payments = Payment::with(['user', 'event'])
            ->where('payment_status', 'completed')
            ->latest()
            ->take(3)
            ->get()
            ->map(function ($payment) {
                return [
                    'icon' => 'cash',
                    'color' => 'success',
                    'title' => 'Payment Received',
                    'description' => "Payment confirmed for \"{$payment->event->title}\"",
                    'time' => $payment->updated_at->diffForHumans()
                ];
            });

        // Get recent events
        $events = Event::latest()
            ->take(3)
            ->get()
            ->map(function ($event) {
                return [
                    'icon' => 'calendar',
                    'color' => 'warning',
                    'title' => 'Event Created',
                    'description' => "New event: \"{$event->title}\"",
                    'time' => $event->created_at->diffForHumans()
                ];
            });

        // Merge and sort all activities by time
        $activities = collect()
            ->merge($registrations)
            ->merge($payments)
            ->merge($events)
            ->sortByDesc('time')
            ->take(5)
            ->values();

        return response()->json($activities);
    }
} 