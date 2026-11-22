import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSolutionDto {
  @IsInt()
  @Min(1)
  problemId!: number;

  @IsInt()
  @Min(1)
  userId!: number;

  // @IsBoolean()
  // passed!: boolean;

  // @IsInt()
  // @Min(0)
  // execMs!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  language!: string;

  @IsString()
  @IsOptional()
  // @IsNotEmpty()
  codeS3Url?: string;
}

export class UpdateSolutionDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  problemId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  userId?: number;

  @IsOptional()
  @IsBoolean()
  passed?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  execMs?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  language?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  codeS3Url?: string;
}
