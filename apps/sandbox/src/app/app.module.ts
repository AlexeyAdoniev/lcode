import { Module } from '@nestjs/common';
import {
  createS3Client,
  createS3Config,
  S3_CLIENT,
  S3_CONFIG,
} from '@lcode/s3';
import { SolutionReadyConsumer } from '../kafka/solution-ready.consumer';
import { SolutionSourceService } from '../solution-source/solution-source.service';
import { SolutionExecutorService } from '../solution-source/solution-executor.service';

@Module({
  imports: [],
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
    SolutionSourceService,
    SolutionReadyConsumer,
    SolutionExecutorService
  ],
})
export class AppModule { }
