<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\MediaUploadRequest;
use App\Support\Cloudinary\Cloudinary;
use App\Support\Cloudinary\CloudinaryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class MediaController extends Controller
{
    /**
     * Upload an editor image to Cloudinary. `location` is the key TinyMCE's upload handler reads.
     */
    public function store(MediaUploadRequest $request, Cloudinary $cloudinary): JsonResponse
    {
        try {
            $image = $cloudinary->upload($request->file('image'), $request->folder());
        } catch (CloudinaryException $exception) {
            Log::error($exception->getMessage());

            return response()->json(['message' => CloudinaryException::UserMessage], 502);
        }

        return response()->json([
            'location' => $image->url,
            'width' => $image->width,
            'height' => $image->height,
        ], 201);
    }
}
