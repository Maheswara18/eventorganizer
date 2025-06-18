<?php

namespace App\Http\Controllers\EventController;

use App\Http\Controllers\Controller;
use App\Http\Requests\EventRequest;
use App\Models\Event;
use Illuminate\Http\Request;

class EventController extends Controller
{
    // ✅ Update event (admin only)
    public function update(Request $request, $id)
    {
        try {
            // ... existing code ...

            $validated = $request->validate([
                'title' => 'required|string',
                'description' => 'required|string',
                'provides_certificate' => 'boolean',
                'price' => 'nullable|numeric|min:0',
                'location' => 'required|string',
                'status' => 'required|in:active,ended',
                'max_participants' => 'required|integer|min:1',
                'start_datetime' => 'required|date',
                'end_datetime' => 'required|date|after_or_equal:start_datetime',
                'image_path' => 'nullable|image|mimes:jpeg,png,jpg|max:2048'
            ]);

            // ... existing code ...
        } catch (\Exception $e) {
            // ... existing code ...
        }
    }
} 