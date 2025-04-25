import TriggerNode from './TriggerNode';
import ActionNode from './ActionNode';

// Export individual components for direct imports
export { TriggerNode, ActionNode };

// Export nodeTypes object for React Flow
export const nodeTypes = {
    trigger: TriggerNode,
    action: ActionNode
};