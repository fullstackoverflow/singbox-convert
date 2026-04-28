# convert service

Minimal subscription aggregation service:

- Input: one or more upstream subscription URLs (JSON)
- Output: one local subscription URL (sing-box config JSON)

## Files

- `service.ts`: entrypoint
- `service/`: runtime + parser + config builder modules
- `template.json`: config skeleton template
- `service.example.json`: service config example

## Quick start

1. Create config:

```bash
cp ./service.example.json ./service.json
```

2. Edit `service.json`:

- `templatePath`: your local skeleton/template file path
- `upstreams`: one or more subscription URLs

3. Run:

```bash
npm run serve -- ./service.json
```

4. Use local subscription URL:

```text
http://127.0.0.1:18900/sub
```

## Endpoints

- `GET /sub` subscription output (path configurable)
- `GET /healthz` health status
- `POST /refresh` force refresh

## Docker

Build:

```bash
docker build -t convert-service:local .
```

Run:

```bash
docker run --rm -p 18900:18900 \
  -e CONFIG_PATH=/app/service.json \
  -v ${PWD}/service.example.json:/app/service.json:ro \
  -v ${PWD}/template.json:/app/template.json:ro \
  convert-service:local
```

Or use compose:

```bash
docker compose up -d --build
```

## GitHub Actions and release

- CI: `.github/workflows/ci.yml`
  - Runs `npm ci` and `npm run build` on push/PR.
- Release: `.github/workflows/release.yml`
  - Triggered by pushing tags like `v1.0.0`.
  - Builds and pushes image to `ghcr.io/<your-org-or-user>/convert-service`.
  - Creates a GitHub Release and uploads a source tarball.
