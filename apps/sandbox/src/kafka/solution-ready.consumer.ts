import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  createKafka,
  ensureTopic,
  parseSolutionReadyEvent,
  SOLUTIONS_READY_TOPIC,
} from '@lcode/messaging';
import type { Consumer, KafkaMessage } from 'kafkajs';
import { SolutionSourceService } from '../solution-source/solution-source.service';
import { SolutionExecutorService } from '../solution-source/solution-executor.service';

@Injectable()
export class SolutionReadyConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SolutionReadyConsumer.name);
  private readonly kafka = createKafka(
    process.env.KAFKA_CLIENT_ID ?? 'lcode-sandbox',
  );
  private readonly consumer: Consumer = this.kafka.consumer({
    groupId: process.env.KAFKA_GROUP_ID ?? 'lcode-sandbox',
  });

  constructor(private readonly solutionSource: SolutionSourceService, private readonly executorSource: SolutionExecutorService) { }

  async onModuleInit(): Promise<void> {
    await ensureTopic(this.kafka, SOLUTIONS_READY_TOPIC);
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: SOLUTIONS_READY_TOPIC });
    await this.consumer.run({
      eachMessage: async ({ message }) => this.handleMessage(message),
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer.disconnect();
  }

  private async handleMessage(message: KafkaMessage): Promise<void> {
    try {
      const event = parseSolutionReadyEvent(message.value?.toString());
      const source = await this.solutionSource.fetch(event.solutionId);

      const result = await this.executorSource.execute(source.toString('utf-8'));
      this.logger.log(result, 'executor result');
    } catch (error: unknown) {
      console.log(error, 'error');
      if (error instanceof Error) {
        this.logger.error(error.message, 'error in consumer handleMessage');
      }
      throw error;
    }
  }
}
