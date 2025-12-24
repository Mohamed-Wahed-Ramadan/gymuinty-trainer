export interface TrainerProfile {
  id: string;
  userId: string;
  specialization: string;
  bio: string;
  yearsOfExperience: number;
  certifications: string[];
  hourlyRate: number;
  maxClients: number;
  availability: AvailabilitySlot[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface Program {
  id: string;
  trainerId: string;
  name: string;
  description: string;
  duration: number; // in weeks
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  exercises: Exercise[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  muscleGroup: string;
  sets: number;
  reps: number;
  weight?: number;
  duration?: number; // in seconds
  imageUrl?: string;
}

export interface Package {
  id: string;
  trainerId: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in months
  sessionsPerWeek: number;
  benefits: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id: string;
  trainerId: string;
  name: string;
  email: string;
  phone: string;
  profilePhotoUrl?: string;
  package?: Package;
  startDate: Date;
  endDate: Date;
  progress?: ClientProgress;
}

export interface ClientProgress {
  clientId: string;
  currentWeight: number;
  targetWeight: number;
  sessionsCompleted: number;
  lastSessionDate: Date;
}
