import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { UserDto } from "@agora/shared";
import { User } from "../domain/user.entity";
import { USER_REPOSITORY, type UserRepository } from "../domain/user.repository";
import { CreateUserInput } from "./dto/create-user.dto";
import { UserMapper } from "./user.mapper";

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async list(): Promise<UserDto[]> {
    const found = await this.users.findAll();
    return found.map(UserMapper.toDto);
  }

  async getById(id: string): Promise<UserDto> {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return UserMapper.toDto(user);
  }

  async create(input: CreateUserInput): Promise<UserDto> {
    const existing = await this.users.findByEmail(input.email.toLowerCase().trim());
    if (existing) throw new ConflictException(`User with email ${input.email} already exists`);

    const user = User.create({ id: randomUUID(), email: input.email, name: input.name });
    const saved = await this.users.save(user);
    return UserMapper.toDto(saved);
  }
}
