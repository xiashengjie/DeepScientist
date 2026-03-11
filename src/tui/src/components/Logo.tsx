import React from 'react'
import { Box, Text } from 'ink'
import Gradient from 'ink-gradient'
import { useTerminalSize } from '../hooks/useTerminalSize.js'
import {
  PROMPT_SYMBOL,
  longAsciiData,
  shortAsciiData,
  longAsciiLogo,
  shortAsciiLogo,
  tinyAsciiLogo,
} from './AsciiArt.js'

const SIMPLE_PREFIX = '> '

const COLORS = {
  blue: '#4796E4',
  red: '#F38BA8',
  gradient: ['#9B59B6', '#8E44AD', '#C471ED', '#F64F9C'],
}

const getAsciiArtWidth = (asciiArt: string): number => {
  if (!asciiArt) return 0
  const lines = asciiArt.split('\n')
  return Math.max(...lines.map((line) => line.replace(/\s+$/, '').length))
}

const getPromptSymbolWidth = (): number => {
  return Math.max(...PROMPT_SYMBOL.map((line) => line.length))
}

interface SegmentedLineProps {
  line: string
  segments: { start: number; end: number; type: string }[]
  promptLine?: string
}

const SegmentedLine: React.FC<SegmentedLineProps> = ({ line, segments, promptLine }) => {
  const parts: React.ReactNode[] = []

  if (promptLine) {
    parts.push(
      <Text key="prompt" color={COLORS.blue}>
        {promptLine}
      </Text>
    )
  }

  const sortedSegments = [...segments].sort((a, b) => a.start - b.start)

  let lastEnd = 0

  sortedSegments.forEach((segment, idx) => {
    if (segment.start > lastEnd) {
      parts.push(
        <Text key={`gap-${idx}`}>{line.slice(lastEnd, segment.start)}</Text>
      )
    }

    const text = line.slice(segment.start, segment.end)

    if (segment.type === 'gradient') {
      parts.push(
        <Gradient key={`seg-${idx}`} colors={COLORS.gradient}>
          <Text>{text}</Text>
        </Gradient>
      )
    } else if (segment.type === 'blue') {
      parts.push(
        <Text key={`seg-${idx}`} color={COLORS.blue}>
          {text}
        </Text>
      )
    } else if (segment.type === 'red') {
      parts.push(
        <Text key={`seg-${idx}`} color={COLORS.red}>
          {text}
        </Text>
      )
    } else {
      parts.push(<Text key={`seg-${idx}`}>{text}</Text>)
    }

    lastEnd = segment.end
  })

  if (lastEnd < line.length) {
    parts.push(<Text key="tail">{line.slice(lastEnd)}</Text>)
  }

  return <Text>{parts}</Text>
}

interface TinyLogoProps {
  text: string
}

const TinyLogo: React.FC<TinyLogoProps> = ({ text }) => {
  const deep = text.slice(0, 4)
  const sci = text.slice(4, 7)
  const entist = text.slice(7)

  return (
    <Text>
      <Text color={COLORS.blue}>{SIMPLE_PREFIX}</Text>
      <Text color={COLORS.blue}>{deep}</Text>
      <Text color={COLORS.red}>{sci}</Text>
      <Gradient colors={COLORS.gradient}>
        <Text>{entist}</Text>
      </Gradient>
    </Text>
  )
}

export const Logo: React.FC = () => {
  const { columns } = useTerminalSize()
  const promptWidth = getPromptSymbolWidth()
  const longWidth = getAsciiArtWidth(longAsciiLogo) + promptWidth
  const shortWidth = getAsciiArtWidth(shortAsciiLogo) + promptWidth

  let asciiData: { lines: string[]; segments: { start: number; end: number; type: string }[][] }

  if (columns >= longWidth) {
    asciiData = longAsciiData
  } else if (columns >= shortWidth) {
    asciiData = shortAsciiData
  } else {
    return (
      <Box alignItems="flex-start" flexShrink={0} flexDirection="column">
        <TinyLogo text={tinyAsciiLogo} />
      </Box>
    )
  }

  const { lines, segments } = asciiData
  const maxLineWidth = Math.max(...lines.map((l) => l.length)) + promptWidth

  return (
    <Box alignItems="flex-start" width={maxLineWidth} flexShrink={0} flexDirection="column">
      {lines.map((line, idx) => (
        <SegmentedLine
          key={idx}
          line={line}
          segments={segments[idx]}
          promptLine={PROMPT_SYMBOL[idx] || ''}
        />
      ))}
    </Box>
  )
}
