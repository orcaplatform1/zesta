import { IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  productId!: string;

  @IsString()
  @MinLength(2)
  authorName!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
