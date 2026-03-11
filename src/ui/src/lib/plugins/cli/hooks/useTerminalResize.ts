'use client'

import { useEffect } from 'react'
import type { RefObject } from 'react'

export function useTerminalResize(
  containerRef: RefObject<HTMLElement>,
  onResize: (cols: number, rows: number) => void,
  getSize: () => { cols: number; rows: number } | null
) {
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let frameId: number | null = null
    let initialFrameId: number | null = null
    let lastSize: { cols: number; rows: number } | null = null
    const notifyResize = () => {
      if (!container.isConnected) return
      const size = getSize()
      if (!size) return
      if (lastSize && lastSize.cols === size.cols && lastSize.rows === size.rows) {
        return
      }
      lastSize = size
      try {
        onResize(size.cols, size.rows)
      } catch {
        // Ignore resize errors triggered after unmount/dispose.
      }
    }
    const observer = new ResizeObserver(() => {
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }
      frameId = window.requestAnimationFrame(() => {
        frameId = null
        notifyResize()
      })
    })
    observer.observe(container)
    initialFrameId = window.requestAnimationFrame(() => {
      initialFrameId = null
      notifyResize()
    })
    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }
      if (initialFrameId) {
        window.cancelAnimationFrame(initialFrameId)
      }
      observer.disconnect()
    }
  }, [containerRef, getSize, onResize])
}
