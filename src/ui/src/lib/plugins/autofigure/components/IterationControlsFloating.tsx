"use client"

/**
 * Floating Iteration Controls Component
 *
 * Two-mode design matching original AutoFigure:
 * - Iteration Mode: Navigate iterations, provide feedback, continue/finalize
 * - Generation Mode: Input prompt and generate images inline
 */

import { useCallback, useState, useRef, useEffect } from "react"
import {
    ChevronLeft,
    ChevronRight,
    MessageSquare,
    Play,
    X,
    Settings2,
    ArrowRight,
    Loader2,
    Sparkles,
    Download,
} from "lucide-react"
import { useAutoFigure } from "../contexts/autofigure-context"
import ImageGenSettings from "./ImageGenSettings"
import { type LLMProvider } from "../lib/autofigure-types"
import { useToast } from "@/components/ui/toast"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    usePointsAutoChargePreferences,
} from '@/lib/hooks/usePoints'
import { useMeteredAction } from '@/lib/hooks/useMeteredAction'
import { apiClient } from '@/lib/api/client'
import { useFileTreeStore } from "@/lib/stores/file-tree"

interface IterationControlsFloatingProps {
    onContinue: (feedback?: string, score?: number) => void
    onFinalize: () => void
    onLoadIteration: (xml: string) => void
    onImageGenerated?: (imageBase64: string) => void
    onDownloadPng?: () => Promise<string | null>
    onOpenExportHub?: () => void
}

type BottomBarMode = 'iteration' | 'generation'

interface AutoFigureGenerateImageResponse {
    image_base64: string
    format: string
    prompt: string
    points_estimated_cost?: number
    points_actual_cost?: number
    points_balance_after?: number
}


export default function IterationControlsFloating({
    onContinue,
    onFinalize,
    onLoadIteration,
    onImageGenerated,
    onDownloadPng,
    onOpenExportHub,
}: IterationControlsFloatingProps) {
    const {
        session,
        isGenerating,
        currentIterationIndex,
        setCurrentIterationIndex,
        exportPptx,
        setError,
    } = useAutoFigure()

    const { addToast } = useToast()
    const autoChargePreferencesQuery = usePointsAutoChargePreferences()
    const refreshFileTree = useFileTreeStore((state) => state.refresh)

    // Mode state
    const [mode, setMode] = useState<BottomBarMode>('iteration')

    // Iteration mode state
    const [showFeedback, setShowFeedback] = useState(false)
    const [feedback, setFeedback] = useState("")
    const [score, setScore] = useState<number | undefined>(undefined)
    const [isExporting, setIsExporting] = useState(false)

    // Generation mode state
    const [prompt, setPrompt] = useState("")
    const [showSettings, setShowSettings] = useState(false)
    const [showChargeConfirmDialog, setShowChargeConfirmDialog] = useState(false)
    const [autoSubscribeChoice, setAutoSubscribeChoice] = useState(false)
    const [singleChargeLimitInput, setSingleChargeLimitInput] = useState('0')
    const [dailyChargeLimitInput, setDailyChargeLimitInput] = useState('0')
    const [imageGenConfig, setImageGenConfig] = useState<{
        provider: LLMProvider
        apiKey: string
        model: string
        baseUrl: string
    }>({
        provider: 'gemini',
        apiKey: "",
        model: "gemini-3-pro-image-preview",
        baseUrl: "",
    })

    const inputRef = useRef<HTMLInputElement>(null)

    const meteredGenerate = useMeteredAction<
        {
            prompt: string
            provider: LLMProvider
            apiKey: string
            model: string
            baseUrl: string
            requestId: string
        },
        AutoFigureGenerateImageResponse
    >({
        actionCode: 'autofigure.generate_image',
        execute: async (params, confirmationToken) => {
            const response = await apiClient.post<AutoFigureGenerateImageResponse>(
                '/api/v1/autofigure/generate-image',
                {
                    prompt: params.prompt,
                    provider: params.provider,
                    api_key: params.apiKey,
                    model: params.model,
                    base_url: params.baseUrl,
                    confirmation_token: confirmationToken || undefined,
                    client_request_id: params.requestId,
                },
                {
                    timeout: 300000,
                },
            )

            const data = response.data
            return {
                data,
                finalize: {
                    points_estimated_cost: data.points_estimated_cost,
                    points_actual_cost: data.points_actual_cost,
                    points_balance_after: data.points_balance_after,
                },
            }
        },
    })

    const generationState = meteredGenerate.isRunning ? 'generating' : 'idle'
    const estimatedPointsCost = meteredGenerate.estimatedCost
    const lastActualPointsCost = meteredGenerate.lastActualCost
    const pendingCharge = meteredGenerate.pendingCharge
    const refreshMeteredEstimate = meteredGenerate.refreshEstimate

    const handleGeneratedResult = useCallback((data: AutoFigureGenerateImageResponse) => {
        if (!data.image_base64) {
            console.error('[ImageGen] No image_base64 in response:', data)
            throw new Error('No image in response')
        }

        console.log('[ImageGen] Image generated successfully, base64 length:', data.image_base64.length)
        if (onImageGenerated) {
            console.log('[ImageGen] Calling onImageGenerated callback')
            onImageGenerated(data.image_base64)
            console.log('[ImageGen] onImageGenerated callback completed')
        } else {
            console.warn('[ImageGen] onImageGenerated callback is not defined!')
        }

        const settledEstimate = Math.max(0, Number(data.points_estimated_cost || estimatedPointsCost || 0))
        const settledActual = Math.max(0, Number(data.points_actual_cost || settledEstimate || 0))
        if (settledEstimate > 0 || settledActual > 0) {
            const settleHint = settledEstimate === settledActual
                ? `Charged ${settledActual} points.`
                : `Estimated ${settledEstimate}, settled ${settledActual} points.`
            addToast({
                type: 'success',
                title: 'Image generated',
                description: settleHint,
            })
        }

        setPrompt('')
        setShowChargeConfirmDialog(false)
        meteredGenerate.clearPendingCharge()
    }, [addToast, estimatedPointsCost, meteredGenerate, onImageGenerated])

    // Load saved config from localStorage (excluding apiKey for security)
    useEffect(() => {
        const savedConfig = localStorage.getItem('autofigure-imagegen-config')
        if (savedConfig) {
            try {
                const parsed = JSON.parse(savedConfig)
                // NEVER load apiKey from localStorage for security
                const { apiKey, ...safeConfig } = parsed
                setImageGenConfig(prev => ({
                    ...prev,
                    ...safeConfig,
                    apiKey: ""  // Always start with empty apiKey
                }))
            } catch (e) {
                console.error('[ImageGen] Failed to load saved config:', e)
            }
        }
    }, [])

    // Focus input when switching to generation mode
    useEffect(() => {
        if (mode === 'generation' && inputRef.current) {
            inputRef.current.focus()
        }
    }, [mode])

    const refreshEstimate = useCallback(async () => {
        try {
            await refreshMeteredEstimate()
        } catch {
            // keep silent for preview errors
        }
    }, [refreshMeteredEstimate])

    useEffect(() => {
        const pref = autoChargePreferencesQuery.data?.items?.find(
            (item) => item.action_code === 'autofigure.generate_image',
        )
        if (!pref) {
            return
        }
        setAutoSubscribeChoice(Boolean(pref.enabled))
        setSingleChargeLimitInput(String(pref.max_single_charge || 0))
        setDailyChargeLimitInput(String(pref.max_daily_auto_charge || 0))
    }, [autoChargePreferencesQuery.data])

    useEffect(() => {
        if (mode !== 'generation') {
            return
        }

        void refreshEstimate()
    }, [mode, refreshEstimate])

    if (!session) return null

    const totalIterations = session.iterations.length

    const handlePrevious = () => {
        if (currentIterationIndex > 0) {
            const newIndex = currentIterationIndex - 1
            setCurrentIterationIndex(newIndex)
            const iteration = session.iterations[newIndex]
            if (iteration) {
                onLoadIteration(iteration.xml)
            }
        }
    }

    const handleNext = () => {
        if (currentIterationIndex < totalIterations - 1) {
            const newIndex = currentIterationIndex + 1
            setCurrentIterationIndex(newIndex)
            const iteration = session.iterations[newIndex]
            if (iteration) {
                onLoadIteration(iteration.xml)
            }
        }
    }

    const handleContinueWithFeedback = async () => {
        await onContinue(feedback || undefined, score)
        setFeedback("")
        setScore(undefined)
        setShowFeedback(false)
    }

    const handleExportPptx = async () => {
        setIsExporting(true)
        try {
            const filePath = await exportPptx(currentIterationIndex + 1)
            if (filePath) {
                await refreshFileTree()
                addToast({
                    title: "PPTX exported",
                    description: `Saved to ${filePath}`,
                    type: "success",
                })
            }
        } catch (err: any) {
            setError(err.message || "Failed to export PPTX")
        } finally {
            setIsExporting(false)
        }
    }

    const handleDownloadClick = async () => {
        if (onOpenExportHub) {
            onOpenExportHub()
            return
        }

        if (!onDownloadPng) return
        await onDownloadPng()
    }

    const handleGenerateImage = async () => {
        if (!prompt.trim()) return
        // Require all configuration fields
        if (
            !imageGenConfig.apiKey ||
            !imageGenConfig.model ||
            (imageGenConfig.provider !== 'gemini' && !imageGenConfig.baseUrl)
        ) {
            setShowSettings(true)
            return
        }

        const requestId =
            typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID
                ? globalThis.crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

        try {
            const data = await meteredGenerate.run({
                prompt: prompt.trim(),
                provider: imageGenConfig.provider,
                apiKey: imageGenConfig.apiKey,
                model: imageGenConfig.model,
                baseUrl: imageGenConfig.baseUrl,
                requestId,
            })
            if (!data) {
                setShowChargeConfirmDialog(true)
                return
            }
            handleGeneratedResult(data)
        } catch (err: any) {
            console.error('[ImageGen] Generation failed:', err)
            addToast({
                type: 'error',
                title: 'Image generation failed',
                description: err?.message || 'Please try again.',
            })
        } finally {
            void refreshEstimate()
        }
    }

    const handleConfirmCharge = async () => {
        if (!pendingCharge) {
            return
        }
        try {
            const singleLimit = Math.max(0, Math.floor(Number(singleChargeLimitInput || '0')))
            const dailyLimit = Math.max(0, Math.floor(Number(dailyChargeLimitInput || '0')))
            const result = await meteredGenerate.confirmAndRetry({
                subscribe_auto_charge: autoSubscribeChoice,
                max_single_charge: singleLimit,
                max_daily_auto_charge: dailyLimit,
                source: 'modal_confirm',
            })

            setShowChargeConfirmDialog(false)

            if (result) {
                handleGeneratedResult(result)
            }
        } catch (error) {
            addToast({
                type: 'error',
                title: 'Charge confirmation failed',
                description: error instanceof Error ? error.message : 'Please retry.',
            })
        }
    }

    const handleCancelCharge = () => {
        setShowChargeConfirmDialog(false)
        meteredGenerate.cancelPending()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleGenerateImage()
        } else if (e.key === 'Escape') {
            setMode('iteration')
        }
    }

    const handleSaveSettings = (config: typeof imageGenConfig) => {
        setImageGenConfig(config)
        // Save config WITHOUT apiKey for security
        const { apiKey, ...configWithoutApiKey } = config
        localStorage.setItem('autofigure-imagegen-config', JSON.stringify(configWithoutApiKey))
        setShowSettings(false)
    }

    // Render Generation Mode
    if (mode === 'generation') {
        return (
            <>
                <div className="af-iteration-controls af-generation-mode">
                    {/* Back Button */}
                    <button
                        className="af-icon-btn"
                        onClick={() => setMode('iteration')}
                        title="Back to iteration controls"
                        style={{ width: '36px', height: '36px' }}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    {/* Settings Button */}
                    <button
                        className="af-icon-btn"
                        onClick={() => setShowSettings(true)}
                        title="Image generation settings"
                        style={{
                            width: '36px',
                            height: '36px',
                            borderColor: (!imageGenConfig.apiKey || !imageGenConfig.model || (imageGenConfig.provider !== 'gemini' && !imageGenConfig.baseUrl)) ? 'var(--af-accent-primary)' : undefined,
                            color: (!imageGenConfig.apiKey || !imageGenConfig.model || (imageGenConfig.provider !== 'gemini' && !imageGenConfig.baseUrl)) ? 'var(--af-accent-primary)' : undefined,
                        }}
                    >
                        <Settings2 className="w-5 h-5" />
                    </button>

                    {/* Input Field */}
                    <div className="af-gen-input-wrapper">
                        <input
                            ref={inputRef}
                            type="text"
                            className="af-gen-input"
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Describe the image to generate..."
                            disabled={generationState === 'generating'}
                        />
                    </div>

                    {/* Send Button */}
                    <button
                        className="af-gen-send-btn"
                        onClick={handleGenerateImage}
                        disabled={generationState === 'generating' || !prompt.trim()}
                        title="Generate image (Enter)"
                    >
                        {generationState === 'generating' ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <ArrowRight className="w-5 h-5" />
                        )}
                    </button>

                    {estimatedPointsCost !== null ? (
                        <div className="af-points-chip" title="Estimated points deducted immediately, then settled by actual usage.">
                            ~{estimatedPointsCost} pts
                        </div>
                    ) : null}
                </div>

                {lastActualPointsCost !== null ? (
                    <div className="af-points-settle-note">
                        Settled: {lastActualPointsCost} pts
                    </div>
                ) : null}

                {/* Settings Modal */}
                <ImageGenSettings
                    isOpen={showSettings}
                    onClose={() => setShowSettings(false)}
                    config={imageGenConfig}
                    onSave={handleSaveSettings}
                />
            </>
        )
    }

    const autoChargePref = autoChargePreferencesQuery.data?.items?.find(
        (item) => item.action_code === 'autofigure.generate_image',
    )

    // Render Iteration Mode (default)
    return (
        <>
            {/* Main Floating Controls */}
            <div className="af-iteration-controls">
                <div className="af-iteration-block af-iteration-center">
                    <span className="af-controls-label">Iteration</span>
                    <div className="af-iteration-row">
                        <div className="af-iteration-info">
                            <span className="af-iteration-badge">
                                Iteration {currentIterationIndex + 1}
                            </span>
                        </div>

                        <div className="af-iteration-dots">
                            {session.iterations.map((_, i) => (
                                <button
                                    key={i}
                                    className={`af-iteration-dot completed ${i === currentIterationIndex ? 'current' : ''}`}
                                    onClick={() => {
                                        setCurrentIterationIndex(i)
                                        const iteration = session.iterations[i]
                                        if (iteration) {
                                            onLoadIteration(iteration.xml)
                                        }
                                    }}
                                    title={`Iteration ${i + 1}`}
                                />
                            ))}
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                className="af-icon-btn"
                                onClick={handlePrevious}
                                disabled={currentIterationIndex === 0}
                                title="Previous iteration"
                                style={{ width: '32px', height: '32px', opacity: currentIterationIndex === 0 ? 0.5 : 1 }}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                className="af-icon-btn"
                                onClick={handleNext}
                                disabled={currentIterationIndex >= totalIterations - 1}
                                title="Next iteration"
                                style={{ width: '32px', height: '32px', opacity: currentIterationIndex >= totalIterations - 1 ? 0.5 : 1 }}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="af-iteration-block af-iteration-downloads">
                    <span className="af-controls-label">Downloads</span>
                    <div className="af-iteration-row">
                        <button
                            className="af-btn-secondary"
                            onClick={handleDownloadClick}
                            disabled={isGenerating || !onDownloadPng}
                            style={{ opacity: isGenerating || !onDownloadPng ? 0.5 : 1 }}
                        >
                            <Download className="w-4 h-4 mr-1 inline" />
                            PNG
                        </button>
                        <button
                            className="af-btn-secondary"
                            onClick={handleExportPptx}
                            disabled={isGenerating || isExporting}
                            style={{ opacity: isGenerating || isExporting ? 0.5 : 1 }}
                        >
                            {isExporting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1 inline-block" />
                                    Exporting
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4 mr-1 inline" />
                                    PPTX
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="af-iteration-block af-iteration-actions">
                    <span className="af-controls-label">Controls</span>
                    <div className="af-iteration-row">
                        <button
                            className={`af-btn-secondary ${showFeedback ? 'active' : ''}`}
                            onClick={() => setShowFeedback(!showFeedback)}
                            style={showFeedback ? { borderColor: 'var(--af-accent-primary)', color: 'var(--af-accent-primary)' } : {}}
                        >
                            <MessageSquare className="w-4 h-4 mr-1 inline" />
                            Feedback
                        </button>

                        <button
                            className="af-btn-secondary"
                            onClick={showFeedback ? handleContinueWithFeedback : () => onContinue()}
                            disabled={isGenerating}
                            style={{ opacity: isGenerating ? 0.5 : 1 }}
                        >
                            {isGenerating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1 inline-block" />
                                    Processing
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4 mr-1 inline" />
                                    Continue
                                </>
                            )}
                        </button>

                        <button
                            className="af-btn-primary"
                            onClick={onFinalize}
                            disabled={isGenerating}
                            style={{ opacity: isGenerating ? 0.5 : 1 }}
                        >
                            <Sparkles className="w-4 h-4 mr-1 inline" />
                            Render
                        </button>
                    </div>
                </div>
            </div>

            <Dialog
                open={showChargeConfirmDialog}
                onOpenChange={(open) => {
                    setShowChargeConfirmDialog(open)
                    if (!open) {
                        meteredGenerate.cancelPending()
                    }
                }}
            >
                <DialogContent className="max-w-md border border-gray-300 bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-black">Confirm points charge</DialogTitle>
                        <DialogDescription>
                            This action is estimated to cost <span className="font-semibold text-black">{pendingCharge?.estimated_cost ?? 0}</span> points.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 border-t border-dashed border-gray-300 pt-3">
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={autoSubscribeChoice}
                                onChange={(event) => setAutoSubscribeChoice(event.target.checked)}
                            />
                            Enable auto-charge for future AutoFigure runs
                        </label>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <div className="mb-1 text-xs text-gray-500">Single limit</div>
                                <Input
                                    value={singleChargeLimitInput}
                                    onChange={(event) => setSingleChargeLimitInput(event.target.value)}
                                    className="h-8 border-gray-300"
                                />
                            </div>
                            <div>
                                <div className="mb-1 text-xs text-gray-500">Daily limit</div>
                                <Input
                                    value={dailyChargeLimitInput}
                                    onChange={(event) => setDailyChargeLimitInput(event.target.value)}
                                    className="h-8 border-gray-300"
                                />
                            </div>
                        </div>

                        <div className="text-xs text-gray-500">
                            Current auto-charge: {autoChargePref?.enabled ? 'On' : 'Off'}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            className="border-gray-300 text-gray-700"
                            onClick={handleCancelCharge}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            className="bg-black text-white hover:bg-black/90"
                            onClick={handleConfirmCharge}
                            disabled={meteredGenerate.isRunning}
                        >
                            Confirm charge
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Feedback Panel (appears above controls when active) */}
            {showFeedback && (
                <div
                    className="absolute bottom-28 left-1/2 transform -translate-x-1/2 w-96 max-w-[calc(100%-32px)]"
                    style={{
                        background: 'var(--af-bg-elevated)',
                        backdropFilter: 'blur(12px)',
                        padding: '16px',
                        borderRadius: '16px',
                        border: '1px solid var(--af-border-primary)',
                        boxShadow: 'var(--af-shadow-lg)',
                        zIndex: 16,
                    }}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" style={{ color: 'var(--af-accent-primary)' }} />
                            <span className="font-medium" style={{ color: 'var(--af-text-primary)' }}>Add Feedback</span>
                        </div>
                        <button
                            className="af-icon-btn"
                            onClick={() => setShowFeedback(false)}
                            style={{ width: '28px', height: '28px' }}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <textarea
                        value={feedback}
                        onChange={e => setFeedback(e.target.value)}
                        placeholder="Describe what should be improved..."
                        className="af-input"
                        style={{
                            width: '100%',
                            minHeight: '80px',
                            resize: 'vertical',
                            marginBottom: '12px',
                        }}
                    />

                    <div className="flex items-center gap-3">
                        <label className="text-xs" style={{ color: 'var(--af-text-tertiary)' }}>
                            Your Score (optional):
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            value={score || ""}
                            onChange={e => setScore(e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="0-10"
                            className="af-input"
                            style={{ width: '80px' }}
                        />
                        <div className="flex-1" />
                        <button
                            className="af-btn-primary"
                            onClick={handleContinueWithFeedback}
                            disabled={isGenerating}
                        >
                            Submit & Continue
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
