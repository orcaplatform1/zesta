import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDesignerApplicationDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(2)
  brandName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  phone!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(20)
  password!: string;

  @IsString()
  country!: string;

  @IsString()
  city!: string;

  @IsBoolean()
  canInvoice!: boolean;

  @IsString()
  companySize!: string;

  @IsString()
  referralSource!: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  instagram?: string;

  @IsString()
  category!: string;

  @IsOptional()
  @IsString()
  otherCategory?: string;

  @IsOptional()
  @IsString()
  message?: string;
}
