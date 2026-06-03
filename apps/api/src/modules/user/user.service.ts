import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { IUserRepository, USER_REPOSITORY } from "./domain/i-user.repository";
import { UserEntity } from "./domain/user.entity";

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async getProfile(userId: string): Promise<UserEntity> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException("User not found.");
    return user;
  }

  async updateName(userId: string, name: string): Promise<UserEntity> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException("User not found.");
    return this.userRepository.updateName(userId, name);
  }

  async deleteAccount(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException("User not found.");
    await this.userRepository.deleteWithCascade(userId);
  }
}
