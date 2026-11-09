<?php

namespace App\Http\Requests;

use App\Models\Category;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CategoryRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request (ADM-CAT-2).
     *
     * @return array<string, array<int, ValidationRule|Closure|string>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:50', $this->isNotAlreadyUsed(...)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Le nom de la catégorie est obligatoire.',
            'name.max' => 'Le nom de la catégorie ne peut pas dépasser 50 caractères.',
        ];
    }

    /**
     * Compared whatever the case, among live categories only: `SoftDeletes` leaves deleted names free (ADM-CAT-6).
     *
     * @param  Closure(string): mixed  $fail
     */
    private function isNotAlreadyUsed(string $attribute, mixed $value, Closure $fail): void
    {
        $editedCategory = $this->route('category');

        $isUsed = Category::query()
            ->whereRaw('lower(value) = lower(?)', [$value])
            ->when($editedCategory instanceof Category, fn ($query) => $query->whereKeyNot($editedCategory->getKey()))
            ->exists();

        if ($isUsed) {
            $fail('Cette catégorie existe déjà.');
        }
    }
}
