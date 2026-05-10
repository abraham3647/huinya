export interface EventProducer {
  publish(topic: string, payload: unknown): Promise<void>;
}

export class ConsoleEventProducer implements EventProducer {
  async publish(topic: string, payload: unknown): Promise<void> {
    console.log(JSON.stringify({ topic, payload }));
  }
}
