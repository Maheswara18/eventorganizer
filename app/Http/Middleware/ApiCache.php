<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

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

        // Cache response if it's successful
        if ($response->status() === 200) {
            Cache::put($cacheKey, $response->getData(), $ttl);
        }

        return $response;
    }
} 