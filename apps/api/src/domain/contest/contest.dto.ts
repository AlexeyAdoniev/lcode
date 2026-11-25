import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';

export class ContestProblemDto {
  @IsInt()
  @Min(1)
  id!: number;

  @IsNumber()
  @Min(0)
  score!: number;
}

export class CreateContestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContestProblemDto)
  problems!: ContestProblemDto[];

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;
}

export class UpdateContestDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContestProblemDto)
  problems?: ContestProblemDto[];

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
