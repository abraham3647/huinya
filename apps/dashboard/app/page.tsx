const metrics = [
  { label: 'Coordinated wallets', value: '200', tone: 'critical' },
  { label: 'Inorganic volume', value: '82%', tone: 'warning' },
  { label: 'Creator organic score', value: '94', tone: 'healthy' },
];

export default function DashboardPage() {
  return (
    <main style={{ fontFamily: 'Inter, sans-serif', padding: 32 }}>
      <h1>Anti-Sybil Moderator Dashboard</h1>
      <p>Cluster, wash-trading, creator-integrity, and trending-manipulation signals for Bags.fm.</p>
      <section style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        {metrics.map((metric) => (
          <article key={metric.label} style={{ border: '1px solid #ddd', borderRadius: 12, padding: 20 }}>
            <strong>{metric.label}</strong>
            <div style={{ fontSize: 36, marginTop: 8 }}>{metric.value}</div>
            <small>{metric.tone}</small>
          </article>
        ))}
      </section>
    </main>
  );
}
