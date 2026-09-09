import { IsBoolean, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateIyzicoConfigDto {
  @IsString()
  apiKey!: string;

  @IsOptional()
  @IsString()
  secretKey?: string;

  @IsUrl({ require_tld: false })
  baseUrl!: string;

  @IsBoolean()
  enabled!: boolean;
}
