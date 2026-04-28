import { createServer } from 'node:http'
import type { AnyObj, ServiceConfig } from './types.js'
import { clone } from './utils.js'
import { fetchNodes, mergeNodes } from './nodes.js'
import { buildConfig } from './config-builder.js'

export async function startService(cfg: ServiceConfig, template: AnyObj) {
  const listen = cfg.listen || '127.0.0.1'
  const port = cfg.port || 18900
  const subPath = cfg.path || '/sub'
  const intervalMs = Math.max(30, cfg.refreshIntervalSec || 300) * 1000

  let latestConfig: AnyObj = clone(template)
  let lastError = ''
  let lastUpdateAt = ''
  let refreshCount = 0

  const refresh = async () => {
    const started = Date.now()
    refreshCount += 1
    console.log(`[refresh#${refreshCount}] start`)
    try {
      const all = await Promise.all(
        cfg.upstreams.map(async (u) => {
          const nodes = await fetchNodes(u)
          console.log(`[refresh#${refreshCount}] upstream ok: ${u} (${nodes.length} nodes)`)
          return nodes
        }),
      )
      const merged = mergeNodes(all)
      latestConfig = buildConfig(template, merged)
      lastError = ''
      lastUpdateAt = new Date().toISOString()
      const cost = Date.now() - started
      console.log(`[refresh#${refreshCount}] ok: ${merged.length} merged nodes, ${cost}ms`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      lastError = msg
      const cost = Date.now() - started
      console.error(`[refresh#${refreshCount}] failed: ${msg} (${cost}ms)`)
    }
  }

  console.log(
    `[startup] listen=${listen}:${port} path=${subPath} upstreams=${cfg.upstreams.length} intervalSec=${Math.floor(
      intervalMs / 1000,
    )}`,
  )
  await refresh()
  setInterval(refresh, intervalMs).unref()

  const server = createServer((req, res) => {
    const pathname = (req.url || '/').split('?')[0]
    console.log(`[http] ${req.method || 'GET'} ${pathname}`)
    if (req.method === 'GET' && pathname === '/healthz') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ ok: !lastError, lastError, lastUpdateAt, refreshCount }))
      return
    }
    if (req.method === 'POST' && pathname === '/refresh') {
      refresh().then(() => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ ok: !lastError, lastError, lastUpdateAt, refreshCount }))
      })
      return
    }
    if (req.method === 'GET' && pathname === subPath) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify(latestConfig, null, 2))
      return
    }
    res.statusCode = 404
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ error: 'not found' }))
  })

  server.listen(port, listen, () => {
    console.log(`service listening on http://${listen}:${port}`)
    console.log(`subscription URL: http://${listen}:${port}${subPath}`)
  })
}
