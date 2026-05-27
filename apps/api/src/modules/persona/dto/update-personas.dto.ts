import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";

const MAX_LIST = 32;
const MAX_NAME = 120;
const MAX_DEMOGRAPHIC = 240;
const MAX_BULLET = 240;
const MAX_BULLETS = 16;

export class PersonaAddBodyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_NAME)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(MAX_DEMOGRAPHIC)
  demographic!: string;

  @IsArray()
  @ArrayMaxSize(MAX_BULLETS)
  @IsString({ each: true })
  @MaxLength(MAX_BULLET, { each: true })
  interests!: string[];

  @IsArray()
  @ArrayMaxSize(MAX_BULLETS)
  @IsString({ each: true })
  @MaxLength(MAX_BULLET, { each: true })
  fears!: string[];

  @IsArray()
  @ArrayMaxSize(MAX_BULLETS)
  @IsString({ each: true })
  @MaxLength(MAX_BULLET, { each: true })
  priorities!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(32)
  color?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  avatarUrl?: string | null;
}

export class PersonaUpdateBodyDto {
  @IsUUID()
  id!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_NAME)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_DEMOGRAPHIC)
  demographic?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_BULLETS)
  @IsString({ each: true })
  @MaxLength(MAX_BULLET, { each: true })
  interests?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_BULLETS)
  @IsString({ each: true })
  @MaxLength(MAX_BULLET, { each: true })
  fears?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_BULLETS)
  @IsString({ each: true })
  @MaxLength(MAX_BULLET, { each: true })
  priorities?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(32)
  color?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  avatarUrl?: string | null;
}

export class UpdatePersonasBodyDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_LIST)
  @ValidateNested({ each: true })
  @Type(() => PersonaAddBodyDto)
  add?: PersonaAddBodyDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_LIST)
  @ValidateNested({ each: true })
  @Type(() => PersonaUpdateBodyDto)
  update?: PersonaUpdateBodyDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_LIST)
  @IsUUID(undefined, { each: true })
  remove?: string[];
}
