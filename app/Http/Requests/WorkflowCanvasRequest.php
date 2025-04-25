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
            'actions.*.action_id' => 'required_unless:actions.*.type,trigger|exists:actions,id', // Allow trigger nodes to skip action_id validation
            'actions.*.trigger_id' => 'required_if:actions.*.type,trigger|exists:triggers,id', // Require trigger_id for trigger nodes
            'actions.*.type' => 'sometimes|string|in:trigger,action', // Validate node types
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