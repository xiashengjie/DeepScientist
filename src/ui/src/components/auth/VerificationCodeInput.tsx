'use client'

import { useEffect, useMemo, useRef } from 'react'

type VerificationCodeInputProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  autoFocus?: boolean
  hasError?: boolean
  length?: number
  onComplete?: (value: string) => void
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export default function VerificationCodeInput({
  value,
  onChange,
  disabled = false,
  autoFocus = false,
  hasError = false,
  length = 4,
  onComplete,
}: VerificationCodeInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  const digits = useMemo(() => {
    const cleaned = onlyDigits(value).slice(0, length)
    return Array.from({ length }, (_, index) => cleaned[index] ?? '')
  }, [value, length])

  const setFocus = (index: number) => {
    requestAnimationFrame(() => {
      const target = inputRefs.current[index]
      if (!target) return
      target.focus()
      target.select()
    })
  }

  useEffect(() => {
    if (!autoFocus || disabled) return
    const firstEmpty = digits.findIndex((digit) => !digit)
    setFocus(firstEmpty === -1 ? Math.max(0, length - 1) : firstEmpty)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus, disabled])

  const updateDigits = (nextDigits: string[], focusIndex?: number) => {
    const nextValue = nextDigits.join('')
    onChange(nextValue)
    if (onComplete && nextDigits.every((digit) => digit.length === 1)) {
      onComplete(nextValue)
    }
    if (typeof focusIndex === 'number') {
      setFocus(Math.max(0, Math.min(length - 1, focusIndex)))
    }
  }

  const handleChange = (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return

    const incoming = onlyDigits(event.target.value)
    const nextDigits = [...digits]

    if (!incoming) {
      nextDigits[index] = ''
      updateDigits(nextDigits)
      return
    }

    let cursor = index
    for (const digit of incoming) {
      if (cursor >= length) break
      nextDigits[cursor] = digit
      cursor += 1
    }

    updateDigits(nextDigits, cursor)
  }

  const handleKeyDown = (index: number) => (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    if (event.key === 'Backspace') {
      event.preventDefault()
      const nextDigits = [...digits]

      if (nextDigits[index]) {
        nextDigits[index] = ''
        updateDigits(nextDigits, index)
        return
      }

      if (index > 0) {
        nextDigits[index - 1] = ''
        updateDigits(nextDigits, index - 1)
      }
      return
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      setFocus(index - 1)
      return
    }

    if (event.key === 'ArrowRight' && index < length - 1) {
      event.preventDefault()
      setFocus(index + 1)
    }
  }

  const handlePaste = (index: number) => (event: React.ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return

    event.preventDefault()
    const incoming = onlyDigits(event.clipboardData.getData('text'))
    if (!incoming) return

    const nextDigits = [...digits]
    let cursor = index
    for (const digit of incoming) {
      if (cursor >= length) break
      nextDigits[cursor] = digit
      cursor += 1
    }

    updateDigits(nextDigits, cursor)
  }

  return (
    <div className="auth-otp-row" aria-label={`Verification code (${length} digits)`}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            inputRefs.current[index] = node
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          onChange={handleChange(index)}
          onKeyDown={handleKeyDown(index)}
          onPaste={handlePaste(index)}
          onFocus={(event) => event.currentTarget.select()}
          className={`auth-otp-input${hasError ? ' error' : ''}`}
          disabled={disabled}
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  )
}

