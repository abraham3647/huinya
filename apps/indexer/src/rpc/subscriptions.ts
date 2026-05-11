export interface SubscriptionConfig {
  programIds: string[];
  commitment: 'processed' | 'confirmed' | 'finalized';
}

export const defaultSubscriptionConfig: SubscriptionConfig = {
  programIds: [],
  commitment: 'confirmed',
};
