"use client"

/**
 * Generation Overlay Component
 *
 * Shows a loading overlay while AutoFigure is generating.
 */

import { useAutoFigure } from "../contexts/autofigure-context"
import { Loader2 } from "lucide-react"

export default function GenerationOverlay() {
    const { isGenerating } = useAutoFigure()

    if (!isGenerating) return null

    return (
        <div className="af-generation-overlay">
            <div className="af-generation-modal">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--af-primary)]" />
                <h3 className="text-lg font-medium mt-4">Generating Figure...</h3>
                <p className="text-sm text-gray-500 mt-2">
                    This may take a minute. Please wait while we create your figure.
                </p>
            </div>
        </div>
    )
}
