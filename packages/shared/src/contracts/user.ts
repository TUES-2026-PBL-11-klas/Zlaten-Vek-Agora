export interface UserDto {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface CreateUserDto {
  email: string;
  name: string;
}
