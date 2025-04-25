<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class WorkflowRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Allow all authenticated users
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'trigger_id' => 'nullable|exists:triggers,id',
            'status' => 'required|in:draft,published,archived',
        ];
    }
}