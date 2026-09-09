import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum DiscountTypeDto {
  PERCENT = 'PERCENT',
  FIXED = 'FIXED',
  FREE_SHIPPING = 'FREE_SHIPPING',
}

export class CreateCouponDto {
  @IsString()
  code!: string;

  @IsEnum(DiscountTypeDto)
  discountType!: DiscountTypeDto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minCartAmount?: number;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
