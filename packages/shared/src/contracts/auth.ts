export interface AuthMeResponseDto {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface UpdateProfileRequestDto {
  name: string;
}
