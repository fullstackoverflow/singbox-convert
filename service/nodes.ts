import type { AnyObj } from './types.js'
import { asTag, isObj } from './utils.js'

const EXCLUDED_NODE_TYPES = new Set([
  'direct',
  'reject',
  'selector',
  'urltest',
  'block',
  'dns',
  'shadowsocksr',
])

export function normalizeOutbounds(input: unknown): AnyObj[] {
  if (Array.isArray(input)) return input.filter(isObj)
  if (isObj(input) && Array.isArray(input.outbounds)) return input.outbounds.filter(isObj)
  throw new Error('Unsupported JSON shape. Expected { outbounds: [...] } or [...]')
}

export function filterNodeOutbounds(outbounds: AnyObj[]): AnyObj[] {
  return outbounds.filter((o) => {
    const tag = asTag(o.tag).trim()
    const type = asTag(o.type).trim().toLowerCase()
    return !!tag && !!type && !EXCLUDED_NODE_TYPES.has(type)
  })
}

export async function fetchNodes(url: string): Promise<AnyObj[]> {
  const resp = await fetch(url, { headers: { 'User-Agent': 'convert-service/1.0' } })
  if (!resp.ok) throw new Error(`Fetch failed (${resp.status}): ${url}`)
  const text = await resp.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    console.log('Failed to parse JSON from upstream:', text)
    throw new Error(`Invalid JSON from upstream: ${url}`)
  }
  return filterNodeOutbounds(normalizeOutbounds(parsed))
}

export function mergeNodes(list: AnyObj[][]): AnyObj[] {
  const byTag = new Map<string, AnyObj>()
  for (const nodes of list) {
    for (const n of nodes) {
      const tag = asTag(n.tag).trim()
      if (!tag || byTag.has(tag)) continue
      byTag.set(tag, n)
    }
  }
  return [...byTag.values()]
}
