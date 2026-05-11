export const upsertWalletQuery = `
MERGE (wallet:Wallet {address: $address})
SET wallet.updatedAt = datetime()
RETURN wallet
`;

export const upsertEdgeQuery = `
MATCH (source:Wallet {address: $source})
MATCH (target:Wallet {address: $target})
MERGE (source)-[edge:RELATED {signal: $signal}]->(target)
SET edge.weight = coalesce(edge.weight, 0) + $weight,
    edge.observedAt = datetime($observedAt),
    edge.metadata = $metadata
RETURN edge
`;
