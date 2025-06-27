<?php

namespace App\Services;

use Intervention\Image\ImageManager;
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

        // Kembali ke cara lama: gunakan Imagick langsung
        $img = new \Imagick();
        $img->readImageBlob(file_get_contents($image));
        $img->setImageFormat($options['format']);
        $img->setImageCompressionQuality($options['quality']);

        // Resize jika perlu
        if ($img->getImageWidth() > $options['maxWidth'] || $img->getImageHeight() > $options['maxHeight']) {
            $img->resizeImage($options['maxWidth'], $options['maxHeight'], \Imagick::FILTER_LANCZOS, 1, true);
        }

        // Generate unique filename
        $filename = Str::random(40) . '.' . $options['format'];
        $fullPath = $path . '/' . $filename;

        // Simpan gambar hasil optimasi
        Storage::put('public/' . $fullPath, $img->getImagesBlob());

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