# Coolify WSL Status

Last verified: 2026-06-28

## Current setup

- Coolify is installed inside WSL on `Ubuntu-22.04`.
- Coolify data root is `/data/coolify`.
- Public URL is `https://coolify.deejpotter.com`.
- Project memory should treat this as a WSL-hosted Coolify deployment target, not a Docker Desktop-hosted stack.

## Verified files in WSL

- `/data/coolify/source/.env`
- `/data/coolify/source/docker-compose.yml`
- `/data/coolify/proxy/docker-compose.yml`

## Runtime findings

- `docker.service` inside WSL was initially inactive.
- Starting `dockerd` manually recreated `/var/run/docker.sock`.
- Existing Coolify-related containers are present in Docker metadata:
  - `coolify`
  - `coolify-proxy`
  - `coolify-cloudflared`
  - `coolify-db`
  - `coolify-redis`
  - `coolify-realtime`
  - `coolify-sentinel`
  - `grocy-vy3yz0m3600k4kmieb8zwvv6`

## Current blocker

- Attempting to start the existing Coolify containers fails with `RWLayer ... is unexpectedly nil`.
- This indicates a broken Docker container storage state rather than a simple stopped-service issue.
- Because the Coolify stack is not running, `idle-minds` cannot currently be checked or added through the live Coolify UI/API.

## App status

- No `idle-minds` registration was found under `/data/coolify`.
- A recursive search for `idle-minds`, `idle minds`, and `idle_minds` in `/data/coolify` returned no matches.

## Next repair path

- Repair or recreate the broken Coolify containers in WSL.
- Once Coolify is healthy again, re-check the application inventory.
- If still absent, create a new Coolify app for this repository.
