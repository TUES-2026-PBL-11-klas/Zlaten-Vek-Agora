import { IsEmail, IsString, MinLength } from "class-validator";

export class CreateUserInput {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  name!: string;
}
