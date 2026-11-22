import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  createKafka,
  ensureTopic,
  parseSolutionCreatedEvent,
  SOLUTIONS_CREATE_TOPIC,
} from '@lcode/messaging';
import type { Consumer, KafkaMessage } from 'kafkajs';
import { SolutionSourceService } from '../solution-source/solution-source.service';

@Injectable()
export class SolutionCreatedConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SolutionCreatedConsumer.name);
  private readonly kafka = createKafka(
    process.env.KAFKA_CLIENT_ID ?? 'lcode-sandbox',
  );
  private readonly consumer: Consumer = this.kafka.consumer({
    groupId: process.env.KAFKA_GROUP_ID ?? 'lcode-sandbox',
  });

  constructor(private readonly solutionSource: SolutionSourceService) { }

  async onModuleInit(): Promise<void> {
    await ensureTopic(this.kafka, SOLUTIONS_CREATE_TOPIC);
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: SOLUTIONS_CREATE_TOPIC });
    await this.consumer.run({
      eachMessage: async ({ message }) => this.handleMessage(message),
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer.disconnect();
  }

  private async handleMessage(message: KafkaMessage): Promise<void> {
    try {
      const event = parseSolutionCreatedEvent(message.value?.toString());
      console.time('waiting for file');
      const source = await this.solutionSource.waitAndFetch(event.solutionId);
      console.timeEnd('waiting for file')
      this.logger.log(source);
      this.logger.log(
        `Fetched source for solution ${event.solutionId} (${source.byteLength} bytes)`,
      );
    } catch (e: unknown) {
      if (e instanceof Error) {
        this.logger.error(e.message, 'error in consumer handleMessage')
      }
    }
  }
}
