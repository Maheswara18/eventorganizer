<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Participant;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function getStats(): JsonResponse
    {
        $stats = [
            'totalEvents' => Event::count(),
            'totalParticipants' => Participant::count(),
            'pendingPayments' => Payment::where('payment_status', 'pending')->count()
        ];

        return response()->json($stats);
    }

    public function getRegistrations(): JsonResponse
    {
        $registrations = Participant::select(
            DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
            DB::raw('COUNT(*) as total')
        )
            ->groupBy('month')
            ->orderBy('month')
            ->limit(6)
            ->get();

        return response()->json([
            'labels' => $registrations->pluck('month')->map(function ($month) {
                return Carbon::createFromFormat('Y-m', $month)->format('M Y');
            }),
            'values' => $registrations->pluck('total')
        ]);
    }

    public function getRevenue(): JsonResponse
    {
        $revenue = Payment::select(
            DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
            DB::raw('SUM(amount) as total')
        )
            ->where('payment_status', 'completed')
            ->groupBy('month')
            ->orderBy('month')
            ->limit(6)
            ->get();

        return response()->json([
            'labels' => $revenue->pluck('month')->map(function ($month) {
                return Carbon::createFromFormat('Y-m', $month)->format('M Y');
            }),
            'values' => $revenue->pluck('total')
        ]);
    }

    public function getActivities(): JsonResponse
    {
        $activities = collect();

        // Get latest participant registrations
        $latestRegistrations = Participant::with(['user', 'event'])
            ->latest()
            ->limit(3)
            ->get()
            ->map(function ($participant) {
                return [
                    'icon' => 'person-add',
                    'color' => 'success',
                    'title' => 'Peserta Baru',
                    'description' => "{$participant->user->name} mendaftar event {$participant->event->name}",
                    'time' => $participant->created_at->diffForHumans()
                ];
            });
        $activities = $activities->concat($latestRegistrations);

        // Get latest payments
        $latestPayments = Payment::with(['participant.user', 'participant.event'])
            ->where('payment_status', 'completed')
            ->latest()
            ->limit(3)
            ->get()
            ->map(function ($payment) {
                return [
                    'icon' => 'cash',
                    'color' => 'warning',
                    'title' => 'Pembayaran',
                    'description' => "Pembayaran dari {$payment->participant->user->name} telah dikonfirmasi",
                    'time' => $payment->updated_at->diffForHumans()
                ];
            });
        $activities = $activities->concat($latestPayments);

        // Get latest events
        $latestEvents = Event::latest()
            ->limit(3)
            ->get()
            ->map(function ($event) {
                return [
                    'icon' => 'calendar',
                    'color' => 'primary',
                    'title' => 'Event Baru',
                    'description' => "Event \"{$event->name}\" telah dibuat",
                    'time' => $event->created_at->diffForHumans()
                ];
            });
        $activities = $activities->concat($latestEvents);

        // Sort all activities by time
        $activities = $activities->sortByDesc(function ($activity) {
            return Carbon::parse(str_replace(' yang lalu', '', $activity['time']));
        })->values();

        return response()->json($activities->take(5));
    }
}