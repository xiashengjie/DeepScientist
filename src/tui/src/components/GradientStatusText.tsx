import React from 'react'
import { Text } from 'ink'

import { theme } from '../semantic-colors.js'

type GradientStatusTextProps = {
  text: string
}

const hashWord = (value: string) => {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }
  return hash
}

const renderSegment = (segment: string, palette: string[]) => {
  const parts = segment.split(/(\s+)/)
  return parts.map((part, index) => {
    if (!part) return null
    if (part.trim().length === 0) {
      return <Text key={`space-${index}`}>{part}</Text>
    }
    const color = palette[hashWord(part) % palette.length]
    return (
      <Text key={`word-${index}`} color={color}>
        {part}
      </Text>
    )
  })
}

export const GradientStatusText: React.FC<GradientStatusTextProps> = ({ text }) => {
  const palette = theme.ui.gradient.length > 0 ? [...theme.ui.gradient] : [theme.text.accent]
  const segments = text.split('|').map((segment) => segment.trim())

  return (
    <Text wrap="truncate">
      {segments.map((segment, index) => (
        <React.Fragment key={`segment-${index}`}>
          {index > 0 ? <Text color={theme.text.secondary}> | </Text> : null}
          {renderSegment(segment, palette)}
        </React.Fragment>
      ))}
    </Text>
  )
}
