"use client"

/**
 * AutoFigure Context
 *
 * State management for AutoFigure plugin.
 * Adapted for DS_2027 integration.
 */

import type React from "react"
import { createContext, useContext, useState, useCallback, useRef } from "react"
import type {
    AutoFigureConfig,
    AutoFigureSession,
    IterationResult,
    EnhancedImage,
    SessionStatus,
    EvaluationResult,
} from "../lib/autofigure-types"
import { DEFAULT_CONFIG } from "../lib/autofigure-types"
import { wrapWithMxFile } from "../lib/utils"
import {
    getCurrentProjectId,
    saveIterationArtifacts,
    saveFinalArtifacts,
    saveEnhancedImage,
} from "../lib/file-operations"
import { resolveApiBaseUrl } from "@/lib/api/client"

interface AutoFigureContextType {
    // Configuration
    config: AutoFigureConfig
    updateConfig: (updates: Partial<AutoFigureConfig>) => void
    resetConfig: () => void

    // Session state
    session: AutoFigureSession | null
    hydrateSession: (session: AutoFigureSession) => void
    resetSession: () => void
    isGenerating: boolean
    currentXml: string
    updateCurrentXml: (xml: string) => void

    // Actions
    startGeneration: (inputText: string, configOverride?: AutoFigureConfig) => Promise<boolean>
    continueIteration: (editedXml: string, feedback?: string, score?: number) => Promise<void>
    finalizeLayout: (finalXml: string) => Promise<string | null>
    startEnhancement: (onComplete?: (success: boolean, images: EnhancedImage[]) => void) => Promise<void>
    cancelGeneration: () => void
    exportPptx: (iteration?: number) => Promise<string | null>

    // Iteration navigation
    currentIterationIndex: number
    setCurrentIterationIndex: (index: number) => void
    getCurrentIteration: () => IterationResult | null

    // Enhancement
    enhancementProgress: number
    enhancedImages: EnhancedImage[]

    // Error handling
    error: string | null
    setError: (error: string | null) => void
    clearError: () => void
}

const AutoFigureContext = createContext<AutoFigureContextType | undefined>(undefined)

export function AutoFigureProvider({ children }: { children: React.ReactNode }) {
    // Configuration state
    const [config, setConfig] = useState<AutoFigureConfig>(DEFAULT_CONFIG)

    // Session state
    const [session, setSession] = useState<AutoFigureSession | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [currentXml, setCurrentXml] = useState("")
    const [currentIterationIndex, setCurrentIterationIndex] = useState(0)

    // Enhancement state
    const [enhancementProgress, setEnhancementProgress] = useState(0)
    const [enhancedImages, setEnhancedImages] = useState<EnhancedImage[]>([])

    // Error state
    const [error, setError] = useState<string | null>(null)

    // Refs for cancellation
    const abortControllerRef = useRef<AbortController | null>(null)

    const getApiUrl = (endpoint: string) => {
        return `${resolveApiBaseUrl()}/api/v1/autofigure${endpoint}`
    }

    // DS_2027: Use DS authentication token
    const getAuthToken = () => {
        if (typeof window === 'undefined') return ""
        return localStorage.getItem("ds_access_token") || ""
    }

    const updateConfig = useCallback((updates: Partial<AutoFigureConfig>) => {
        setConfig(prev => ({ ...prev, ...updates }))
    }, [])

    const resetConfig = useCallback(() => {
        setConfig(DEFAULT_CONFIG)
    }, [])

    const clearError = useCallback(() => {
        setError(null)
    }, [])

    const hydrateSession = useCallback((nextSession: AutoFigureSession) => {
        const iterations = nextSession.iterations || []
        const lastIterationIndex = iterations.length > 0 ? iterations.length - 1 : 0
        const latestXml = nextSession.finalXml || iterations[lastIterationIndex]?.xml || ""

        setConfig(nextSession.config)
        setSession(nextSession)
        setCurrentXml(latestXml)
        setCurrentIterationIndex(lastIterationIndex)
        setEnhancedImages(nextSession.enhancedImages || [])
        setEnhancementProgress(0)
        setIsGenerating(false)
        setError(null)
    }, [])

    const resetSession = useCallback(() => {
        setSession(null)
        setCurrentXml("")
        setCurrentIterationIndex(0)
        setEnhancedImages([])
        setEnhancementProgress(0)
        setIsGenerating(false)
        setError(null)
    }, [])

    const startGeneration = useCallback(async (inputText: string, configOverride?: AutoFigureConfig): Promise<boolean> => {
        // Use configOverride if provided, otherwise use current config state
        const effectiveConfig = configOverride || config

        setIsGenerating(true)
        setError(null)
        abortControllerRef.current = new AbortController()

        console.log("[AutoFigure Context] startGeneration called, inputText length:", inputText.length)
        console.log("[AutoFigure Context] Using config with apiKey:", effectiveConfig.apiKey ? "present" : "missing")

        try {
            const projectId = getCurrentProjectId()
            const inputType = effectiveConfig.inputType || "text"
            const sourceFileName = effectiveConfig.sourceFileName

            const response = await fetch(getApiUrl("/session/create"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${getAuthToken()}`,
                },
                body: JSON.stringify({
                    input_content: inputText,
                    input_type: inputType,
                    project_id: projectId || undefined,
                    source_file_name: inputType === "pdf" ? sourceFileName || undefined : undefined,
                    config: {
                        contentType: effectiveConfig.contentType,
                        sessionName: effectiveConfig.sessionName || undefined,
                        sourceFileName: effectiveConfig.sourceFileName || undefined,
                        maxIterations: effectiveConfig.maxIterations,
                        qualityThreshold: effectiveConfig.qualityThreshold,
                        minImprovement: effectiveConfig.minImprovement,
                        humanInLoop: effectiveConfig.humanInLoop,
                        llmProvider: effectiveConfig.llmProvider,
                        apiKey: effectiveConfig.apiKey,
                        baseUrl: effectiveConfig.baseUrl,
                        model: effectiveConfig.model,
                        iterationModel: effectiveConfig.iterationModel,
                        svgWidth: effectiveConfig.svgWidth,
                        svgHeight: effectiveConfig.svgHeight,
                        enableMethodologyExtraction: effectiveConfig.enableMethodologyExtraction,
                        methodologyLlmProvider: effectiveConfig.methodologyLlmProvider,
                        methodologyLlmApiKey: effectiveConfig.methodologyLlmApiKey,
                        methodologyLlmBaseUrl: effectiveConfig.methodologyLlmBaseUrl,
                        methodologyLlmModel: effectiveConfig.methodologyLlmModel,
                        enhancementMode: effectiveConfig.enhancementMode,
                        artStyle: effectiveConfig.artStyle,
                        enhancementCount: effectiveConfig.enhancementCount,
                        enhancementLlmProvider: effectiveConfig.enhancementLlmProvider,
                        enhancementLlmApiKey: effectiveConfig.enhancementLlmApiKey,
                        enhancementLlmBaseUrl: effectiveConfig.enhancementLlmBaseUrl,
                        enhancementLlmModel: effectiveConfig.enhancementLlmModel,
                        imageGenProvider: effectiveConfig.imageGenProvider,
                        imageGenApiKey: effectiveConfig.imageGenApiKey,
                        imageGenBaseUrl: effectiveConfig.imageGenBaseUrl,
                        imageGenModel: effectiveConfig.imageGenModel,
                        pptxExportEnabled: effectiveConfig.pptxExportEnabled,
                        pptxExportMode: effectiveConfig.pptxExportMode,
                        pptxIncludeMetadata: effectiveConfig.pptxIncludeMetadata,
                    },
                }),
                signal: abortControllerRef.current.signal,
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.detail || `Failed to create session: ${response.statusText}`)
            }

            const data = await response.json()

            // Start initial generation
            const startResponse = await fetch(
                getApiUrl(`/session/${data.session_id}/start`),
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${getAuthToken()}`,
                    },
                    signal: abortControllerRef.current.signal,
                }
            )

            if (!startResponse.ok) {
                const errorData = await startResponse.json().catch(() => ({}))
                throw new Error(errorData.detail || `Failed to start generation: ${startResponse.statusText}`)
            }

            const startData = await startResponse.json()

            // Validate that we received valid XML
            if (!startData.xml || typeof startData.xml !== 'string' || !startData.xml.includes('<mxGraphModel')) {
                throw new Error("Server returned invalid figure data. The AI may have failed to generate a proper diagram.")
            }

            const newSession: AutoFigureSession = {
                sessionId: data.session_id,
                status: startData.status as SessionStatus,
                config: { ...effectiveConfig, inputText },
                currentIteration: startData.iteration,
                iterations: [
                    {
                        iteration: startData.iteration,
                        xml: startData.xml,
                        pngBase64: startData.png_base64,
                        evaluation: startData.evaluation,
                        timestamp: new Date().toISOString(),
                    },
                ],
            }

            setSession(newSession)
            setCurrentXml(startData.xml)
            setCurrentIterationIndex(0)

            console.log("[AutoFigure] Initial generation complete, XML length:", startData.xml?.length)

            // Save iteration artifacts to file system
            console.log("[AutoFigure] Saving iteration artifacts, projectId:", projectId, "sessionId:", data.session_id)
            if (projectId && data.session_id) {
                saveIterationArtifacts(
                    projectId,
                    data.session_id,
                    startData.iteration,
                    startData.png_base64,
                    startData.xml
                ).then(() => {
                    console.log("[AutoFigure] Successfully saved iteration artifacts")
                }).catch(err => console.error("[AutoFigure] Failed to save iteration artifacts:", err))
            } else {
                console.warn("[AutoFigure] Skipping artifact save - missing projectId or sessionId")
            }

            return true  // Success
        } catch (err: any) {
            if (err.name !== "AbortError") {
                console.error("[AutoFigure] Generation error:", err)
                setError(err.message || "Failed to start generation")
            }
            return false  // Failure
        } finally {
            setIsGenerating(false)
        }
    }, [config])

    // Helper to check if error is "session not found" and reset session if needed
    const handleSessionError = useCallback((response: Response, errorData: any) => {
        if (response.status === 404 && errorData?.detail?.toLowerCase().includes("session not found")) {
            console.log("[AutoFigure] Session not found on server, resetting session state")
            setSession(null)
            setCurrentXml("")
            setCurrentIterationIndex(0)
            return "Session expired or server was restarted. Please regenerate the figure."
        }
        return errorData?.detail || `Request failed: ${response.statusText}`
    }, [])

    const continueIteration = useCallback(async (
        editedXml: string,
        feedback?: string,
        score?: number
    ) => {
        console.log("[AutoFigure Context] continueIteration called")
        console.log("[AutoFigure Context] editedXml length:", editedXml?.length)
        console.log("[AutoFigure Context] session:", session?.sessionId)

        if (!session) {
            console.log("[AutoFigure Context] ERROR: No session")
            return
        }

        console.log("[AutoFigure Context] Setting session status to 'enhancing'...")
        setSession(prev => (prev ? { ...prev, status: "enhancing" as SessionStatus } : prev))
        setIsGenerating(true)
        setError(null)
        abortControllerRef.current = new AbortController()

        try {
            // Wrap XML with <mxfile> structure before sending to backend
            const wrappedXml = wrapWithMxFile(editedXml)
            console.log("[AutoFigure Context] Wrapped XML length:", wrappedXml.length)

            const url = getApiUrl(`/session/${session.sessionId}/continue`)
            console.log("[AutoFigure Context] Making POST request to:", url)

            const response = await fetch(
                getApiUrl(`/session/${session.sessionId}/continue`),
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${getAuthToken()}`,
                    },
                    body: JSON.stringify({
                        current_xml: wrappedXml,
                        human_feedback: feedback,
                        human_score: score,
                    }),
                    signal: abortControllerRef.current.signal,
                }
            )

            console.log("[AutoFigure Context] Response received, status:", response.status)

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                console.log("[AutoFigure Context] Response error:", errorData)
                // Check for session not found error
                const errorMsg = handleSessionError(response, errorData)
                throw new Error(errorMsg)
            }

            console.log("[AutoFigure Context] Parsing response JSON...")
            const data = await response.json()
            console.log("[AutoFigure Context] Response data received, iteration:", data.iteration)

            const newIteration: IterationResult = {
                iteration: data.iteration,
                xml: data.xml,
                pngBase64: data.png_base64,
                evaluation: data.evaluation as EvaluationResult,
                humanFeedback: feedback,
                humanScore: score,
                timestamp: new Date().toISOString(),
            }

            setSession(prev => {
                if (!prev) return prev
                return {
                    ...prev,
                    status: data.status as SessionStatus,
                    currentIteration: data.iteration,
                    iterations: [...prev.iterations, newIteration],
                }
            })

            setCurrentXml(data.xml)
            setCurrentIterationIndex(prev => prev + 1)

            // Save iteration artifacts to file system
            const projectId = getCurrentProjectId()
            console.log("[AutoFigure] Saving continue iteration artifacts, projectId:", projectId, "sessionId:", session.sessionId)
            if (projectId && session.sessionId) {
                saveIterationArtifacts(
                    projectId,
                    session.sessionId,
                    data.iteration,
                    data.png_base64,
                    data.xml
                ).then(() => {
                    console.log("[AutoFigure] Successfully saved continue iteration artifacts")
                }).catch(err => console.error("[AutoFigure] Failed to save iteration artifacts:", err))
            } else {
                console.warn("[AutoFigure] Skipping continue artifact save - missing projectId or sessionId")
            }
        } catch (err: any) {
            if (err.name !== "AbortError") {
                setError(err.message || "Failed to continue iteration")
            }
        } finally {
            setIsGenerating(false)
        }
    }, [session, handleSessionError])

    const finalizeLayout = useCallback(async (finalXml: string): Promise<string | null> => {
        if (!session) return null

        setIsGenerating(true)
        setError(null)

        try {
            const wrappedXml = wrapWithMxFile(finalXml)
            console.log("[AutoFigure] Finalizing layout with XML length:", wrappedXml.length)

            const response = await fetch(
                getApiUrl(`/session/${session.sessionId}/finalize`),
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${getAuthToken()}`,
                    },
                    body: JSON.stringify({ final_xml: wrappedXml }),
                }
            )

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(handleSessionError(response, errorData))
            }

            const data = await response.json()

            setSession(prev => {
                if (!prev) return prev
                return {
                    ...prev,
                    status: "waiting_feedback" as SessionStatus,
                    finalXml: finalXml,
                    finalPngBase64: data.png_base64,
                }
            })

            // Save final artifacts to file system
            const projectId = getCurrentProjectId()
            console.log("[AutoFigure] Saving final artifacts, projectId:", projectId, "sessionId:", session.sessionId)
            if (projectId && session.sessionId) {
                saveFinalArtifacts(
                    projectId,
                    session.sessionId,
                    data.png_base64,
                    finalXml
                ).then(() => {
                    console.log("[AutoFigure] Successfully saved final artifacts")
                }).catch(err => console.error("[AutoFigure] Failed to save final artifacts:", err))
            } else {
                console.warn("[AutoFigure] Skipping final artifact save - missing projectId or sessionId")
            }

            return data.png_base64 || null
        } catch (err: any) {
            setError(err.message || "Failed to finalize layout")
            return null
        } finally {
            setIsGenerating(false)
        }
    }, [session, handleSessionError])

    const startEnhancement = useCallback(async (
        onComplete?: (success: boolean, images: EnhancedImage[]) => void
    ) => {
        if (!session) return

        setIsGenerating(true)
        setError(null)
        setEnhancementProgress(0)
        setEnhancedImages([])

        try {
            // DEBUG: Log enhancement request details
            console.log("[AutoFigure] ===== DEBUG: startEnhancement request =====")
            console.log("[AutoFigure] DEBUG: config.enhancementMode:", config.enhancementMode)
            console.log("[AutoFigure] DEBUG: config.enhancementLlmProvider:", config.enhancementLlmProvider)
            console.log("[AutoFigure] DEBUG: config.enhancementLlmModel:", config.enhancementLlmModel)
            console.log("[AutoFigure] DEBUG: config.enhancementLlmApiKey present:", !!config.enhancementLlmApiKey)
            console.log("[AutoFigure] DEBUG: config.artStyle:", config.artStyle?.substring(0, 50) + "...")
            console.log("[AutoFigure] DEBUG: Full config object:", JSON.stringify({
                ...config,
                apiKey: config.apiKey ? "[REDACTED]" : "",
                enhancementLlmApiKey: config.enhancementLlmApiKey ? "[REDACTED]" : "",
                imageGenApiKey: config.imageGenApiKey ? "[REDACTED]" : "",
            }, null, 2))

            const response = await fetch(
                getApiUrl(`/session/${session.sessionId}/enhance`),
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${getAuthToken()}`,
                    },
                    body: JSON.stringify({
                        mode: config.enhancementMode,
                        art_style: config.artStyle,
                        variant_count: config.enhancementCount,
                        enhancement_llm_provider: config.enhancementLlmProvider,
                        enhancement_llm_api_key: config.enhancementLlmApiKey,
                        enhancement_llm_base_url: config.enhancementLlmBaseUrl,
                        enhancement_llm_model: config.enhancementLlmModel,
                        image_gen_provider: config.imageGenProvider,
                        image_gen_api_key: config.imageGenApiKey,
                        image_gen_base_url: config.imageGenBaseUrl,
                        image_gen_model: config.imageGenModel,
                    }),
                }
            )

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                // Check for session not found error
                const errorMsg = handleSessionError(response, errorData)
                throw new Error(errorMsg)
            }

            // Poll for enhancement status
            let pollCount = 0
            const maxPolls = 300

            const pollInterval = setInterval(async () => {
                pollCount++

                if (pollCount > maxPolls) {
                    clearInterval(pollInterval)
                    setIsGenerating(false)
                    setError("Enhancement timed out after 10 minutes")
                    onComplete?.(false, [])
                    return
                }

                try {
                    const statusResponse = await fetch(
                        getApiUrl(`/session/${session.sessionId}/enhance/status`),
                        {
                            headers: {
                                "Authorization": `Bearer ${getAuthToken()}`,
                            },
                        }
                    )

                    if (statusResponse.ok) {
                        const statusData = await statusResponse.json()
                        setEnhancementProgress(statusData.progress)
                        setEnhancedImages(statusData.images || [])

                        if (statusData.status === "completed" || statusData.status === "failed") {
                            clearInterval(pollInterval)
                            setIsGenerating(false)

                            const finalImages = statusData.images || []
                            const hasSuccessfulImages = finalImages.some(
                                (img: EnhancedImage) => img.status === "completed" && img.pngBase64
                            )

                            if (statusData.status === "completed") {
                                setSession(prev => {
                                    if (!prev) return prev
                                    return {
                                        ...prev,
                                        status: "completed" as SessionStatus,
                                        enhancedImages: finalImages,
                                    }
                                })

                                // Save enhanced images to file system
                                const projectId = getCurrentProjectId()
                                console.log("[AutoFigure] Saving enhanced images, projectId:", projectId, "sessionId:", session.sessionId, "imageCount:", finalImages.length)
                                if (projectId && session.sessionId) {
                                    finalImages.forEach((img: EnhancedImage, index: number) => {
                                        if (img.status === "completed" && img.pngBase64) {
                                            saveEnhancedImage(
                                                projectId,
                                                session.sessionId,
                                                img.variant || index + 1,
                                                img.pngBase64
                                            ).then(() => {
                                                console.log(`[AutoFigure] Successfully saved enhanced image ${index + 1}`)
                                            }).catch(err => console.error(`[AutoFigure] Failed to save enhanced image ${index + 1}:`, err))
                                        }
                                    })
                                } else {
                                    console.warn("[AutoFigure] Skipping enhanced image save - missing projectId or sessionId")
                                }
                            } else {
                                setError("Enhancement failed. Please check your API keys and try again.")
                            }

                            onComplete?.(hasSuccessfulImages, finalImages)
                        }
                    }
                } catch (err: any) {
                    console.error("Error polling enhancement status:", err)
                }
            }, 2000)

        } catch (err: any) {
            setError(err.message || "Failed to start enhancement")
            setIsGenerating(false)
            onComplete?.(false, [])
        }
    }, [session, config, handleSessionError])

    const cancelGeneration = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }
        setIsGenerating(false)
    }, [])

    const exportPptx = useCallback(
        async (iteration?: number): Promise<string | null> => {
            if (!session) return null
            setError(null)
            try {
                const response = await fetch(
                    getApiUrl(`/session/${session.sessionId}/export/pptx`),
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${getAuthToken()}`,
                        },
                        body: JSON.stringify({
                            iteration,
                            mode: config.pptxExportMode,
                            include_metadata: config.pptxIncludeMetadata,
                        }),
                    }
                )

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}))
                    throw new Error(handleSessionError(response, errorData))
                }

                const data = await response.json()
                return data.file_path || null
            } catch (err: any) {
                setError(err.message || "Failed to export PPTX")
                return null
            }
        },
        [session, config.pptxExportMode, config.pptxIncludeMetadata, handleSessionError]
    )

    const getCurrentIteration = useCallback(() => {
        if (!session || session.iterations.length === 0) return null
        return session.iterations[currentIterationIndex] || null
    }, [session, currentIterationIndex])

    return (
        <AutoFigureContext.Provider
            value={{
                config,
                updateConfig,
                resetConfig,
                session,
                hydrateSession,
                resetSession,
                isGenerating,
                currentXml,
                updateCurrentXml: setCurrentXml,
                startGeneration,
                continueIteration,
                finalizeLayout,
                startEnhancement,
                cancelGeneration,
                currentIterationIndex,
                setCurrentIterationIndex,
                getCurrentIteration,
                enhancementProgress,
                enhancedImages,
                error,
                setError,
                clearError,
                exportPptx,
            }}
        >
            {children}
        </AutoFigureContext.Provider>
    )
}

export function useAutoFigure() {
    const context = useContext(AutoFigureContext)
    if (context === undefined) {
        throw new Error("useAutoFigure must be used within an AutoFigureProvider")
    }
    return context
}
