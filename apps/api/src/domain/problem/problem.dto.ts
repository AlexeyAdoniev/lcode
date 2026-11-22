import { Allow, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ProblemTest } from './problem.entity';

export class CreateProblemDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @Allow()
  tests!: ProblemTest[];
}

export class UpdateProblemDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @Allow()
  tests?: ProblemTest[];
}
