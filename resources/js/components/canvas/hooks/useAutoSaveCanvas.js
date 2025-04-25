import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'

/**
 * Custom hook to auto-save and auto-load canvas data
 * @param {number} workflowId - The ID of the workflow
 * @param {Object} canvasRef - Ref to the canvas component with getCanvasData method
 * @param {number} saveInterval - Interval in ms to save canvas (default: 10000ms/10s)
 * @returns {Object} Save state and control functions
 */
export const useAutoSaveCanvas = (
    workflowId,
    canvasRef,
    saveInterval = 10000
) => {
    const [isLoading, setIsLoading] = useState(true)
    const [lastSaved, setLastSaved] = useState(null)
    const [justSaved, setJustSaved] = useState(false)
    const [error, setError] = useState(null)
    const saveTimeoutRef = useRef(null)
    const justSavedTimeoutRef = useRef(null)
    const isMounted = useRef(true)

    // Function to save canvas data to backend
    const saveCanvas = useCallback(async () => {
        if (!workflowId || !canvasRef.current) return

        try {
            const canvasData = canvasRef.current.getCanvasData()
            await axios.post(`/api/workflows/${workflowId}/canvas`, canvasData)

            const now = new Date()
            setLastSaved(now)
            setError(null)

            // Set justSaved flag to true and clear after 2 seconds
            setJustSaved(true)
            if (justSavedTimeoutRef.current) {
                clearTimeout(justSavedTimeoutRef.current)
            }
            justSavedTimeoutRef.current = setTimeout(() => {
                setJustSaved(false)
            }, 2000)

            console.log(`Canvas saved at ${now.toLocaleTimeString()}`)
        } catch (err) {
            console.error('Error saving canvas:', err)
            setError('Failed to save canvas')
            toast.error('Failed to save workflow canvas')
        }
    }, [workflowId, canvasRef])

    // Clean up timeouts on unmount
    useEffect(() => {
        return () => {
            if (justSavedTimeoutRef.current) {
                clearTimeout(justSavedTimeoutRef.current)
            }
        }
    }, [])

    // Function to load canvas data from backend
    const loadCanvas = useCallback(async () => {
        if (!workflowId) return

        setIsLoading(true)
        setError(null)

        try {
            const response = await axios.get(
                `/api/workflows/${workflowId}/canvas`
            )

            if (isMounted.current && canvasRef.current) {
                const originalResponse = response.data

                console.log('Loading workflow canvas data:', originalResponse)

                // Load canvas with data
                canvasRef.current.loadCanvas(originalResponse)
                console.log('Canvas loaded successfully')
            }
        } catch (err) {
            console.error('Error loading canvas:', err)
            setError('Failed to load canvas')
            toast.error('Failed to load workflow canvas')
        } finally {
            setIsLoading(false)
        }
    }, [workflowId, canvasRef])

    // Load canvas data when component mounts
    useEffect(() => {
        loadCanvas()

        return () => {
            isMounted.current = false
        }
    }, [loadCanvas])

    // Set up auto-save interval
    useEffect(() => {
        if (!workflowId) return

        // Start auto-save interval
        const startAutoSave = () => {
            saveTimeoutRef.current = setTimeout(() => {
                saveCanvas()
                startAutoSave() // Schedule next save
            }, saveInterval)
        }

        // Start the first auto-save timer
        startAutoSave()

        // Cleanup on unmount
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current)
            }
        }
    }, [workflowId, saveCanvas, saveInterval])

    // Manual save function for immediate saving
    const manualSave = useCallback(() => {
        // Clear existing timer and save immediately
        clearTimeout(saveTimeoutRef.current)

        // Perform save operation
        saveCanvas()

        // Reset auto-save timer
        saveTimeoutRef.current = setTimeout(saveCanvas, saveInterval)
    }, [saveCanvas, saveInterval])

    return {
        isLoading,
        lastSaved,
        justSaved,
        error,
        manualSave,
        reloadCanvas: loadCanvas
    }
}
