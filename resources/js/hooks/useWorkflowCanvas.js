import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

export default function useWorkflowCanvas(canvasRef, workflowId) {
    // Load canvas data for an existing workflow
    const loadCanvasData = async () => {
        if (!workflowId || !canvasRef.current) return;
        
        try {
            // Get canvas data
            const canvasResponse = await axios.get(`/api/workflows/${workflowId}/canvas`);
            
            // Load canvas data into the canvas
            setTimeout(() => {
                canvasRef.current.loadCanvas(canvasResponse.data);
            }, 500);
            
            return canvasResponse.data;
        } catch (err) {
            console.error('Error loading canvas data:', err);
            toast.error('Failed to load canvas data');
        }
    };

    // Clear the canvas
    const clearCanvas = () => {
        if (canvasRef.current) {
            canvasRef.current.clearCanvas();
            return true;
        }
        return false;
    };
    
    // Get current canvas data
    const getCanvasData = () => {
        if (canvasRef.current) {
            return canvasRef.current.getCanvasData();
        }
        return null;
    };

    return {
        loadCanvasData,
        clearCanvas,
        getCanvasData
    };
}