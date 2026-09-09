import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class UpsertAddressDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsString()
  @MinLength(6)
  phone!: string;

  @IsString()
  city!: string;

  @IsString()
  district!: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsString()
  @MinLength(5)
  addressLine!: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
