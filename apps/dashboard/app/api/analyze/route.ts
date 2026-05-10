const defaultApiBaseUrl = 'http://localhost:3001';

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const address = url.searchParams.get('address')?.trim();
  const limit = Number(url.searchParams.get('limit') ?? 5);
  const apiBaseUrl = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? defaultApiBaseUrl;

  if (!address) {
    return json({ error: 'Missing address query parameter.' }, 400);
  }

  try {
    const response = await fetch(`${apiBaseUrl}/wallet/${encodeURIComponent(address)}/analyze?limit=${limit}`, {
      cache: 'no-store',
    });
    const text = await response.text();
    const payload = safeJson(text);

    if (!response.ok) {
      return json(
        {
          error: payload?.error ?? `Anti-Sybil API returned HTTP ${response.status}`,
          apiBaseUrl,
          hint: 'Make sure the API is running with: npm run build && npm run dev:api',
        },
        response.status,
      );
    }

    return json(payload ?? { error: 'Anti-Sybil API returned an empty response.' }, response.status);
  } catch (error) {
    return json(
      {
        error: `Cannot reach Anti-Sybil API at ${apiBaseUrl}.`,
        cause: error instanceof Error ? error.message : 'Unknown network error',
        hint: 'Start the backend in another terminal: npm run build && npm run dev:api. If the API runs elsewhere, set API_BASE_URL or NEXT_PUBLIC_API_URL.',
      },
      502,
    );
  }
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function safeJson(text: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}
