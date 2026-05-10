'use client';

import { FormEvent, useMemo, useState } from 'react';

type GraphNode = {
  id: string;
  label: string;
  kind: 'wallet' | 'transaction' | 'creator' | 'token' | 'funder';
};

type GraphEdge = {
  source: string;
  target: string;
  signal: string;
  weight: number;
};

type Analysis = {
  address: string;
  risk: number;
  reasons: string[];
  transactions: Array<{ signature: string; slot: number; feePayer: string; tokenMints: string[] }>;
  cluster: { coordinatedProbability: number; inorganicVolumeShare: number; walletCount: number; topReasons: string[] };
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
};

const defaultAddress = '11111111111111111111111111111111';

export default function DashboardPage() {
  const [address, setAddress] = useState(defaultAddress);
  const [limit, setLimit] = useState(5);
  const [analysis, setAnalysis] = useState<Analysis | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  async function analyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(undefined);
    try {
      const response = await fetch(`${apiBaseUrl}/wallet/${encodeURIComponent(address)}/analyze?limit=${limit}`);
      const payload = await response.json();
      if (!response.ok || payload.error) throw new Error(payload.error ?? `HTTP ${response.status}`);
      setAnalysis(payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const graphLayout = useMemo(() => layoutGraph(analysis?.graph.nodes ?? []), [analysis]);

  return (
    <main style={{ fontFamily: 'Inter, system-ui, sans-serif', padding: 32, background: '#080b12', color: '#f8fafc', minHeight: '100vh' }}>
      <section style={{ maxWidth: 1180, margin: '0 auto' }}>
        <p style={{ color: '#38bdf8', fontWeight: 700, letterSpacing: 1 }}>Bags.fm Anti-Sybil Engine</p>
        <h1 style={{ fontSize: 44, margin: '8px 0' }}>Realtime wallet analysis dashboard</h1>
        <p style={{ color: '#94a3b8', maxWidth: 780 }}>
          Enter a Solana wallet, fetch recent transactions from the API, score coordinated behavior, and inspect the wallet ↔ transaction graph.
        </p>

        <form onSubmit={analyze} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 150px', gap: 12, margin: '28px 0' }}>
          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Solana wallet address"
            style={inputStyle}
          />
          <input
            value={limit}
            min={1}
            max={50}
            type="number"
            onChange={(event) => setLimit(Number(event.target.value))}
            style={inputStyle}
          />
          <button disabled={loading} style={buttonStyle}>{loading ? 'Analyzing…' : 'Analyze'}</button>
        </form>

        {error ? <div style={{ ...cardStyle, borderColor: '#ef4444', color: '#fecaca' }}>{error}</div> : null}

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
          <Metric label="Wallet risk" value={analysis ? `${Math.round(analysis.risk * 100)}%` : '—'} />
          <Metric label="Coordinated probability" value={analysis ? `${Math.round(analysis.cluster.coordinatedProbability * 100)}%` : '—'} />
          <Metric label="Graph size" value={analysis ? `${analysis.graph.nodes.length} nodes / ${analysis.graph.edges.length} edges` : '—'} />
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(360px, 0.6fr)', gap: 16, marginTop: 16 }}>
          <article style={cardStyle}>
            <h2>Wallet ↔ transaction graph</h2>
            <svg viewBox="0 0 900 520" style={{ width: '100%', height: 520, background: '#020617', borderRadius: 16 }}>
              {(analysis?.graph.edges ?? []).map((edge, index) => {
                const source = graphLayout.get(edge.source);
                const target = graphLayout.get(edge.target);
                if (!source || !target) return null;
                return <line key={`${edge.source}-${edge.target}-${index}`} x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke="#334155" strokeWidth="1.5" />;
              })}
              {(analysis?.graph.nodes ?? []).map((node) => {
                const point = graphLayout.get(node.id);
                if (!point) return null;
                const fill = node.kind === 'transaction' ? '#38bdf8' : '#a78bfa';
                return (
                  <g key={node.id}>
                    <circle cx={point.x} cy={point.y} r={node.kind === 'transaction' ? 9 : 13} fill={fill} />
                    <text x={point.x + 12} y={point.y + 4} fill="#e2e8f0" fontSize="12">{node.label}</text>
                  </g>
                );
              })}
            </svg>
          </article>

          <aside style={cardStyle}>
            <h2>Explanation</h2>
            <ul>
              {(analysis?.reasons ?? ['Run analysis to see risk reasons.']).map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
            <h3>Recent transactions</h3>
            <div style={{ display: 'grid', gap: 8, maxHeight: 320, overflow: 'auto' }}>
              {(analysis?.transactions ?? []).slice(0, 12).map((transaction) => (
                <code key={transaction.signature} style={{ color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {transaction.signature} · slot {transaction.slot}
                </code>
              ))}
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article style={cardStyle}>
      <strong style={{ color: '#94a3b8' }}>{label}</strong>
      <div style={{ fontSize: 30, marginTop: 8 }}>{value}</div>
    </article>
  );
}

function layoutGraph(nodes: GraphNode[]) {
  const map = new Map<string, { x: number; y: number }>();
  const centerX = 450;
  const centerY = 260;
  const radius = 205;
  nodes.forEach((node, index) => {
    if (index === 0) {
      map.set(node.id, { x: centerX, y: centerY });
      return;
    }
    const angle = (Math.PI * 2 * index) / Math.max(1, nodes.length - 1);
    map.set(node.id, { x: centerX + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius });
  });
  return map;
}

const inputStyle = {
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: 12,
  color: '#f8fafc',
  padding: '14px 16px',
};

const buttonStyle = {
  background: '#2563eb',
  border: 0,
  borderRadius: 12,
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 700,
};

const cardStyle = {
  background: '#0f172a',
  border: '1px solid #1e293b',
  borderRadius: 18,
  padding: 20,
};
