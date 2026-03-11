"use client"

/**
 * AutoFigure Plugin
 *
 * AI-powered scientific figure generation plugin for DeepScientist.
 * CLI-aligned layout with session rail + workspace stepper/canvas.
 *
 * @module lib/plugins/autofigure/AutoFigurePlugin
 */

import { useEffect } from "react"
import type { PluginComponentProps } from "@/lib/types/plugin"
import { AutoFigureProvider } from "./contexts/autofigure-context"
import AutoFigureLayout from "./components/AutoFigureLayout"
import "./autofigure-morandi.css"

function AutoFigurePluginContent({ setTitle }: { setTitle: (title: string) => void }) {
  useEffect(() => {
    setTitle("AutoFigure")
  }, [setTitle])

  return <AutoFigureLayout />
}

export default function AutoFigurePlugin({ setTitle }: PluginComponentProps) {
  return (
    <AutoFigureProvider>
      <AutoFigurePluginContent setTitle={setTitle} />
    </AutoFigureProvider>
  )
}
