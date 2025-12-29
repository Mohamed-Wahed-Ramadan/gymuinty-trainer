import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// ==================== INTERFACES ====================

export interface DayExercise {
  id: number;
  programDayId: number;
  exerciseId: number;
  orderIndex: number;
  sets?: string;
  reps?: string;
  restSeconds?: number;
  tempo?: string;
  rpe?: number;
  percent1RM?: number;
  notes?: string;
  videoUrl?: string;
  exerciseDataJson?: string;
}

export interface ProgramDay {
  id: number;
  programWeekId: number;
  dayNumber: number;
  title?: string;
  notes?: string;
  exercises?: DayExercise[];
}

export interface ProgramWeek {
  id: number;
  programId: number;
  weekNumber: number;
  days?: ProgramDay[];
}

export interface ProgramResponse {
  id: number;
  title: string;
  description: string;
  type: number;
  durationWeeks: number;
  price?: number;
  isPublic: boolean;
  maxClients?: number;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt?: string;
  trainerProfileId?: number;
  trainerUserName?: string;
  trainerHandle?: string;
  weeks?: ProgramWeek[];
}

export interface Program extends ProgramResponse {}

// ==================== SERVICE ====================

@Injectable({
  providedIn: 'root'
})
export class ProgramService {
  private readonly apiUrl = `${environment.apiUrl}/trainer`;
  private selectedProgram$ = new BehaviorSubject<Program | null>(null);
  private selectedWeek$ = new BehaviorSubject<ProgramWeek | null>(null);
  private selectedDay$ = new BehaviorSubject<ProgramDay | null>(null);

  constructor(private http: HttpClient) {}

  // ============ PROGRAMS ============

  /**
   * Get all programs
   */
  getAllPrograms(): Observable<Program[]> {
    return this.http.get<Program[]>(`${this.apiUrl}/Programs`);
  }

  /**
   * Get programs by trainer
   */
  getMyPrograms(trainerId: string): Observable<Program[]> {
    return this.http.get<Program[]>(`${this.apiUrl}/Programs/byTrainer/${trainerId}`);
  }

  /**
   * Get detailed program with all weeks, days, and exercises
   * GET /api/trainer/Programs/{id}
   */
  getProgramDetails(programId: number): Observable<Program> {
    return this.http.get<Program>(`${this.apiUrl}/Programs/${programId}`)
      .pipe(
        tap(program => this.selectedProgram$.next(program))
      );
  }

  /**
   * Search programs
   */
  searchPrograms(term?: string): Observable<Program[]> {
    let params = new HttpParams();
    if (term) {
      params = params.set('term', term);
    }
    return this.http.get<Program[]>(`${this.apiUrl}/Programs/search`, { params });
  }

  /**
   * Create a new program
   */
  createProgram(trainerProfileId: number | string, program: Omit<Program, 'id' | 'createdAt' | 'updatedAt' | 'weeks'>): Observable<Program> {
    const payload = { ...program, trainerProfileId };
    return this.http.post<Program>(`${this.apiUrl}/Programs`, payload);
  }

  /**
   * Update an existing program
   */
  updateProgram(programId: number, program: Partial<Omit<Program, 'id' | 'createdAt' | 'updatedAt'>>): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/Programs/${programId}`, program);
  }

  /**
   * Delete a program
   */
  deleteProgram(programId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Programs/${programId}`);
  }

  // ============ WEEKS ============

  /**
   * Get weeks by program
   */
  getWeeksByProgram(programId: number): Observable<ProgramWeek[]> {
    return this.http.get<ProgramWeek[]>(`${this.apiUrl}/Weeks/by-program/${programId}`);
  }

  /**
   * Get week details with days
   */
  getWeekDetails(weekId: number): Observable<ProgramWeek> {
    return this.http.get<ProgramWeek>(`${this.apiUrl}/Weeks/${weekId}`)
      .pipe(
        tap(week => this.selectedWeek$.next(week))
      );
  }

  /**
   * Create a new week
   */
  createWeek(week: Omit<ProgramWeek, 'id'>): Observable<ProgramWeek> {
    return this.http.post<ProgramWeek>(`${this.apiUrl}/Weeks`, week);
  }

  /**
   * Update a week
   */
  updateWeek(weekId: number, week: Partial<Omit<ProgramWeek, 'id'>>): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/Weeks/${weekId}`, week);
  }

  /**
   * Delete a week
   */
  deleteWeek(weekId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Weeks/${weekId}`);
  }

  // ============ DAYS ============

  /**
   * Get days by week
   */
  getDaysByWeek(weekId: number): Observable<ProgramDay[]> {
    return this.http.get<ProgramDay[]>(`${this.apiUrl}/Days/by-week/${weekId}`);
  }

  /**
   * Get day details with exercises
   */
  getDayDetails(dayId: number): Observable<ProgramDay> {
    return this.http.get<ProgramDay>(`${this.apiUrl}/Days/${dayId}`)
      .pipe(
        tap(day => this.selectedDay$.next(day))
      );
  }

  /**
   * Create a new day
   */
  createDay(day: Omit<ProgramDay, 'id'>): Observable<ProgramDay> {
    return this.http.post<ProgramDay>(`${this.apiUrl}/Days`, day);
  }

  /**
   * Update a day
   */
  updateDay(dayId: number, day: Partial<Omit<ProgramDay, 'id'>>): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/Days/${dayId}`, day);
  }

  /**
   * Delete a day
   */
  deleteDay(dayId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Days/${dayId}`);
  }

  // ============ DAY EXERCISES ============

  /**
   * Get exercises by day
   */
  getExercisesByDay(dayId: number): Observable<DayExercise[]> {
    return this.http.get<DayExercise[]>(`${this.apiUrl}/DayExercises/by-day/${dayId}`);
  }

  /**
   * Get day exercise by id
   */
  getDayExerciseById(exerciseId: number): Observable<DayExercise> {
    return this.http.get<DayExercise>(`${this.apiUrl}/DayExercises/${exerciseId}`);
  }

  /**
   * Create a day exercise
   */
  createDayExercise(exercise: Omit<DayExercise, 'id'>): Observable<DayExercise> {
    return this.http.post<DayExercise>(`${this.apiUrl}/DayExercises`, exercise);
  }

  /**
   * Update a day exercise
   */
  updateDayExercise(exerciseId: number, exercise: Partial<Omit<DayExercise, 'id'>>): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/DayExercises/${exerciseId}`, exercise);
  }

  /**
   * Delete a day exercise
   */
  deleteDayExercise(exerciseId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/DayExercises/${exerciseId}`);
  }

  // ============ OBSERVABLES ============

  getSelectedProgram$(): Observable<Program | null> {
    return this.selectedProgram$.asObservable();
  }

  setSelectedProgram(program: Program): void {
    this.selectedProgram$.next(program);
  }

  getSelectedWeek$(): Observable<ProgramWeek | null> {
    return this.selectedWeek$.asObservable();
  }

  setSelectedWeek(week: ProgramWeek): void {
    this.selectedWeek$.next(week);
  }

  getSelectedDay$(): Observable<ProgramDay | null> {
    return this.selectedDay$.asObservable();
  }

  setSelectedDay(day: ProgramDay): void {
    this.selectedDay$.next(day);
  }

  clearSelection(): void {
    this.selectedProgram$.next(null);
    this.selectedWeek$.next(null);
    this.selectedDay$.next(null);
  }
}
