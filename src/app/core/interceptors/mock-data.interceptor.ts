import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';

const mockTrainerProfile = {
  id: 3,
  updatedAt: '2024-12-28T15:30:00Z',
  createdAt: '2024-01-10T08:00:00Z',
  userId: 'user_1',
  userName: 'coach_ahmed',
  handle: '@coachahmed',
  bio: 'Certified personal trainer with 10+ years experience. Specialized in strength training and body transformation.',
  coverImageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&h=300&fit=crop',
  videoIntroUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  brandingColors: '#FF6B35,#004E89',
  isVerified: true,
  verifiedAt: '2024-02-01T10:00:00Z',
  isSuspended: false,
  suspendedAt: null,
  ratingAverage: 4.8,
  totalClients: 156,
  yearsExperience: 10,
  statusImageUrl: 'https://images.unsplash.com/photo-1517836357463-d25ddfcbf042?w=500&h=300&fit=crop',
  statusDescription: 'Currently accepting new clients! Limited spots available for December. Book your consultation now!'
};

const mockProgram = {
  id: 5,
  title: 'Advanced Strength Program',
  description: 'A comprehensive 12-week strength building program designed for intermediate to advanced lifters.',
  type: 1,
  durationWeeks: 12,
  price: 299.99,
  isPublic: true,
  maxClients: 50,
  thumbnailUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&h=300&fit=crop',
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-02-20T14:45:00Z',
  trainerProfileId: 3,
  trainerUserName: 'coach_ahmed',
  trainerHandle: '@coachahmed',
  weeks: [
    {
      id: 10,
      programId: 5,
      weekNumber: 1,
      days: [
        {
          id: 25,
          programWeekId: 10,
          dayNumber: 1,
          title: 'Upper Body Push',
          notes: 'Focus on form over weight',
          exercises: [
            {
              id: 100,
              programDayId: 25,
              exerciseId: 15,
              orderIndex: 1,
              sets: '4',
              reps: '8-12',
              restSeconds: 90,
              tempo: '3010',
              rpe: 8.5,
              percent1RM: 75.0,
              notes: 'Control the eccentric',
              videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
            },
            {
              id: 101,
              programDayId: 25,
              exerciseId: 16,
              orderIndex: 2,
              sets: '4',
              reps: '6-10',
              restSeconds: 120,
              tempo: '2010',
              rpe: 8,
              percent1RM: 80.0,
              notes: 'Full range of motion',
              videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
            }
          ]
        },
        {
          id: 26,
          programWeekId: 10,
          dayNumber: 2,
          title: 'Rest Day',
          notes: 'Active recovery recommended',
          exercises: []
        },
        {
          id: 27,
          programWeekId: 10,
          dayNumber: 3,
          title: 'Lower Body Strength',
          notes: 'Heavy focus on compound lifts',
          exercises: [
            {
              id: 102,
              programDayId: 27,
              exerciseId: 17,
              orderIndex: 1,
              sets: '5',
              reps: '3-5',
              restSeconds: 180,
              tempo: '2010',
              rpe: 9,
              percent1RM: 90.0,
              notes: 'Max effort day',
              videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
            }
          ]
        }
      ]
    },
    {
      id: 11,
      programId: 5,
      weekNumber: 2,
      days: [
        {
          id: 28,
          programWeekId: 11,
          dayNumber: 1,
          title: 'Upper Body Pull',
          notes: 'Focus on back development',
          exercises: []
        },
        {
          id: 29,
          programWeekId: 11,
          dayNumber: 2,
          title: 'Cardio & Core',
          notes: 'Light intensity conditioning',
          exercises: []
        }
      ]
    }
  ]
};

export const mockDataInterceptor: HttpInterceptorFn = (req, next) => {
  // Mock TrainerProfile endpoints
  if (req.url.includes('/api/trainer/TrainerProfile/Id/')) {
    return of(new HttpResponse({ status: 200, body: mockTrainerProfile }));
  }

  if (req.url.includes('/api/trainer/TrainerProfile/UserId/')) {
    return of(new HttpResponse({ status: 200, body: mockTrainerProfile }));
  }

  // Mock Program Details endpoint
  if (req.url.includes('/api/trainer/Programs/') && req.method === 'GET' && !req.url.includes('byTrainer') && !req.url.includes('search')) {
    return of(new HttpResponse({ status: 200, body: mockProgram }));
  }

  // For other requests, pass through
  return next(req);
};
