import { Inject, Injectable } from "@nestjs/common";
import { IUserRepository, USER_REPOSITORY } from "../user/domain/i-user.repository";
import { UserEntity } from "../user/domain/user.entity";

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async getOrCreateUser(supabaseId: string, email: string): Promise<UserEntity> {
    const existing = await this.userRepository.findById(supabaseId);
    if (existing) {
      return existing;
    }

    const name = email.split("@")[0] || "user";
    return this.userRepository.upsertById(supabaseId, { email, name });
  }
}
