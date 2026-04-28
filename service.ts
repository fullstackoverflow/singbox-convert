#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import type { AnyObj, ServiceConfig } from './service/types.js'
import { startService } from './service/runtime.js'

function usage(): never {
  console.error(
    [
      'Usage:',
      '  node service <config.json>',
      '',
      'Config example:',
      '{',
      '  "listen": "127.0.0.1",',
      '  "port": 18900,',
      '  "path": "/sub",',
      '  "templatePath": "./template.json",',
      '  "upstreams": ["https://a.com/sub.json", "https://b.com/sub.json"],',
      '  "refreshIntervalSec": 300',
      '}',
    ].join('\n'),
  )
  process.exit(1)
}

async function main() {
  const configPath = process.argv[2]
  if (!configPath) usage()

  const raw = await readFile(configPath, 'utf8')
  const cfg = JSON.parse(raw) as ServiceConfig
  if (!cfg.templatePath || !Array.isArray(cfg.upstreams) || cfg.upstreams.length === 0) {
    throw new Error('templatePath and non-empty upstreams[] are required')
  }

  const template = JSON.parse(await readFile(cfg.templatePath, 'utf8')) as AnyObj
  await startService(cfg, template)
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err)
  console.error(`Error: ${msg}`)
  process.exit(1)
})
