import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CheckoutDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  phone!: string;

  @IsString()
  @MinLength(2)
  fullName!: string;

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
  @IsString()
  couponCode?: string;
}
