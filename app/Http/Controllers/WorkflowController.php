<?php

namespace App\Http\Controllers;

use App\Http\Requests\WorkflowCanvasRequest;
use App\Http\Requests\WorkflowRequest;
use App\Models\Workflow;
use App\Models\WorkflowAction;
use App\Models\WorkflowConnection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class WorkflowController extends Controller
{
    /**
     * Display a listing of workflows with pagination and search
     */
    public function index(Request $request)
    {
        $search = $request->input('search', '');
        $perPage = $request->input('per_page', 10);
        
        $workflows = Workflow::query()
            ->when($search, function ($query, $search) {
                return $query->where('name', 'like', "%{$search}%");
            })
            ->with('trigger')
            ->orderBy('updated_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Workflows/Index', [
            'workflows' => $workflows,
            'filters' => [
                'search' => $search,
                'perPage' => $perPage,
            ]
        ]);
    }

    /**
     * Return workflows as JSON for API use
     */
    public function apiIndex(Request $request)
    {
        $search = $request->input('search', '');
        $perPage = $request->input('per_page', 10);
        
        $workflows = Workflow::query()
            ->when($search, function ($query, $search) {
                return $query->where('name', 'like', "%{$search}%");
            })
            ->with('trigger')
            ->orderBy('updated_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();
        
        return response()->json([
            'workflows' => $workflows,
        ]);
    }

    /**
     * Show the form for creating a new workflow.
     */
    public function create()
    {
        return Inertia::render('Workflows/Create');
    }

    /**
     * Store a newly created workflow in storage.
     */
    public function store(WorkflowRequest $request)
    {
        $validated = $request->validated();
        $workflow = Workflow::create($validated);

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Workflow created successfully',
                'workflow' => $workflow,
            ], 201);
        }

        return redirect()->route('workflows.edit', $workflow)
            ->with('success', 'Workflow created successfully');
    }

    /**
     * Display the specified workflow.
     */
    public function show(Workflow $workflow)
    {
        $workflow->load(['trigger', 'actions.action', 'connections']);
        
        if (request()->wantsJson()) {
            return response()->json([
                'workflow' => $workflow,
            ]);
        }
        
        return Inertia::render('Workflows/Show', [
            'workflow' => $workflow,
        ]);
    }

    /**
     * Show the form for editing the specified workflow.
     */
    public function edit(Workflow $workflow)
    {
        $workflow->load(['trigger', 'actions.action', 'connections']);
        
        return Inertia::render('Workflows/Edit', [
            'workflow' => $workflow,
        ]);
    }

    /**
     * Update the specified workflow in storage.
     */
    public function update(WorkflowRequest $request, Workflow $workflow)
    {
        $validated = $request->validated();
        $workflow->update($validated);

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Workflow updated successfully',
                'workflow' => $workflow,
            ]);
        }

        return redirect()->route('workflows.edit', $workflow)
            ->with('success', 'Workflow updated successfully');
    }

    /**
     * Remove the specified workflow from storage.
     */
    public function destroy(Workflow $workflow)
    {
        $workflow->delete();
        
        if (request()->wantsJson()) {
            return response()->json([
                'message' => 'Workflow deleted successfully',
            ]);
        }
        
        return redirect()->route('workflows.index')
            ->with('success', 'Workflow deleted successfully');
    }

    /**
     * Save workflow canvas data (nodes, connections, configuration)
     */
    public function saveCanvas(WorkflowCanvasRequest $request, Workflow $workflow)
    {
        $validated = $request->validated();

        // Begin transaction
        DB::beginTransaction();
        
        try {
            // Delete existing actions and connections
            $workflow->actions()->delete();
            $workflow->connections()->delete();
            
            // Track old ID to new ID mapping
            $idMapping = [];
            
            // Get the first action from the database to use for trigger nodes (typically ID 1 for "Send Email")
            // Using a fixed ID is safer than querying each time, as we know this ID exists
            $defaultActionId = 1; // This should be an ID that definitely exists in your actions table
            
            // Create new actions and track their IDs for connection mapping
            foreach ($validated['actions'] as $actionData) {
                // Store the original frontend ID before creating the action
                $originalId = $actionData['id'];
                
                // For non-trigger nodes, ensure action_id is set to prevent unwanted defaults
                if (($actionData['type'] ?? '') !== 'trigger' && empty($actionData['action_id'])) {
                    // Skip nodes without action_id to prevent unwanted Send Email nodes
                    continue;
                }
                
                // Prepare data for database insertion
                $actionDbData = [
                    'x' => $actionData['x'],
                    'y' => $actionData['y'],
                    'type' => $actionData['type'] ?? 'action',
                    'label' => $actionData['label'] ?? null,
                    'configuration_json' => $actionData['configuration_json'] ?? [],
                ];
                
                // Handle action_id specially for trigger nodes
                if (($actionData['type'] ?? '') === 'trigger') {
                    // Use the default action_id (typically 1) but mark the node as 'trigger' type
                    // The frontend will recognize this as a trigger by the 'type' field, not by action_id
                    $actionDbData['action_id'] = $defaultActionId;
                } else {
                    // Regular action node
                    $actionDbData['action_id'] = $actionData['action_id'];
                }
                
                // Create the action
                $action = $workflow->actions()->create($actionDbData);
                
                // Map the original ID to the new database ID
                $idMapping[$originalId] = $action->id;
            }
            
            // Create new connections only if they exist, using the mapped IDs
            if (!empty($validated['connections'])) {
                foreach ($validated['connections'] as $connectionData) {
                    $sourceId = $connectionData['source_node_id'];
                    $targetId = $connectionData['target_node_id'];
                    
                    // Skip connections if source or target was skipped due to validation
                    if (!isset($idMapping[$sourceId]) || !isset($idMapping[$targetId])) {
                        continue;
                    }
                    
                    // Map to new IDs
                    $mappedSourceId = $idMapping[$sourceId];
                    $mappedTargetId = $idMapping[$targetId];
                    
                    $workflow->connections()->create([
                        'source_node_id' => $mappedSourceId,
                        'target_node_id' => $mappedTargetId,
                    ]);
                }
            }
            
            DB::commit();
            
            return response()->json([
                'message' => 'Workflow canvas saved successfully',
                'workflow' => $workflow->fresh(['actions.action', 'connections']),
                // Include the ID mapping for the frontend to use
                'id_mapping' => $idMapping
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error saving workflow canvas',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Load workflow canvas data (nodes, connections)
     */
    public function loadCanvas(Workflow $workflow)
    {
        $workflow->load(['actions.action', 'connections']);
        
        // Log node counts and types for debugging
        $nodeCount = $workflow->actions->count();
        $triggerNodes = $workflow->actions->where('type', 'trigger')->count();
        $actionNodes = $workflow->actions->where('type', 'action')->count();
        $sendEmailNodes = $workflow->actions->where('action_id', 1)->count();
        
        // Add debug info to response
        return response()->json([
            'workflow' => $workflow,
            'debug' => [
                'total_nodes' => $nodeCount,
                'trigger_nodes' => $triggerNodes,
                'action_nodes' => $actionNodes,
                'send_email_nodes' => $sendEmailNodes,
                'all_actions' => $workflow->actions->map(function($action) {
                    return [
                        'id' => $action->id,
                        'type' => $action->type,
                        'action_id' => $action->action_id,
                        'label' => $action->label
                    ];
                })
            ]
        ]);
    }
}