# convert-service

Merge multiple sing-box subscriptions into one JSON endpoint.

## What it does

- Pulls one or more upstream subscription URLs
- Extracts/merges node outbounds
- Injects them into your `template.json`
- Exposes a local subscription URL via HTTP

## Project layout

- `service.ts`: entrypoint
- `service/`: runtime, fetch/merge, config builder
- `template.json`: public skeleton template
- `service.example.json`: sample runtime config

## Local run

1. Copy config:

```bash
cp service.example.json service.json
```

2. Edit `service.json`:

- `listen`
- `port`
- `path`
- `templatePath`
- `upstreams`
- `refreshIntervalSec`

3. Start:

```bash
npm run serve -- ./service.json
```

## Endpoints

- `GET {path}`: generated subscription JSON
- `GET /healthz`: health info
- `POST /refresh`: force refresh

## Docker

Build image:

```bash
docker build -t convert-service:local .
```

Run container:

```bash
docker run --rm -p 18900:18900 \
  -e CONFIG_PATH=/app/service.json \
  -v ${PWD}/service.example.json:/app/service.json:ro \
  -v ${PWD}/template.json:/app/template.json:ro \
  convert-service:local
```

Or compose:

```bash
docker compose up -d --build
```

## CI / Release

- CI: `.github/workflows/ci.yml`
  - Runs `npm ci` + `npm run build` on push/PR
- Release: `.github/workflows/release.yml`
  - Triggered by tags like `v1.0.0`
  - Builds/pushes image to GHCR
  - Creates GitHub Release with source tarball
