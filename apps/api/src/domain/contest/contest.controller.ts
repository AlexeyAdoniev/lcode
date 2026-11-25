import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PaginationQueryDto } from '@lcode/pagination';
import { CreateContestDto, UpdateContestDto } from './contest.dto';
import { Contest } from './contest.entity';
import { ContestService } from './contest.service';

@Controller('contests')
export class ContestController {
  constructor(private readonly contests: ContestService) {}

  @Post()
  @HttpCode(200)
  create(@Body() dto: CreateContestDto): Promise<Contest> {
    return this.contests.create(dto);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto): Promise<Contest[]> {
    return this.contests.findAll(query.page ?? 1, query.perPage ?? 20);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Contest> {
    return this.contests.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContestDto,
  ): Promise<Contest> {
    return this.contests.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.contests.remove(id);
  }
}
