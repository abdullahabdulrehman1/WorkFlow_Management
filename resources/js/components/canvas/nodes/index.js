import ActionNode from './ActionNode';
import TriggerNode from './TriggerNode';

// Export individual components for direct imports
export { ActionNode, TriggerNode };

// Export nodeTypes object for React Flow
export const nodeTypes = {
    trigger: TriggerNode,
    action: ActionNode
};