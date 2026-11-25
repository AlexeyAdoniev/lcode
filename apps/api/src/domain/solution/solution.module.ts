import { Module } from '@nestjs/common';
import {
  createS3Client,
  createS3Config,
  S3_CLIENT,
  S3_CONFIG,
} from '@lcode/s3';
import { DatabaseModule } from '../../../db/database.module';
import { SolutionController } from './solution.controller';
import { SolutionEventsPublisher } from './events/solution-events.publisher';
import { SolutionService } from './solution.service';
import { S3_PRESIGN_CLIENT } from './interfaces/solution.tokens';

@Module({
  exports: [SolutionService],
  imports: [DatabaseModule],
  controllers: [SolutionController],
  providers: [
    {
      provide: S3_CONFIG,
      useFactory: () =>
        createS3Config({
          endpoint: process.env.S3_ENDPOINT,
        }),
    },
    {
      provide: S3_CLIENT,
      useFactory: createS3Client,
      inject: [S3_CONFIG],
    },
    {
      provide: S3_PRESIGN_CLIENT,
      useFactory: () =>
        createS3Client(
          createS3Config({
            endpoint: process.env.S3_PUBLIC_ENDPOINT ?? process.env.S3_ENDPOINT,
          }),
        ),
    },
    SolutionEventsPublisher,
    SolutionService,
  ],
})
export class SolutionModule { }
