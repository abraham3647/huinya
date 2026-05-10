# Local infrastructure troubleshooting

The local stack uses Docker Compose to start Neo4j, Zookeeper, and Kafka for development.

## Start the stack

```bash
npm run infra:check
npm run infra:up
```

`infra:check` verifies that both the Docker CLI and Docker daemon/API are reachable before Compose tries to pull images.

## Error: Docker daemon/API is not reachable

If you see an error like:

```text
failed to connect to the docker API at unix:///var/run/docker.sock
```

it means Docker Compose could not talk to a running Docker daemon. This is an environment/runtime issue, not a Neo4j image issue.

Common fixes:

- Start Docker Desktop and wait until it reports that Docker is running.
- On Linux, run `sudo systemctl start docker` or enable the daemon with `sudo systemctl enable --now docker`.
- If you use Colima, Rancher Desktop, or Podman, start that runtime and select the matching Docker context.
- In CI or restricted sandboxes that do not expose `/var/run/docker.sock`, do not start the local stack; point services at externally managed Kafka and Neo4j endpoints instead.

## Verify manually

```bash
docker info
docker compose version
docker compose -f infrastructure/docker/docker-compose.yml ps
```

Once `docker info` works, rerun `npm run infra:up`.
