import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../db/database.module';
import { SolutionController } from './solution.controller';
import { SolutionService } from './solution.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SolutionController],
  providers: [SolutionService],
})
export class SolutionModule {}
