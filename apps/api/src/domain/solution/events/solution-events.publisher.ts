import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  createKafka,
  ensureTopic,
  serializeSolutionReadyEvent,
  SOLUTIONS_READY_TOPIC,
} from '@lcode/messaging';
import type { Producer } from 'kafkajs';
import { Solution } from '../entities/solution.entity';

@Injectable()
export class SolutionEventsPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly kafka = createKafka(
    process.env.KAFKA_CLIENT_ID ?? 'lcode-api',
  );
  private readonly producer: Producer = this.kafka.producer();

  async onModuleInit(): Promise<void> {
    await ensureTopic(this.kafka, SOLUTIONS_READY_TOPIC);
    await this.producer.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.producer.disconnect();
  }

  async publishReady(solution: Solution): Promise<void> {
    await this.producer.send({
      topic: SOLUTIONS_READY_TOPIC,
      messages: [
        {
          key: String(solution.id),
          value: serializeSolutionReadyEvent({ solutionId: solution.id, problemId: solution.problemId, language: solution.language }),
        },
      ],
    });
  }
}
