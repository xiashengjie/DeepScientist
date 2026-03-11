import React, { useMemo } from 'react'
import { Box, Text } from 'ink'

import { shortenPath, tildeifyPath } from '../utils/paths.js'
import { useTerminalSize } from '../hooks/useTerminalSize.js'
import { theme } from '../semantic-colors.js'

export type ConfigScreenItem = {
  id: string
  scope: 'global' | 'quest'
  name: string
  title: string
  path: string
  writable: boolean
  configName?: string
  documentId?: string
}

type ConfigScreenProps = {
  mode: 'browse' | 'edit'
  items: ConfigScreenItem[]
  selectedIndex: number
  selectedQuestId?: string | null
  editor?: {
    item: ConfigScreenItem
    content: string
  } | null
  availableHeight?: number
}

const sectionTitle = (scope: 'global' | 'quest', questId?: string | null) =>
  scope === 'global' ? 'Global Config' : `Current Quest${questId ? ` · ${questId}` : ''}`

export const ConfigScreen: React.FC<ConfigScreenProps> = ({
  mode,
  items,
  selectedIndex,
  selectedQuestId,
  editor,
  availableHeight,
}) => {
  const { rows, columns } = useTerminalSize()
  const safeRows = availableHeight ?? rows
  const selected = items[Math.max(0, Math.min(selectedIndex, items.length - 1))] ?? null
  const globalItems = useMemo(
    () => items.map((item, index) => ({ item, index })).filter(({ item }) => item.scope === 'global'),
    [items]
  )
  const questItems = useMemo(
    () => items.map((item, index) => ({ item, index })).filter(({ item }) => item.scope === 'quest'),
    [items]
  )

  if (mode === 'edit' && editor) {
    const previewLines = editor.content.split('\n')
    const maxPreviewLines = Math.max(8, (safeRows || 24) - 8)
    const visibleLines = previewLines.slice(0, maxPreviewLines)

    return (
      <Box flexDirection="column" width={columns}>
        <Text color={theme.text.primary}>Config Editor</Text>
        <Text color={theme.text.link}>
          {editor.item.scope === 'global' ? 'Global' : 'Quest'} · {editor.item.title}
        </Text>
        <Text color={theme.text.secondary}>{tildeifyPath(editor.item.path)}</Text>
        <Text color={theme.text.secondary}>Enter save · Ctrl+J newline · Esc cancel</Text>
        <Box marginTop={1} flexDirection="column">
          {visibleLines.map((line, index) => (
            <Box key={`${editor.item.id}-line-${index}`} flexDirection="row">
              <Box minWidth={5}>
                <Text color={theme.text.secondary}>{String(index + 1).padStart(4, ' ')}</Text>
              </Box>
              <Text color={theme.text.primary}>{line || ' '}</Text>
            </Box>
          ))}
          {previewLines.length > visibleLines.length ? (
            <Text color={theme.text.secondary}>
              … {previewLines.length - visibleLines.length} more line(s) in buffer
            </Text>
          ) : null}
        </Box>
      </Box>
    )
  }

  const renderSection = (
    scope: 'global' | 'quest',
    entries: Array<{ item: ConfigScreenItem; index: number }>
  ) => (
    <Box flexDirection="column" marginBottom={1}>
      <Text color={theme.text.link}>{sectionTitle(scope, selectedQuestId)}</Text>
      {entries.length === 0 ? (
        <Text color={theme.text.secondary}>
          {scope === 'global' ? 'No global config files.' : 'No quest config files for the current selection.'}
        </Text>
      ) : (
        entries.map(({ item, index }) => {
          const isSelected = index === selectedIndex
          const displayPath = shortenPath(tildeifyPath(item.path), Math.max(28, columns - 26))
          return (
            <Box key={item.id} flexDirection="column" marginBottom={1}>
              <Text color={isSelected ? theme.status.success : theme.text.primary}>
                {isSelected ? '> ' : '  '}
                {index + 1}. {item.title}
              </Text>
              <Text color={theme.text.secondary}>{displayPath}</Text>
            </Box>
          )
        })
      )}
    </Box>
  )

  return (
    <Box flexDirection="column" width={columns}>
      <Text color={theme.text.primary}>Config</Text>
      <Text color={theme.text.secondary}>Select a file to open and edit in-place.</Text>
      <Text color={theme.text.secondary}>↑/↓ choose · Enter edit · Esc close</Text>
      <Box marginTop={1} flexDirection="column">
        {renderSection('global', globalItems)}
        {renderSection('quest', questItems)}
      </Box>
      {selected ? (
        <Box flexDirection="column" marginTop={1}>
          <Text color={theme.text.link}>Selected</Text>
          <Text color={theme.text.primary}>{selected.title}</Text>
          <Text color={theme.text.secondary}>{tildeifyPath(selected.path)}</Text>
          <Text color={theme.text.secondary}>
            {selected.scope === 'global' ? 'Global runtime config file.' : 'Quest-local config file.'}
          </Text>
        </Box>
      ) : null}
    </Box>
  )
}
