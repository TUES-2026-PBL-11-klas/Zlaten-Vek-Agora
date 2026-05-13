import { Injectable } from "@nestjs/common";
import { User } from "../domain/user.entity";
import type { UserRepository } from "../domain/user.repository";

@Injectable()
export class InMemoryUserRepository implements UserRepository {
  private readonly store = new Map<string, User>();

  async findAll(): Promise<User[]> {
    return Array.from(this.store.values());
  }

  async findById(id: string): Promise<User | null> {
    return this.store.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.store.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async save(user: User): Promise<User> {
    this.store.set(user.id, user);
    return user;
  }
}
