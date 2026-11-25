import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { PaginationQueryDto } from '@lcode/pagination';
import { CreateSolutionDto, UpdateSolutionDto } from './dto/solution.dto';
import { CreateSolutionResponse, Solution } from './entities/solution.entity';
import { SolutionService } from './solution.service';

@Controller('solutions')
export class SolutionController {
  constructor(private readonly solutions: SolutionService) { }

  @Post()
  @HttpCode(200)
  create(@Body() dto: CreateSolutionDto): Promise<CreateSolutionResponse> {
    return this.solutions.create(dto);
  }

  @Post(':id/upload-complete')
  @HttpCode(200)
  completeUpload(@Param('id', ParseIntPipe) id: number): Promise<Solution> {
    return this.solutions.completeUpload(id);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto): Promise<Solution[]> {
    return this.solutions.findAll(query.page ?? 1, query.perPage ?? 20);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Solution> {
    return this.solutions.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSolutionDto,
  ): Promise<Solution> {
    return this.solutions.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.solutions.remove(id);
  }
}
