export type AnyObj = Record<string, any>

export type ServiceConfig = {
  listen?: string
  port?: number
  path?: string
  templatePath: string
  upstreams: string[]
  refreshIntervalSec?: number
}
