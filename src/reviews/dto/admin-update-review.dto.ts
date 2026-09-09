import { IsBoolean, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class AdminUpdateReviewDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  authorName?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsBoolean()
  isApproved?: boolean;
}
