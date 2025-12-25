export interface Exercise {
  id: number;
  name: string;
  category: string;
  muscleGroup: string;
  equipment: string;
  videoDemoUrl?: string | null;
  thumbnailUrl?: string | null;
  isCustom: boolean;
  trainerId?: string | null;
  createdAt: string;
}
