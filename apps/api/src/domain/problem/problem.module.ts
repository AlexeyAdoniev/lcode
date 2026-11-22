import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../db/database.module';
import { ProblemController } from './problem.controller';
import { ProblemService } from './problem.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ProblemController],
  providers: [ProblemService],
})
export class ProblemModule {}
