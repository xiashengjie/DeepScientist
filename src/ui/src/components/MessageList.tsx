'use client'

import {
  forwardRef,
  memo,
  useDeferredValue,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useLLMStream, type LLMMessage } from '@/hooks/useLLMStream'

export interface MessageListHandle {
  sendMessage: (text: string) => Promise<void>
  stop: () => void
  isStreaming: boolean
  sessionId: string | null
}

export interface MessageListProps {
  projectId?: string
  sessionId?: string | null
  className?: string
  contentClassName?: string
  onStreamingChange?: (streaming: boolean) => void
}

const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-slate-900 underline decoration-slate-300 underline-offset-4"
    >
      {children}
    </a>
  ),
  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded-lg border border-gray-200 bg-slate-50 p-3 text-[0.85em] leading-relaxed">
      {children}
    </pre>
  ),
  code: ({ children, className }) => {
    // Check if it's an inline code block (no language class means inline)
    const isInline = !className
    return isInline ? (
      <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.85em] text-slate-700">
        {children}
      </code>
    ) : (
      <code className="font-mono text-[0.85em] text-slate-700">{children}</code>
    )
  },
  table: ({ children }) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-[0.85em]">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-gray-100 px-3 py-2 align-top text-slate-700">
      {children}
    </td>
  ),
}

const MarkdownBlock = memo(function MarkdownBlock({ content }: { content: string }) {
  const deferredContent = useDeferredValue(content)
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={markdownComponents}
      className="prose prose-sm max-w-none text-slate-700"
    >
      {deferredContent}
    </ReactMarkdown>
  )
})

const TypingIndicator = () => (
  <div className="flex items-center gap-1 text-slate-400">
    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400" />
    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400 [animation-delay:120ms]" />
    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400 [animation-delay:240ms]" />
  </div>
)

const MessageBubble = memo(function MessageBubble({ message }: { message: LLMMessage }) {
  const isAssistant = message.role === 'assistant'
  const bubbleClass = isAssistant
    ? 'mr-auto border-gray-200 bg-white text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.06)]'
    : 'ml-auto border-slate-900 bg-slate-900 text-white shadow-[0_8px_18px_rgba(15,23,42,0.18)]'

  return (
    <div
      className={cn(
        'max-w-[78%] rounded-xl border px-4 py-3 text-sm leading-relaxed',
        bubbleClass,
        message.status === 'error' && 'border-rose-200 bg-rose-50 text-rose-900'
      )}
    >
      {isAssistant ? (
        message.content ? (
          <MarkdownBlock content={message.content} />
        ) : (
          <TypingIndicator />
        )
      ) : (
        <div className="whitespace-pre-wrap">{message.content}</div>
      )}
    </div>
  )
})

export const MessageList = forwardRef<MessageListHandle, MessageListProps>(
  ({ projectId, sessionId, className, contentClassName, onStreamingChange }, ref) => {
    const { messages, sendMessage, stop, isStreaming, sessionId: activeSessionId, error } =
      useLLMStream({
        projectId,
        sessionId,
      })
    const bottomRef = useRef<HTMLDivElement | null>(null)

    useImperativeHandle(
      ref,
      () => ({
        sendMessage,
        stop,
        isStreaming,
        sessionId: activeSessionId,
      }),
      [activeSessionId, isStreaming, sendMessage, stop]
    )

    useEffect(() => {
      onStreamingChange?.(isStreaming)
    }, [isStreaming, onStreamingChange])

    useEffect(() => {
      bottomRef.current?.scrollIntoView({
        block: 'end',
        behavior: isStreaming ? 'auto' : 'smooth',
      })
    }, [isStreaming, messages.length])

    const emptyState = useMemo(
      () => (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-10 text-center text-sm text-slate-500">
          <div className="text-base font-semibold text-slate-700">Ask anything about your work</div>
          <div>Summaries, literature checks, or drafting help.</div>
        </div>
      ),
      []
    )

    return (
      <ScrollArea className={cn('h-full', className)}>
        <div className={cn('flex flex-col gap-4 px-6 pb-28 pt-6', contentClassName)}>
          {messages.length === 0 ? emptyState : null}
          {messages.map((message: LLMMessage) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
              {error}
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    )
  }
)

MessageList.displayName = 'MessageList'
