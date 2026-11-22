import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  createKafka,
  ensureTopic,
  serializeSolutionCreatedEvent,
  SOLUTIONS_CREATE_TOPIC,
} from '@lcode/messaging';
import type { Producer } from 'kafkajs';

@Injectable()
export class SolutionEventsPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly kafka = createKafka(
    process.env.KAFKA_CLIENT_ID ?? 'lcode-api',
  );
  private readonly producer: Producer = this.kafka.producer();

  async onModuleInit(): Promise<void> {
    await ensureTopic(this.kafka, SOLUTIONS_CREATE_TOPIC);
    await this.producer.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.producer.disconnect();
  }

  async publishCreated(solutionId: number): Promise<void> {
    console.log('published creation');
    await this.producer.send({
      topic: SOLUTIONS_CREATE_TOPIC,
      messages: [
        {
          key: String(solutionId),
          value: serializeSolutionCreatedEvent({ solutionId }),
        },
      ],
    });
  }
}
