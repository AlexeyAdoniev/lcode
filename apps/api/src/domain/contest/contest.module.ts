import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../db/database.module';
import { ContestController } from './contest.controller';
import { ContestService } from './contest.service';
import { LeaderboardController } from './leaderboard.controller';
import { SolutionModule } from '../solution/solution.module';

@Module({
  imports: [DatabaseModule, SolutionModule],
  controllers: [ContestController, LeaderboardController],
  providers: [ContestService],
  exports: [ContestService],
})
export class ContestModule { }
