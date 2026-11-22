import { Module } from '@nestjs/common';
import {
  createS3Client,
  createS3Config,
  S3_CLIENT,
  S3_CONFIG,
} from '@lcode/s3';
import { SolutionCreatedConsumer } from '../kafka/solution-created.consumer';
import { SolutionSourceService } from '../solution-source/solution-source.service';

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
    SolutionCreatedConsumer,
  ],
})
export class AppModule {}
