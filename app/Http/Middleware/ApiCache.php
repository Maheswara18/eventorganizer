<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class ApiCache
{
    public function handle(Request $request, Closure $next, $ttl = 60)
    {
        // Skip caching for non-GET requests
        if ($request->method() !== 'GET') {
            return $next($request);
        }

        // Generate cache key based on request
        $cacheKey = 'api_' . md5($request->fullUrl());

        // Check if response is cached
        if (Cache::has($cacheKey)) {
            return response()->json(Cache::get($cacheKey));
        }

        // Get response
        $response = $next($request);

        // Hanya cache response jika tipe response adalah JsonResponse atau Response
        if ($response instanceof JsonResponse || $response instanceof Response) {
            $status = $response->status();
            // Cache response if it's successful
            if ($status === 200) {
                Cache::put($cacheKey, $response->getData(), $ttl);
            }
        } else if ($response instanceof StreamedResponse) {
            // Untuk download file, skip cache dan jangan akses status()
            // Bisa tambahkan log jika perlu
        }

        return $response;
    }
} 