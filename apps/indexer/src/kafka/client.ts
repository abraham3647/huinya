export interface KafkaBusConfig {
  clientId: string;
  brokers: string[];
}

export interface KafkaMessageHandler {
  (payload: unknown): Promise<void>;
}

export class KafkaEventBus {
  private kafka: any;

  constructor(private readonly config: KafkaBusConfig) {}

  async publish(topic: string, payload: unknown): Promise<void> {
    const { Kafka } = await import('kafkajs');
    this.kafka ??= new Kafka({ clientId: this.config.clientId, brokers: this.config.brokers });
    const producer = this.kafka.producer();
    await producer.connect();
    await producer.send({ topic, messages: [{ value: JSON.stringify(payload) }] });
    await producer.disconnect();
  }

  async consume(topic: string, groupId: string, handler: KafkaMessageHandler): Promise<void> {
    const { Kafka } = await import('kafkajs');
    this.kafka ??= new Kafka({ clientId: this.config.clientId, brokers: this.config.brokers });
    const consumer = this.kafka.consumer({ groupId });
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });
    await consumer.run({
      eachMessage: async ({ message }: any) => {
        if (!message.value) return;
        await handler(JSON.parse(message.value.toString()));
      },
    });
  }
}
