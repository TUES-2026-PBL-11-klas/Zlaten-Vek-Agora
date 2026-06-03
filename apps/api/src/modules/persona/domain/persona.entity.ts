export interface PersonaEntity {
  id: string;
  debateId: string;
  name: string;
  role: string;
  demographic: string;
  interests: string[];
  fears: string[];
  priorities: string[];
  color: string;
  avatarUrl: string | null;
  createdAt: Date;
}
