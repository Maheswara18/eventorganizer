<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\FormTemplate;
use App\Models\FormField;
use App\Models\FormResponse;
use App\Models\Participant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class FormTemplateController extends Controller
{
    public function index(Event $event)
    {
        $template = FormTemplate::with('fields')
            ->where('event_id', $event->id)
            ->first();

        return response()->json($template);
    }

    public function create($eventId)
    {
        return view('admin.formtemplate.create', ['eventId' => $eventId]);
    }
    public function store(Request $request, Event $event)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'fields' => 'required|array|min:1',
            'fields.*.label' => 'required|string|max:255',
            'fields.*.type' => 'required|string|in:text,number,email,select,radio,checkbox',
            'fields.*.options' => 'required_if:fields.*.type,select,radio,checkbox|array',
            'fields.*.is_required' => 'required|boolean',
            'fields.*.order' => 'required|integer|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            // Create form template
            $template = FormTemplate::create([
                'event_id' => $event->id,
                'name' => $request->name,
                'description' => $request->description
            ]);

            // Create form fields
            foreach ($request->fields as $field) {
                FormField::create([
                    'form_template_id' => $template->id,
                    'label' => $field['label'],
                    'type' => $field['type'],
                    'options' => $field['options'] ?? null,
                    'is_required' => $field['is_required'],
                    'order' => $field['order']
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Form template created successfully',
                'template' => $template->load('fields')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error creating form template'], 500);
        }
    }

    public function update(Request $request, Event $event, FormTemplate $template)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'fields' => 'required|array|min:1',
            'fields.*.id' => 'nullable|exists:form_fields,id',
            'fields.*.label' => 'required|string|max:255',
            'fields.*.type' => 'required|string|in:text,number,email,select,radio,checkbox',
            'fields.*.options' => 'required_if:fields.*.type,select,radio,checkbox|array',
            'fields.*.is_required' => 'required|boolean',
            'fields.*.order' => 'required|integer|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            // Update template
            $template->update([
                'name' => $request->name,
                'description' => $request->description
            ]);

            // Get existing field IDs
            $existingFieldIds = $template->fields->pluck('id')->toArray();
            $updatedFieldIds = collect($request->fields)->pluck('id')->filter()->toArray();

            // Delete removed fields
            FormField::whereIn('id', array_diff($existingFieldIds, $updatedFieldIds))
                    ->delete();

            // Update or create fields
            foreach ($request->fields as $field) {
                if (isset($field['id'])) {
                    FormField::where('id', $field['id'])->update([
                        'label' => $field['label'],
                        'type' => $field['type'],
                        'options' => $field['options'] ?? null,
                        'is_required' => $field['is_required'],
                        'order' => $field['order']
                    ]);
                } else {
                    FormField::create([
                        'form_template_id' => $template->id,
                        'label' => $field['label'],
                        'type' => $field['type'],
                        'options' => $field['options'] ?? null,
                        'is_required' => $field['is_required'],
                        'order' => $field['order']
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Form template updated successfully',
                'template' => $template->load('fields')
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error updating form template'], 500);
        }
    }

    public function destroy(Event $event, FormTemplate $template)
    {
        try {
            $template->delete();
            return response()->json(['message' => 'Form template deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error deleting form template'], 500);
        }
    }

    public function storeResponses(Request $request, Event $event)
    {
        try {
            \Log::info('Storing form responses for event: ' . $event->id);
            \Log::info('Request data:', $request->all());

            $template = FormTemplate::where('event_id', $event->id)->firstOrFail();
            
            // Validate participant
            $participant = Participant::where('event_id', $event->id)
                ->where('user_id', Auth::id())
                ->firstOrFail();

            // Validate responses
            $validator = Validator::make($request->all(), [
                'responses' => 'required|array',
                'responses.*.field_id' => 'required|exists:form_fields,id',
                'responses.*.value' => 'required|string'
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            DB::beginTransaction();

            try {
                // Store responses
                foreach ($request->responses as $response) {
                    FormResponse::create([
                        'participant_id' => $participant->id,
                        'form_field_id' => $response['field_id'],
                        'value' => $response['value']
                    ]);
                }

                DB::commit();
                return response()->json(['message' => 'Form responses saved successfully']);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            \Log::error('Error storing form responses: ' . $e->getMessage());
            return response()->json(['message' => 'Error storing form responses'], 500);
        }
    }

    public function getResponses(Event $event)
    {
        try {
            $participant = Participant::where('event_id', $event->id)
                ->where('user_id', Auth::id())
                ->with('formResponses.field')
                ->firstOrFail();

            return response()->json([
                'responses' => $participant->formResponses
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error fetching form responses'], 500);
        }
    }
} 