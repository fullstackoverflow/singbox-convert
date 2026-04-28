import type { AnyObj } from './types.js'
import { asTag, clone, dedupeTags } from './utils.js'

const BUILTIN_OUTBOUND_TYPES = new Set(['selector', 'urltest', 'direct', 'block'])

export function buildConfig(template: AnyObj, nodes: AnyObj[]): AnyObj {
  const skeleton = clone(template)
  if (!Array.isArray(skeleton.outbounds)) {
    throw new Error('template outbounds[] is required')
  }

  const nodeTags = dedupeTags(nodes.map((n) => asTag(n.tag).trim()))
  const kept = (skeleton.outbounds as AnyObj[]).filter((o) =>
    BUILTIN_OUTBOUND_TYPES.has(String(o?.type || '').toLowerCase()),
  )

  const selectorTag = '🚀 节点选择'
  const autoTag = '🎈 自动选择'
  const directTag = '🎯 全球直连'
  const fallbackTag = '🐟 漏网之鱼'
  const globalTag = 'GLOBAL'

  for (const o of kept) {
    if (!Array.isArray(o.outbounds)) continue
    const tag = asTag(o.tag)
    const type = String(o.type || '').toLowerCase()
    if (type === 'selector' && tag === selectorTag) o.outbounds = [autoTag, ...nodeTags]
    if (type === 'urltest' && tag === autoTag) o.outbounds = [...nodeTags]
    if (type === 'selector' && tag === fallbackTag) o.outbounds = [selectorTag, directTag]
    if (type === 'selector' && tag === globalTag)
      o.outbounds = [selectorTag, autoTag, directTag, fallbackTag]
  }

  skeleton.outbounds = [...kept, ...nodes]
  return skeleton
}
