<?php

namespace App\Http\Requests;

use App\MediaFolder;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class MediaUploadRequest extends FormRequest
{
    /**
     * Images inserted in an editor (ADM-ART-53): the article body or a newsletter. Covers and avatars
     * are sent with their own form, which replaces the previous file.
     *
     * @return array<string, array<int, ValidationRule|string|Enum>>
     */
    public function rules(): array
    {
        return [
            'image' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:10240'],
            'folder' => ['required', Rule::enum(MediaFolder::class)->only([MediaFolder::Articles, MediaFolder::Newsletters])],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'image.required' => 'Choisissez une image.',
            'image.file' => 'L’image n’a pas pu être envoyée.',
            'image.image' => 'Le fichier doit être une image JPG, PNG, WebP ou GIF.',
            'image.mimes' => 'Le fichier doit être une image JPG, PNG, WebP ou GIF.',
            'image.max' => 'L’image ne doit pas dépasser 10 Mo.',
            'folder.required' => 'Le dossier de destination est manquant.',
            'folder.enum' => 'Ce dossier de destination n’est pas autorisé.',
        ];
    }

    public function folder(): MediaFolder
    {
        return $this->enum('folder', MediaFolder::class) ?? MediaFolder::Articles;
    }
}
