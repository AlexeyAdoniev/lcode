import { Controller, Get, Injectable, Param, ParseIntPipe, Query } from '@nestjs/common';
import { PaginationQueryDto } from '@lcode/pagination';

import { SolutionService } from '../solution/solution.service';

@Controller('leaderboard')
export class LeaderboardController {

  constructor(private readonly solutions: SolutionService) { }

  @Get(':contestId')
  getLB(
    @Param('contestId', ParseIntPipe) _contestId: number,
    @Query() _query: PaginationQueryDto,
  ) {
    // Leaderboard calculation will be implemented later.
    return this.solutions.getLeaderboard(_contestId)
  }
}


