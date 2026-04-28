import type { AnyObj } from './types.js'

export function isObj(v: unknown): v is AnyObj {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v))
}

export function dedupeTags(tags: string[]) {
  return [...new Set(tags.filter(Boolean))]
}

export function asTag(v: unknown): string {
  return typeof v === 'string' ? v : ''
}
