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
  UseGuards,
  Req
} from '@nestjs/common';
import { PaginationQueryDto } from '@lcode/pagination';
import { CreateProblemDto, UpdateProblemDto } from './problem.dto';
import { Problem } from './problem.entity';
import { ProblemService } from './problem.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('problems')
export class ProblemController {
  constructor(private readonly problems: ProblemService) { }

  @Post()
  @HttpCode(200)
  create(@Body() dto: CreateProblemDto): Promise<Problem> {
    return this.problems.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() query: PaginationQueryDto, @Req() request: Request): Promise<Problem[]> {
    return this.problems.findAll(query.page ?? 1, query.perPage ?? 20);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Problem> {
    return this.problems.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProblemDto): Promise<Problem> {
    return this.problems.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.problems.remove(id);
  }
}
