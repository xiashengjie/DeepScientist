"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ScrollStack, ScrollStackItem } from "@/components/react-bits"
import { Download, Play, Sparkles } from "lucide-react"

const TYPEWRITER_TEXT =
  "AutoFigure is reading your paper and laying out the first draft..."

function TypewriterText({ text, speed = 36 }: { text: string; speed?: number }) {
  const [display, setDisplay] = useState("")

  useEffect(() => {
    setDisplay("")
    let index = 0
    const interval = setInterval(() => {
      index += 1
      setDisplay(text.slice(0, index))
      if (index >= text.length) {
        clearInterval(interval)
      }
    }, speed)

    return () => clearInterval(interval)
  }, [text, speed])

  return (
    <span className="af-typewriter">
      {display}
      <span className="af-typewriter-caret" aria-hidden="true" />
    </span>
  )
}

export default function AutoFigureWaitingHero({
  progress,
  label,
  phase = "generate",
}: {
  progress: number
  label: string
  phase?: "generate" | "iterate" | "render"
}) {
  const clampedProgress = useMemo(() => Math.min(100, Math.max(0, progress)), [progress])
  const [stackProgress, setStackProgress] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  const lastProgressRef = useRef(0)

  useEffect(() => {
    const durationMs = 90_000
    const tick = (now: number) => {
      if (!startRef.current) {
        startRef.current = now
      }
      const elapsed = now - startRef.current
      const looped = elapsed % durationMs
      const nextProgress = (looped / durationMs) * 100
      if (Math.abs(nextProgress - lastProgressRef.current) > 0.02) {
        lastProgressRef.current = nextProgress
        setStackProgress(nextProgress)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      rafRef.current = null
      startRef.current = null
    }
  }, [])

  const stage = useMemo(() => {
    const normalized = Math.min(99.999, Math.max(0, stackProgress))
    return Math.max(1, Math.min(4, Math.floor((normalized / 100) * 4) + 1))
  }, [stackProgress])

  const sequenceTimings = useMemo(() => {
    const enter = 6.25
    const hold = 10
    const exit = 6.25
    const total = enter + hold + exit
    return {
      enter: enter / total,
      hold: hold / total,
      exit: exit / total,
    }
  }, [])

  const phaseLabel = useMemo(() => {
    if (phase === "iterate") return "AutoFigure refining your draft"
    if (phase === "render") return "AutoFigure rendering the final visual"
    return "AutoFigure drafting your first layout"
  }, [phase])

  return (
    <div className="af-waiting-hero">
      <div className="af-waiting-header">
        <div className="af-waiting-kicker">{phaseLabel}</div>
        <h2>
          DeepScientist is preparing your <span className="af-stack-highlight">Canvas</span>
        </h2>
        <p>
          We generate multiple drafts so you can choose the strongest layout. Edit the sketch or
          let the model improve it, then render and download in one click.
        </p>
        <div className="af-waiting-meta">
          <span>{label}</span>
          <span>{Math.round(clampedProgress)}%</span>
          <span>Step {stage} / 4</span>
        </div>
      </div>

      <div className="af-waiting-stack">
        <ScrollStack
          className="af-scroll-stack"
          progress={stackProgress}
          mode="sequence"
          sequenceTimings={sequenceTimings}
          sequenceDistance={56}
          itemDistance={80}
          itemScale={0.05}
          itemStackDistance={24}
          stackPosition="22%"
          scaleEndPosition="12%"
          baseScale={0.88}
          rotationAmount={0}
          blurAmount={2}
        >
          <ScrollStackItem itemClassName={`af-stack-item af-stack-item-1 ${stage === 1 ? "is-active" : ""}`}>
            <div className="af-stack-card">
              <div className="af-stack-card-head">
                <span className="af-stack-number">1</span>
                <div>
                  <div className="af-stack-title">Parsing & Loading</div>
                  <div className="af-stack-subtitle">Building the first draft from your paper.</div>
                </div>
              </div>
              <div className="af-stack-body">
                <TypewriterText text={TYPEWRITER_TEXT} />
                <div className="af-stack-keyline">
                  Preparing <span className="af-stack-highlight">Canvas</span> +{" "}
                  <span className="af-stack-strong">Session</span> metadata.
                </div>
                <div className="af-stack-tip">Tip: Perfect time for a 20‑second stretch.</div>
              </div>
            </div>
          </ScrollStackItem>

          <ScrollStackItem itemClassName={`af-stack-item af-stack-item-2 ${stage === 2 ? "is-active" : ""}`}>
            <div className="af-stack-card">
              <div className="af-stack-card-head">
                <span className="af-stack-number">2</span>
                <div>
                  <div className="af-stack-title">Iterate the Draft</div>
                  <div className="af-stack-subtitle">
                    Adjust the sketch or let the model self‑critique.
                  </div>
                </div>
              </div>
              <div className="af-stack-body">
                <p>
                  When the first layout appears, edit manually or press{" "}
                  <span className="af-stack-highlight">Continue</span> to generate a better draft.
                </p>
                <div className="af-stack-keyline">
                  Your edits are preserved across iterations.
                </div>
                <button className="af-btn-secondary" type="button" disabled>
                  <Play className="w-4 h-4 mr-1 inline" />
                  Continue
                </button>
                <div className="af-stack-tip">Tip: The model enjoys polite feedback.</div>
              </div>
            </div>
          </ScrollStackItem>

          <ScrollStackItem itemClassName={`af-stack-item af-stack-item-3 ${stage === 3 ? "is-active" : ""}`}>
            <div className="af-stack-card">
              <div className="af-stack-card-head">
                <span className="af-stack-number">3</span>
                <div>
                  <div className="af-stack-title">Render the Final</div>
                  <div className="af-stack-subtitle">
                    Convert the chosen draft into a final render.
                  </div>
                </div>
              </div>
              <div className="af-stack-body">
                <p>
                  When the layout looks right, click{" "}
                  <span className="af-stack-highlight">Render</span> to apply your selected style
                  preset.
                </p>
                <div className="af-stack-keyline">
                  Rendering keeps your labels crisp and export‑ready.
                </div>
                <button className="af-btn-primary" type="button" disabled>
                  <Sparkles className="w-4 h-4 mr-1 inline" />
                  Render
                </button>
                <div className="af-stack-tip">Tip: Render once you are happy with the layout.</div>
              </div>
            </div>
          </ScrollStackItem>

          <ScrollStackItem itemClassName={`af-stack-item af-stack-item-4 ${stage === 4 ? "is-active" : ""}`}>
            <div className="af-stack-card">
              <div className="af-stack-card-head">
                <span className="af-stack-number">4</span>
                <div>
                  <div className="af-stack-title">Download Outputs</div>
                  <div className="af-stack-subtitle">
                    Export the canvas or the final render anytime.
                  </div>
                </div>
              </div>
              <div className="af-stack-body">
                <p>
                  Download <span className="af-stack-highlight">PNG</span>,{" "}
                  <span className="af-stack-highlight">PPTX</span>, or the final rendered image
                  once it completes.
                </p>
                <div className="af-stack-keyline">Files are saved to your project automatically.</div>
                <div className="af-stack-actions">
                  <button className="af-btn-secondary" type="button" disabled>
                    <Download className="w-4 h-4 mr-1 inline" />
                    PNG
                  </button>
                  <button className="af-btn-secondary" type="button" disabled>
                    <Download className="w-4 h-4 mr-1 inline" />
                    PPTX
                  </button>
                </div>
                <div className="af-stack-tip">Tip: Your future self loves tidy exports.</div>
              </div>
            </div>
          </ScrollStackItem>
        </ScrollStack>
      </div>
    </div>
  )
}
