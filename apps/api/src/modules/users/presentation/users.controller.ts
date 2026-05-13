import { Body, Controller, Get, HttpCode, Param, Post } from "@nestjs/common";
import type { UserDto } from "@agora/shared";
import { CreateUserInput } from "../application/dto/create-user.dto";
import { UsersService } from "../application/users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(): Promise<UserDto[]> {
    return this.users.list();
  }

  @Get(":id")
  getById(@Param("id") id: string): Promise<UserDto> {
    return this.users.getById(id);
  }

  @Post()
  @HttpCode(201)
  create(@Body() body: CreateUserInput): Promise<UserDto> {
    return this.users.create(body);
  }
}
