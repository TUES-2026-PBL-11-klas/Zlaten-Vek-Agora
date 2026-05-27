import { IsString, MinLength, MaxLength, IsOptional } from "class-validator";

export class CreateDebateBodyDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  billTitle!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200_000)
  billText?: string;
}
