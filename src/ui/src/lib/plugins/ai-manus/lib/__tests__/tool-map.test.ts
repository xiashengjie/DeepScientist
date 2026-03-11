import { getToolInfo, resolveToolCategory } from '@/lib/plugins/ai-manus/lib/tool-map'
import type { ToolEventData } from '@/lib/types/chat-events'

const baseTool = {
  event_id: 'evt-1',
  timestamp: 1,
  tool_call_id: 'tool-1',
  status: 'called',
  args: {},
} satisfies Partial<ToolEventData>

describe('tool-map', () => {
  it('categorizes Read/Write/Edit as file tools', () => {
    const tool: ToolEventData = {
      ...baseTool,
      name: 'Read',
      function: 'Read',
      args: { file: '/FILES/notes.txt' },
    } as ToolEventData

    expect(resolveToolCategory(tool)).toBe('file')
    expect(getToolInfo(tool).function).toBe('Reading file')
  })

  it('categorizes WebSearch as search tool', () => {
    const tool: ToolEventData = {
      ...baseTool,
      name: 'WebSearch',
      function: 'WebSearch',
      args: { query: 'codex' },
    } as ToolEventData

    expect(resolveToolCategory(tool)).toBe('search')
    expect(getToolInfo(tool).function).toBe('Searching web')
  })

  it('categorizes read_paper as read paper tool', () => {
    const tool: ToolEventData = {
      ...baseTool,
      name: 'read_paper',
      function: 'read_paper',
      args: {
        items: [{ id: '2303.08774', question: 'What is the core contribution?' }],
      },
    } as ToolEventData

    expect(resolveToolCategory(tool)).toBe('read_paper')
    expect(getToolInfo(tool).function).toBe('Reading papers')
  })
})
