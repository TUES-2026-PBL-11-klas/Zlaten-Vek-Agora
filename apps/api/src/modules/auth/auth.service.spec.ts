import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { IUserRepository, USER_REPOSITORY } from "../user/domain/i-user.repository";
import { UserEntity } from "../user/domain/user.entity";

describe("AuthService", () => {
  const supabaseId = "11111111-1111-1111-1111-111111111111";
  const email = "ada@example.com";
  const existing: UserEntity = {
    id: supabaseId,
    email,
    name: "ada",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  };

  let repository: jest.Mocked<IUserRepository>;
  let service: AuthService;

  beforeEach(async () => {
    repository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      upsertById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, { provide: USER_REPOSITORY, useValue: repository }],
    }).compile();

    service = module.get(AuthService);
  });

  it("returns the existing user without upserting on subsequent logins", async () => {
    repository.findById.mockResolvedValueOnce(existing);

    const result = await service.getOrCreateUser(supabaseId, email);

    expect(result).toBe(existing);
    expect(repository.findById).toHaveBeenCalledWith(supabaseId);
    expect(repository.upsertById).not.toHaveBeenCalled();
  });

  it("creates a synced user on first login using the Supabase id", async () => {
    repository.findById.mockResolvedValueOnce(null);
    repository.upsertById.mockResolvedValueOnce(existing);

    const result = await service.getOrCreateUser(supabaseId, email);

    expect(result).toBe(existing);
    expect(repository.upsertById).toHaveBeenCalledWith(supabaseId, { email, name: "ada" });
  });

  it("falls back to a default name when the email has no local part", async () => {
    repository.findById.mockResolvedValueOnce(null);
    repository.upsertById.mockResolvedValueOnce({ ...existing, name: "user" });

    await service.getOrCreateUser(supabaseId, "@example.com");

    expect(repository.upsertById).toHaveBeenCalledWith(supabaseId, {
      email: "@example.com",
      name: "user",
    });
  });
});
