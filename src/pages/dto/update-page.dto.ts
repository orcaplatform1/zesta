import { IsString } from 'class-validator';

export class UpdatePageDto {
  @IsString()
  title!: string;

  @IsString()
  content!: string;
}
