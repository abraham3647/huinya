export interface TimedAction {
  wallet: string;
  occurredAtMs: number;
}

export function synchronizationScore(actions: TimedAction[], windowMs = 30_000): number {
  if (actions.length < 2) return 0;
  const sorted = [...actions].sort((a, b) => a.occurredAtMs - b.occurredAtMs);
  let synchronizedPairs = 0;

  for (let index = 1; index < sorted.length; index += 1) {
    if (sorted[index].occurredAtMs - sorted[index - 1].occurredAtMs <= windowMs) {
      synchronizedPairs += 1;
    }
  }

  return synchronizedPairs / (sorted.length - 1);
}
