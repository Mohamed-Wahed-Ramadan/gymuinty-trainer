export interface Exercise {
  id: number;
  name: string;
  category: string;
  muscleGroup: string;
  equipment?: string | null;
  videoDemoUrl?: string | null;
  thumbnailUrl?: string | null;
  isCustom: boolean;
  trainerId?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}
