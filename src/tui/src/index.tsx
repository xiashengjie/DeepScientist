import React from 'react'
import { render } from 'ink'

import { AppContainer } from './app/AppContainer.js'

function parseArg(name: string): string | null {
  const index = process.argv.indexOf(name)
  if (index >= 0 && index + 1 < process.argv.length) {
    return process.argv[index + 1] ?? null
  }
  return null
}

const baseUrl = parseArg('--base-url') ?? 'http://0.0.0.0:20999'
const questId = parseArg('--quest-id')

render(<AppContainer baseUrl={baseUrl} initialQuestId={questId} />)
