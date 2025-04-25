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
            
            // Create new actions
            foreach ($validated['actions'] as $actionData) {
                $workflow->actions()->create([
                    'action_id' => $actionData['action_id'],
                    'configuration_json' => $actionData['configuration_json'] ?? null,
                    'x' => $actionData['x'],
                    'y' => $actionData['y'],
                ]);
            }
            
            // Create new connections only if they exist
            if (!empty($validated['connections'])) {
                foreach ($validated['connections'] as $connectionData) {
                    $workflow->connections()->create([
                        'source_node_id' => $connectionData['source_node_id'],
                        'target_node_id' => $connectionData['target_node_id'],
                    ]);
                }
            }
            
            DB::commit();
            
            return response()->json([
                'message' => 'Workflow canvas saved successfully',
                'workflow' => $workflow->fresh(['actions.action', 'connections']),
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
        
        return response()->json([
            'workflow' => $workflow,
        ]);
    }
}