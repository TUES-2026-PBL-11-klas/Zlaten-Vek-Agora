import { UserEntity } from "./user.entity";

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  save(user: Omit<UserEntity, "id" | "createdAt">): Promise<UserEntity>;
  upsertById(id: string, data: { email: string; name: string }): Promise<UserEntity>;
  updateName(id: string, name: string): Promise<UserEntity>;
  deleteWithCascade(id: string): Promise<void>;
}

export const USER_REPOSITORY = Symbol("IUserRepository");
