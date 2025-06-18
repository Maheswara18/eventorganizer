<?php

namespace App\Http\Controllers;

use App\Models\CertificateTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Barryvdh\DomPDF\Facade\Pdf;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

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
        // Placeholder data for preview
        $participantName = "Nama Peserta Contoh";
        $eventTitle = "Judul Event Contoh";
        $verificationCode = "PREVIEW123";
        $verificationLink = url('/certificates/verify?code=' . $verificationCode);

        // Base HTML structure
        $html = "<!DOCTYPE html>
            <html>
            <head>
                <meta charset=\"utf-8\">
                <title>Preview Sertifikat</title>
                <style>
                    body { margin: 0; padding: 0; }
                    .certificate-container { 
                        width: 297mm; /* A4 landscape width */
                        height: 210mm; /* A4 landscape height */
                        margin: 0; padding: 0;
                        position: relative;
                        overflow: hidden;
                        border: 1px solid #ccc; /* For visual separation in preview */
                        box-sizing: border-box;
                    }
                    /* Default styles for text elements */
                    .text-element {
                        position: absolute;
                        white-space: nowrap;
                    }
                    /* Default styles for image elements */
                    .image-element {
                        position: absolute;
                    }
                </style>
            </head>
            <body>
                <div class=\"certificate-container\">";

        // Dynamically add elements from the template
        if (is_array($template->elements) && !empty($template->elements)) {
            foreach ($template->elements as $element) {
                $type = $element['type'] ?? 'text'; // Default to text
                $x = $element['x'] ?? 0;
                $y = $element['y'] ?? 0;

                switch ($type) {
                    case 'text':
                        $content = $element['content'] ?? '';
                        // Replace placeholders with preview data
                        if (($element['is_dynamic'] ?? false) && ($element['field'] ?? null) === 'participant_name') {
                            $content = $participantName;
                        } elseif (($element['is_dynamic'] ?? false) && ($element['field'] ?? null) === 'event_title') {
                            $content = $eventTitle;
                        } elseif (($element['is_dynamic'] ?? false) && ($element['field'] ?? null) === 'verification_code') {
                            $content = "Kode Verifikasi: " . $verificationCode;
                        }

                        $fontSize = $element['font_size'] ?? 12; // in pt
                        $color = $element['color'] ?? '#000000';
                        $fontFamily = $element['font_family'] ?? 'sans-serif';
                        $align = $element['align'] ?? 'left';
                        $width = $element['width'] ?? 'auto';
                        $height = $element['height'] ?? 'auto';

                        $html .= "<div class=\"text-element\" style=\"left: {$x}mm; top: {$y}mm; font-size: {$fontSize}pt; color: {$color}; font-family: {$fontFamily}; text-align: {$align}; width: {$width}; height: {$height};\">" . htmlspecialchars($content) . "</div>";
                        break;
                    case 'image':
                        $src = $element['src'] ?? '';
                        $width = $element['width'] ?? 'auto';
                        $height = $element['height'] ?? 'auto';
                        $isBackground = $element['is_background'] ?? false;
                        $opacity = $element['opacity'] ?? 1; // New property for opacity

                        // Handle background image specifically
                        if ($isBackground) {
                            $html .= "<img class=\"image-element\" src=\"" . htmlspecialchars(url($src)) . "\" style=\"left: 0; top: 0; width: 100%; height: 100%; object-fit: cover; z-index: -1; opacity: {$opacity};\">";
                        } else {
                            $html .= "<img class=\"image-element\" src=\"" . htmlspecialchars(url($src)) . "\" style=\"left: {$x}mm; top: {$y}mm; width: {$width}; height: {$height}; opacity: {$opacity};\">";
                        }
                        break;
                    case 'qr_code':
                        $qrSize = $element['size'] ?? 80; // in px
                        $qrCodeImgBase64 = base64_encode(QrCode::format('png')->size($qrSize)->generate($verificationLink));
                        $html .= "<img class=\"image-element\" src=\"data:image/png;base64,{$qrCodeImgBase64}\" style=\"left: {$x}mm; top: {$y}mm; width: {$qrSize}px; height: {$qrSize}px;\">";
                        break;
                }
            }
        } else {
            $html .= "<div style=\"position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);\">Tidak ada elemen yang didefinisikan untuk template ini.</div>";
        }

        $html .= "</div></body></html>";

        $pdf = Pdf::loadHtml($html)->setPaper('A4', 'landscape');

        // Return the PDF as an inline response for preview
        return $pdf->stream('preview_certificate.pdf');
    }

    public function generate(Request $request, CertificateTemplate $template)
    {
        // TODO: Implement certificate generation
        // This will be implemented when we add PDF generation functionality
        return response()->json(['message' => 'Certificate generation not implemented yet']);
    }
} 