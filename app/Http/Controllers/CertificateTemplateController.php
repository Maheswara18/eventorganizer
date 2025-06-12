<?php

namespace App\Http\Controllers;

use App\Models\CertificateTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CertificateTemplateController extends Controller
{
    public function index()
    {
        $templates = CertificateTemplate::all();
        return response()->json($templates);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'elements' => 'required|array',
            'is_default' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if ($request->input('is_default')) {
            // If this template is set as default, remove default from other templates
            CertificateTemplate::where('is_default', true)
                ->update(['is_default' => false]);
        }

        $template = CertificateTemplate::create($request->all());
        return response()->json($template, 201);
    }

    public function show(CertificateTemplate $template)
    {
        return response()->json($template);
    }

    public function update(Request $request, CertificateTemplate $template)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'elements' => 'required|array',
            'is_default' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if ($request->input('is_default')) {
            // If this template is set as default, remove default from other templates
            CertificateTemplate::where('id', '!=', $template->id)
                ->where('is_default', true)
                ->update(['is_default' => false]);
        }

        $template->update($request->all());
        return response()->json($template);
    }

    public function destroy(CertificateTemplate $template)
    {
        $template->delete();
        return response()->json(null, 204);
    }

    public function preview(Request $request, CertificateTemplate $template)
    {
        // TODO: Implement preview generation
        // This will be implemented when we add PDF generation functionality
        return response()->json(['message' => 'Preview generation not implemented yet']);
    }

    public function generate(Request $request, CertificateTemplate $template)
    {
        // TODO: Implement certificate generation
        // This will be implemented when we add PDF generation functionality
        return response()->json(['message' => 'Certificate generation not implemented yet']);
    }
} 