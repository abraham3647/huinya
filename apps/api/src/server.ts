import { createServer } from 'node:http';
import { URL } from 'node:url';
import { AnalysisService } from './services/analysis.service.js';
import { ClusterController } from './controllers/cluster.controller.js';
import { CreatorController } from './controllers/creator.controller.js';
import { RiskController } from './controllers/risk.controller.js';

const analysisService = new AnalysisService();
const riskController = new RiskController();
const clusterController = new ClusterController();
const creatorController = new CreatorController();

export function startServer(port = Number(process.env.PORT ?? 3001)): void {
  const server = createServer(async (request: any, response: any) => {
    response.setHeader('access-control-allow-origin', '*');
    response.setHeader('access-control-allow-methods', 'GET,OPTIONS');
    response.setHeader('access-control-allow-headers', 'content-type');
    if (request.method === 'OPTIONS') {
      response.writeHead(204);
      response.end();
      return;
    }

    try {
      const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
      const payload = await route(url);
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify(payload));
    } catch (error) {
      response.writeHead(500, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'unknown error' }));
    }
  });

  server.listen(port, () => {
    console.log(`anti-sybil API listening on http://localhost:${port}`);
  });
}

async function route(url: any): Promise<unknown> {
  const path = String(url.pathname);
  if (path === '/health') return { ok: true };

  const analyzeMatch = path.match(/^\/wallet\/([^/]+)\/analyze$/);
  if (analyzeMatch) {
    return analysisService.analyzeWallet(decodeURIComponent(analyzeMatch[1]), Number(url.searchParams.get('limit') ?? 10));
  }

  const tokenAnalyzeMatch = path.match(/^\/token\/([^/]+)\/analyze$/);
  if (tokenAnalyzeMatch) {
    return analysisService.analyzeToken(decodeURIComponent(tokenAnalyzeMatch[1]), Number(url.searchParams.get('limit') ?? 10));
  }

  const walletRiskMatch = path.match(/^\/wallet\/([^/]+)\/risk$/);
  if (walletRiskMatch) return riskController.getWalletRisk(decodeURIComponent(walletRiskMatch[1]));

  const clusterMatch = path.match(/^\/cluster\/([^/]+)$/);
  if (clusterMatch) return clusterController.getCluster(decodeURIComponent(clusterMatch[1]));

  const creatorMatch = path.match(/^\/creator\/([^/]+)\/integrity$/);
  if (creatorMatch) return creatorController.getIntegrity(decodeURIComponent(creatorMatch[1]));

  return {
    ok: true,
    endpoints: [
      'GET /health',
      'GET /wallet/:address/analyze?limit=10',
      'GET /token/:mint/analyze?limit=10',
      'GET /wallet/:address/risk',
      'GET /cluster/:id',
      'GET /creator/:id/integrity',
    ],
  };
}
