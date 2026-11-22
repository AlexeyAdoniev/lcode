import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../db/database.module';
import { SolutionController } from './solution.controller';
import { createS3Client, createS3Config, S3_CLIENT, S3_CONFIG } from './s3.config';
import { SolutionService } from './solution.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SolutionController],
  providers: [
    {
      provide: S3_CONFIG,
      useFactory: createS3Config,
    },
    {
      provide: S3_CLIENT,
      useFactory: createS3Client,
      inject: [S3_CONFIG],
    },
    SolutionService,
  ],
})
export class SolutionModule {}
