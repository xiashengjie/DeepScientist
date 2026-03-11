import React from 'react'
import { Box, Text } from 'ink'
import Gradient from 'ink-gradient'
import { Logo } from './Logo.js'
import { theme } from '../semantic-colors.js'
import { robotAsciiData } from './AsciiArt.js'
import type { ConnectorSnapshot, QuestSummary } from '../types.js'

// Colors matching AsciiArt
const COLORS = {
  blue: '#4796E4',
  red: '#F38BA8',
  gradient: ['#9B59B6', '#8E44AD', '#C471ED', '#F64F9C'],
}

interface SegmentedLineProps {
  line: string
  segments: { start: number; end: number; type: string }[]
}

const SegmentedLine: React.FC<SegmentedLineProps> = ({ line, segments }) => {
  const parts: React.ReactNode[] = []
  const sortedSegments = [...segments].sort((a, b) => a.start - b.start)
  let lastEnd = 0

  sortedSegments.forEach((segment, idx) => {
    if (segment.start > lastEnd) {
      parts.push(<Text key={`gap-${idx}`}>{line.slice(lastEnd, segment.start)}</Text>)
    }
    const text = line.slice(segment.start, segment.end)
    if (segment.type === 'gradient') {
      parts.push(
        <Gradient key={`seg-${idx}`} colors={COLORS.gradient}>
          <Text>{text}</Text>
        </Gradient>
      )
    } else if (segment.type === 'blue') {
      parts.push(<Text key={`seg-${idx}`} color={COLORS.blue}>{text}</Text>)
    } else if (segment.type === 'red') {
      parts.push(<Text key={`seg-${idx}`} color={COLORS.red}>{text}</Text>)
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

type WelcomePanelProps = {
  quests: QuestSummary[]
  browseQuestId: string | null
  connectors: ConnectorSnapshot[]
  baseUrl: string
  connectionState: 'connecting' | 'connected' | 'error'
}

export const WelcomePanel: React.FC<WelcomePanelProps> = ({
  quests,
  browseQuestId,
  connectors,
  baseUrl,
  connectionState,
}) => {
  const connectionText = connectionState
  const activeCount = quests.filter((quest) =>
    ['running', 'waiting_for_user'].includes(String(quest.status || ''))
  ).length
  const pendingDecisionCount = quests.reduce(
    (count, quest) =>
      count + (Array.isArray(quest.pending_decisions) ? quest.pending_decisions.length : 0),
    0
  )
  const connectionColor =
    connectionState === 'connected'
      ? theme.status.success
      : connectionState === 'error'
        ? theme.status.error
        : theme.status.warning
  const selectedQuest =
    quests.find((quest) => quest.quest_id === browseQuestId) ?? quests[0] ?? null
  const connectorSummary =
    connectors.length > 0
      ? connectors
          .map(
            (connector) =>
              `${connector.name}:${connector.inbox_count ?? 0}/${connector.outbox_count ?? 0}`
          )
          .join(' · ')
      : 'No connectors configured'
  const robotLines = robotAsciiData.lines
  const robotSegments = robotAsciiData.segments

  const infoLines = [
    { label: '', value: 'DeepScientist CLI', style: 'title' },
    { label: 'Home', value: 'request mode', style: 'normal' },
    { label: 'Server', value: connectionText, style: 'connection' },
    { label: 'Web', value: baseUrl, style: 'normal' },
    { label: 'Quests', value: String(quests.length), style: 'normal' },
  ]

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box flexDirection="row">
        <Box flexDirection="column" marginRight={2}>
          {robotLines.map((line, idx) => (
            <SegmentedLine
              key={`robot-${idx}`}
              line={line}
              segments={robotSegments[idx] || []}
            />
          ))}
        </Box>

        <Box flexDirection="column" justifyContent="center">
          {infoLines.map((info, idx) => (
            <Box key={idx}>
              {info.style === 'title' ? (
                <Gradient colors={COLORS.gradient}>
                  <Text bold>{info.value}</Text>
                </Gradient>
              ) : (
                <>
                  {info.label && (
                    <Text color={theme.text.secondary}>{info.label}: </Text>
                  )}
                  <Text
                    color={
                      info.style === 'connection' ? connectionColor : theme.text.primary
                    }
                  >
                    {info.value}
                  </Text>
                </>
              )}
            </Box>
          ))}
        </Box>
      </Box>

      <Box marginTop={1}>
        <Logo />
      </Box>

      <Box marginTop={1}>
        <Text color={theme.text.secondary}>Type </Text>
        <Text color={COLORS.blue}>/help</Text>
        <Text color={theme.text.secondary}> for commands.</Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text color={theme.text.secondary}>
          {`Quests ${quests.length} · Active ${activeCount} · Pending decisions ${pendingDecisionCount}`}
        </Text>
        <Text color={theme.text.secondary}>{connectorSummary}</Text>
        {selectedQuest ? (
          <>
            <Text color={theme.text.primary}>
              {selectedQuest.quest_id} · {selectedQuest.title}
            </Text>
            <Text color={theme.text.secondary}>
              {selectedQuest.status} · {selectedQuest.active_anchor} ·{' '}
              {selectedQuest.branch || 'main'}
            </Text>
          </>
        ) : (
          <Text color={theme.text.secondary}>
            No quest selected yet. Enter a request to create one.
          </Text>
        )}
      </Box>
    </Box>
  )
}
