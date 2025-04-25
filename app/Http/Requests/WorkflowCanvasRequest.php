<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class WorkflowCanvasRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'actions' => 'required|array',
            'actions.*.id' => 'sometimes|integer',
            'actions.*.action_id' => 'required|exists:actions,id',
            'actions.*.configuration_json' => 'nullable|array',
            'actions.*.x' => 'required|numeric',
            'actions.*.y' => 'required|numeric',
            'connections' => 'nullable|array',
            'connections.*.id' => 'sometimes|integer',
            'connections.*.source_node_id' => 'required_with:connections|string',
            'connections.*.target_node_id' => 'required_with:connections|string',
        ];
    }
}