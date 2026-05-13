import type { UserDto } from "@agora/shared";
import { User } from "../domain/user.entity";

export class UserMapper {
  static toDto(user: User): UserDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
