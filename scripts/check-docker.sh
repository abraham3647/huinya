#!/usr/bin/env sh
set -eu

SOCKET_PATH="${DOCKER_HOST:-unix:///var/run/docker.sock}"

if ! command -v docker >/dev/null 2>&1; then
  cat >&2 <<'MSG'
Docker CLI is not installed or is not available on PATH.
Install Docker Desktop, Docker Engine, or a compatible container runtime before starting local infrastructure.
MSG
  exit 127
fi

if ! docker info >/dev/null 2>&1; then
  cat >&2 <<MSG
Docker is installed, but the Docker daemon/API is not reachable.

Detected Docker endpoint: ${SOCKET_PATH}

Common fixes:
  - Start Docker Desktop, then retry.
  - On Linux, start the daemon with: sudo systemctl start docker
  - If using Colima/Rancher Desktop/Podman, start that runtime and ensure docker context points to it.
  - In CI or restricted sandboxes, skip local infrastructure and use externally managed Kafka/Neo4j endpoints.

Original commands to run after Docker is healthy:
  docker compose -f infrastructure/docker/docker-compose.yml up -d
  docker compose -f infrastructure/docker/docker-compose.yml ps
MSG
  exit 1
fi

printf 'Docker daemon is reachable.\n'
docker compose version >/dev/null
printf 'Docker Compose is available.\n'
