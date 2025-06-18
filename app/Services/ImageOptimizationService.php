<?php

namespace App\Services;

use Intervention\Image\Facades\Image;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageOptimizationService
{
    public function optimize($image, $path, $options = [])
    {
        $defaultOptions = [
            'quality' => 80,
            'maxWidth' => 1200,
            'maxHeight' => 1200,
            'format' => 'jpg'
        ];

        $options = array_merge($defaultOptions, $options);

        // Create image instance
        $img = Image::make($image);

        // Resize if needed
        if ($img->width() > $options['maxWidth'] || $img->height() > $options['maxHeight']) {
            $img->resize($options['maxWidth'], $options['maxHeight'], function ($constraint) {
                $constraint->aspectRatio();
                $constraint->upsize();
            });
        }

        // Generate unique filename
        $filename = Str::random(40) . '.' . $options['format'];
        $fullPath = $path . '/' . $filename;

        // Save optimized image
        $img->encode($options['format'], $options['quality']);
        Storage::put('public/' . $fullPath, $img->encode());

        return $fullPath;
    }

    public function getOptimizedUrl($path)
    {
        if (Storage::exists('public/' . $path)) {
            return Storage::url($path);
        }
        return Storage::url('images/default-event.jpg');
    }
} 