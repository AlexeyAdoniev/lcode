import { Kafka } from 'kafkajs';

export function createKafka(clientId: string): Kafka {
  return new Kafka({
    clientId,
    brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(','),
  });
}

export async function ensureTopic(kafka: Kafka, topic: string): Promise<void> {
  const admin = kafka.admin();
  await admin.connect();

  try {
    await admin.createTopics({ topics: [{ topic }] });
  } finally {
    await admin.disconnect();
  }
}
