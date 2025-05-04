<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EventController extends Controller
{
    // ✅ List semua event
    public function index()
    {
        return response()->json(Event::with('admin')->get());
    }

    // ✅ Detail satu event
    public function show($id)
    {
        $event = Event::with('admin')->findOrFail($id);
        return response()->json($event);
    }

    // ✅ Create event (admin only)
    public function store(Request $request)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string',
            'description' => 'nullable|string',
            'provides_certificate' => 'boolean',
            'price' => 'numeric|min:0',
            'location' => 'required|string',
            'status' => 'in:active,ended',
            'max_participants' => 'nullable|integer|min:1',
            'start_datetime' => 'required|date',
            'end_datetime' => 'required|date|after_or_equal:start_datetime',
            'image_path' => 'nullable|string'
        ]);

        $validated['admin_id'] = Auth::id();

        $event = Event::create($validated);

        return response()->json($event, 201);
    }

    // ✅ Update event (admin only)
    public function update(Request $request, $id)
    {
        $event = Event::findOrFail($id);

        if (Auth::user()->id !== $event->admin_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string',
            'description' => 'nullable|string',
            'provides_certificate' => 'boolean',
            'price' => 'numeric|min:0',
            'location' => 'required|string',
            'status' => 'in:active,ended',
            'max_participants' => 'nullable|integer|min:1',
            'start_datetime' => 'required|date',
            'end_datetime' => 'required|date|after_or_equal:start_datetime',
            'image_path' => 'nullable|string'
        ]);

        $event->update($validated);

        return response()->json($event);
    }

    // ✅ Hapus event (admin only)
    public function destroy($id)
    {
        $event = Event::findOrFail($id);

        if (Auth::user()->id !== $event->admin_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $event->delete();
        return response()->json(['message' => 'Event deleted']);
    }
}
