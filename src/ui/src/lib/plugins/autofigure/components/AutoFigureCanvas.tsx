"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { DrawIoEmbed, type DrawIoEmbedRef } from "react-drawio"
import { Loader2 } from "lucide-react"
import { useAutoFigure } from "../contexts/autofigure-context"
import IterationControlsFloating from "./IterationControlsFloating"
import { extractDiagramXML } from "../lib/utils"

const getDrawioBaseUrl = () => {
  if (typeof window === "undefined") return "/drawio/index.html"
  return `${window.location.origin}/drawio/index.html`
}



export interface AutoFigureCanvasExportBridge {
  getSketchPreview: () => Promise<string | null>
  downloadSketchPng: () => Promise<string | null>
  downloadSketchSvg: () => Promise<boolean>
}
interface AutoFigureCanvasProps {
  onRender?: () => void
  onError?: (message: string) => void
  onIterateStart?: () => void
  onRenderStart?: () => void
  onOpenExportHub?: () => void
  onExportBridgeChange?: (bridge: AutoFigureCanvasExportBridge | null) => void
}

export default function AutoFigureCanvas({
  onRender,
  onError,
  onIterateStart,
  onRenderStart,
  onOpenExportHub,
  onExportBridgeChange,
}: AutoFigureCanvasProps) {
  const {
    session,
    isGenerating,
    currentXml,
    updateCurrentXml,
    continueIteration,
    finalizeLayout,
    startEnhancement,
    getCurrentIteration,
    setError,
  } = useAutoFigure()

  const [isLoaded, setIsLoaded] = useState(false)
  const [isDrawioReady, setIsDrawioReady] = useState(false)

  const drawioRef = useRef<DrawIoEmbedRef | null>(null)
  const hasCalledOnLoadRef = useRef(false)
  const exportResolverRef = useRef<{
    mode: "xml" | "png" | "svg"
    resolve: (result: { success: boolean; xml?: string; pngData?: string; error?: string }) => void
  } | null>(null)
  const canvasKey = session?.sessionId || "autofigure-blank"

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    hasCalledOnLoadRef.current = false
    setIsDrawioReady(false)
  }, [canvasKey])

  useEffect(() => {
    if (drawioRef.current && currentXml && isDrawioReady) {
      const timeoutId = setTimeout(() => {
        drawioRef.current?.load({ xml: currentXml })
      }, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [currentXml, isDrawioReady])

  const onDrawioLoad = useCallback(() => {
    if (hasCalledOnLoadRef.current) return
    hasCalledOnLoadRef.current = true
    setIsDrawioReady(true)
  }, [])

  const resolveXmlFromExport = useCallback((value: string): string => {
    const trimmed = value?.trim()
    if (!trimmed) {
      throw new Error("Empty draw.io export data.")
    }

    if (trimmed.startsWith("data:image/svg+xml")) {
      return extractDiagramXML(trimmed)
    }

    if (trimmed.startsWith("<svg")) {
      return extractDiagramXML(trimmed)
    }

    if (
      trimmed.includes("<mxfile") ||
      trimmed.includes("<mxGraphModel") ||
      trimmed.includes("<diagram")
    ) {
      return trimmed
    }

    throw new Error("Unexpected draw.io export format.")
  }, [])

  const handleDrawioSave = useCallback(
    (data: { xml: string; parentEvent?: string }) => {
      if (!data?.xml) return
      if (data.parentEvent && data.parentEvent !== "save" && data.parentEvent !== "autosave") {
        return
      }
      try {
        const extractedXml = resolveXmlFromExport(data.xml)
        updateCurrentXml(extractedXml)
      } catch (err) {
        // Ignore invalid exports to avoid clearing the canvas with bad data.
      }
    },
    [resolveXmlFromExport, updateCurrentXml]
  )

  const handleDrawioExport = useCallback((data: any) => {
    console.log("[AutoFigure Canvas] handleDrawioExport called")
    console.log("[AutoFigure Canvas] exportResolverRef.current:", !!exportResolverRef.current)

    const request = exportResolverRef.current
    if (!request) {
      console.log("[AutoFigure Canvas] No pending export request, ignoring")
      return
    }

    exportResolverRef.current = null
    const payload = typeof data?.data === "string" ? data.data : typeof data === "string" ? data : ""
    console.log("[AutoFigure Canvas] Export payload length:", payload?.length)
    console.log("[AutoFigure Canvas] Export mode:", request.mode)

    if (request.mode === "xml") {
      try {
        const extractedXml = resolveXmlFromExport(payload)
        console.log("[AutoFigure Canvas] XML extraction successful, length:", extractedXml.length)
        request.resolve({ success: true, xml: extractedXml })
      } catch (error) {
        console.log("[AutoFigure Canvas] XML extraction failed:", error)
        request.resolve({ success: false, error: String(error) })
      }
      return
    }

    if (request.mode === "svg") {
      const rawSvg = payload?.trim()
      if (!rawSvg) {
        request.resolve({ success: false, error: "Failed to export SVG." })
        return
      }
      request.resolve({ success: true, pngData: rawSvg })
      return
    }

    const raw = payload
    if (!raw) {
      console.log("[AutoFigure Canvas] PNG export failed - no data")
      request.resolve({ success: false, error: "Failed to export PNG." })
      return
    }
    console.log("[AutoFigure Canvas] PNG export successful")
    request.resolve({ success: true, pngData: raw })
  }, [resolveXmlFromExport])

  const getCurrentXmlFromDrawio = useCallback((): Promise<string> => {
    console.log("[AutoFigure Canvas] getCurrentXmlFromDrawio called")
    console.log("[AutoFigure Canvas] drawioRef.current:", !!drawioRef.current)
    console.log("[AutoFigure Canvas] isDrawioReady:", isDrawioReady)

    return new Promise((resolve, reject) => {
      if (!drawioRef.current || !isDrawioReady) {
        console.log("[AutoFigure Canvas] ERROR: Draw.io not ready")
        reject(new Error("Draw.io is not ready. Please wait for the editor to load."))
        return
      }

      console.log("[AutoFigure Canvas] Setting up export resolver...")
      exportResolverRef.current = {
        mode: "xml",
        resolve: (result) => {
          console.log("[AutoFigure Canvas] Export resolver callback received:", result.success ? "SUCCESS" : "FAILED")
          if (result.success && result.xml) {
            console.log("[AutoFigure Canvas] XML length:", result.xml.length)
            resolve(result.xml)
          } else {
            console.log("[AutoFigure Canvas] Export error:", result.error)
            reject(new Error(result.error || "Failed to extract XML from draw.io"))
          }
        },
      }

      console.log("[AutoFigure Canvas] Calling exportDiagram({ format: 'xmlsvg' })...")
      drawioRef.current.exportDiagram({ format: "xmlsvg" })

      setTimeout(() => {
        if (exportResolverRef.current) {
          console.log("[AutoFigure Canvas] TIMEOUT: Export did not complete in 5 seconds")
          exportResolverRef.current = null
          reject(new Error("Draw.io export timed out. Please try again."))
        }
      }, 5000)
    })
  }, [isDrawioReady])

  const exportPngFromDrawio = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!drawioRef.current || !isDrawioReady) {
        reject(new Error("Draw.io is not ready. Please wait for the editor to load."))
        return
      }

      exportResolverRef.current = {
        mode: "png",
        resolve: (result) => {
          if (result.success && result.pngData) {
            resolve(result.pngData)
          } else {
            reject(new Error(result.error || "Failed to export PNG from draw.io"))
          }
        },
      }

      drawioRef.current.exportDiagram({ format: "png" })

      setTimeout(() => {
        if (exportResolverRef.current) {
          exportResolverRef.current = null
          reject(new Error("Draw.io export timed out. Please try again."))
        }
      }, 5000)
    })
  }, [isDrawioReady])


  const normalizeSvgPayload = useCallback((payload: string): string => {
    const trimmed = payload.trim()
    if (trimmed.startsWith('data:image/svg+xml')) {
      const commaIndex = trimmed.indexOf(',')
      if (commaIndex >= 0) {
        const encoded = trimmed.slice(commaIndex + 1)
        if (trimmed.includes(';base64,')) {
          return atob(encoded)
        }
        return decodeURIComponent(encoded)
      }
    }
    return trimmed
  }, [])

  const exportSvgFromDrawio = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!drawioRef.current || !isDrawioReady) {
        reject(new Error('Draw.io is not ready. Please wait for the editor to load.'))
        return
      }

      exportResolverRef.current = {
        mode: 'svg',
        resolve: (result) => {
          if (result.success && result.pngData) {
            resolve(result.pngData)
          } else {
            reject(new Error(result.error || 'Failed to export SVG from draw.io'))
          }
        },
      }

      drawioRef.current.exportDiagram({ format: 'svg' })

      setTimeout(() => {
        if (exportResolverRef.current) {
          exportResolverRef.current = null
          reject(new Error('Draw.io SVG export timed out. Please try again.'))
        }
      }, 5000)
    })
  }, [isDrawioReady])

  const downloadSvgFromDrawio = useCallback(async (): Promise<boolean> => {
    try {
      const rawPayload = await exportSvgFromDrawio()
      const svgText = normalizeSvgPayload(rawPayload)
      if (!svgText || !svgText.includes('<svg')) {
        throw new Error('Invalid SVG export payload.')
      }

      const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = `autofigure_sketch_${Date.now()}.svg`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(objectUrl)
      return true
    } catch (err) {
      console.error('[AutoFigure Canvas] Failed to download SVG:', err)
      return false
    }
  }, [exportSvgFromDrawio, normalizeSvgPayload])

  const handleContinue = async (feedback?: string, score?: number) => {
    console.log("[AutoFigure Canvas] handleContinue called")
    console.log("[AutoFigure Canvas] feedback:", feedback)
    console.log("[AutoFigure Canvas] score:", score)
    try {
      console.log("[AutoFigure Canvas] Calling onIterateStart...")
      onIterateStart?.()
      console.log("[AutoFigure Canvas] Getting XML from draw.io...")
      const editedXml = await getCurrentXmlFromDrawio()
      console.log("[AutoFigure Canvas] Got XML, length:", editedXml?.length)
      console.log("[AutoFigure Canvas] Calling continueIteration...")
      await continueIteration(editedXml, feedback, score)
      console.log("[AutoFigure Canvas] continueIteration completed")
    } catch (err: any) {
      console.log("[AutoFigure Canvas] ERROR in handleContinue:", err)
      const message = err.message || "Failed to get diagram from canvas."
      setError(message)
      onError?.(message)
    }
  }

  const handleRender = async () => {
    try {
      onRenderStart?.()
      const finalXml = await getCurrentXmlFromDrawio()
      await finalizeLayout(finalXml)
      await startEnhancement((success, images) => {
        if (!success) {
          onError?.("Rendering failed. Please try again.")
          return
        }
        if (images.length > 0) {
          onRender?.()
        }
      })
    } catch (err: any) {
      const message = err.message || "Failed to render from canvas."
      setError(message)
      onError?.(message)
    }
  }

  const getCanvasPreview = useCallback(async (): Promise<string | null> => {
    try {
      const pngData = await exportPngFromDrawio()
      const dataUrl = pngData.startsWith("data:")
        ? pngData
        : `data:image/png;base64,${pngData}`
      return dataUrl
    } catch (err: any) {
      console.error("[AutoFigure Canvas] Failed to get preview:", err)
      return null
    }
  }, [exportPngFromDrawio])

  const handleDownloadPng = useCallback(async (): Promise<string | null> => {
    try {
      const dataUrl = await getCanvasPreview()
      if (!dataUrl) {
        throw new Error("Failed to export PNG from canvas.")
      }
      const link = document.createElement("a")
      link.href = dataUrl
      link.download = `autofigure_canvas_${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      link.remove()
      return dataUrl
    } catch (err: any) {
      const message = err?.message || "Failed to export PNG from canvas."
      setError(message)
      onError?.(message)
      return null
    }
  }, [getCanvasPreview, onError, setError])

  const loadIteration = (xml: string) => {
    if (drawioRef.current && isDrawioReady) {
      drawioRef.current.load({ xml })
    }
  }

  const handleImageGenerated = async (imageBase64: string) => {
    if (!drawioRef.current || !isDrawioReady) {
      setError("Draw.io is not ready. Please wait for the editor to load.")
      return
    }

    try {
      let latestXml: string
      try {
        latestXml = await getCurrentXmlFromDrawio()
        updateCurrentXml(latestXml)
      } catch {
        if (!currentXml) {
          setError("No diagram XML available. Please wait for the diagram to load.")
          return
        }
        latestXml = currentXml
      }

      const dataUrl = `data:image/png;base64,${imageBase64}`
      const encodedDataUrl = dataUrl.replace(/;/g, "%3B")
      const cellId = `img-${Date.now()}`
      const modifiedXml = insertImageIntoXml(latestXml, encodedDataUrl, cellId)

      if (!modifiedXml) {
        setError("Failed to add image to diagram XML")
        return
      }

      updateCurrentXml(modifiedXml)
      drawioRef.current.load({ xml: modifiedXml })
    } catch (err: any) {
      setError(err.message || "Failed to insert image into canvas")
    }
  }

  useEffect(() => {
    if (!onExportBridgeChange) return

    onExportBridgeChange({
      getSketchPreview: getCanvasPreview,
      downloadSketchPng: handleDownloadPng,
      downloadSketchSvg: downloadSvgFromDrawio,
    })

    return () => {
      onExportBridgeChange(null)
    }
  }, [downloadSvgFromDrawio, getCanvasPreview, handleDownloadPng, onExportBridgeChange])

  return (
    <div className="af-workspace-canvas">
      <div className="af-canvas-container">
        {isLoaded ? (
          <div className="af-drawio-embed" style={{ width: "100%", height: "100%" }}>
            <DrawIoEmbed
              key={canvasKey}
              ref={drawioRef}
              onLoad={onDrawioLoad}
              onExport={handleDrawioExport}
              onSave={handleDrawioSave}
              baseUrl={getDrawioBaseUrl()}
              urlParameters={{
                ui: "min",
                spin: true,
                libraries: false,
                saveAndExit: false,
                noExitBtn: true,
                dark: false,
              }}
            />
          </div>
        ) : (
          <div className="af-canvas-loading">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--af-accent-primary)" }} />
          </div>
        )}
      </div>

      {session && !isGenerating && (
        <IterationControlsFloating
          onContinue={handleContinue}
          onFinalize={handleRender}
          onLoadIteration={loadIteration}
          onImageGenerated={handleImageGenerated}
          onDownloadPng={handleDownloadPng}
          onOpenExportHub={onOpenExportHub}
        />
      )}

      {!session && isDrawioReady && (
        <div className="af-blank-canvas-hint">
          <span>Blank canvas ready.</span>
        </div>
      )}
    </div>
  )
}

function insertImageIntoXml(xml: string, imageUrl: string, cellId: string): string | null {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, "text/xml")

    const parseError = doc.querySelector("parsererror")
    if (parseError) {
      return null
    }

    let mxGraphModel = doc.querySelector("mxGraphModel")
    if (!mxGraphModel && doc.documentElement.tagName === "mxGraphModel") {
      mxGraphModel = doc.documentElement
    }

    if (!mxGraphModel) {
      return null
    }

    const root = mxGraphModel.querySelector("root")
    if (!root) {
      return null
    }

    const mxCell = doc.createElement("mxCell")
    mxCell.setAttribute("id", cellId)
    mxCell.setAttribute("value", "")
    mxCell.setAttribute(
      "style",
      `shape=image;image=${imageUrl};imageAspect=0;aspect=fixed;verticalLabelPosition=bottom;verticalAlign=top;`
    )
    mxCell.setAttribute("vertex", "1")
    mxCell.setAttribute("parent", "1")

    const mxGeometry = doc.createElement("mxGeometry")
    mxGeometry.setAttribute("x", "50")
    mxGeometry.setAttribute("y", "50")
    mxGeometry.setAttribute("width", "150")
    mxGeometry.setAttribute("height", "150")
    mxGeometry.setAttribute("as", "geometry")

    mxCell.appendChild(mxGeometry)
    root.appendChild(mxCell)

    const serializer = new XMLSerializer()
    return serializer.serializeToString(doc)
  } catch {
    return null
  }
}
