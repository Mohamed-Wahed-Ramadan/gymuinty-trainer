import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface DayExercise {
  id?: number;
  programDayId: number;
  exerciseId: number;
  orderIndex: number;
  sets: string;
  reps: string;
  restSeconds: number;
  tempo?: string;
  rpe?: number;
  percent1RM?: number;
  notes?: string;
  videoUrl?: string;
  exerciseDataJson?: string;
}

export interface ProgramDay {
  id?: number;
  programWeekId: number;
  dayNumber: number;
  title: string;
  notes?: string;
  exercises?: DayExercise[];
}

export interface ProgramWeek {
  id?: number;
  programId: number;
  weekNumber: number;
  days?: ProgramDay[];
}

export interface Program {
  id?: number;
  title: string;
  description: string;
  type: number;
  durationWeeks: number;
  price: number;
  isPublic: boolean;
  maxClients: number;
  thumbnailUrl?: string;
  trainerId?: string;
  trainerUserName?: string;
  trainerHandle?: string;
  createdAt?: string;
  updatedAt?: string;
  weeks?: ProgramWeek[];
}

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

  getMyPrograms(trainerId: string): Observable<Program[]> {
    return this.http.get<Program[]>(`${this.apiUrl}/Programs/byTrainer/${trainerId}`);
  }

  getProgramDetails(programId: number): Observable<Program> {
    return this.http.get<Program>(`${this.apiUrl}/Programs/${programId}`)
      .pipe(
        tap(program => this.selectedProgram$.next(program))
      );
  }

  createProgram(trainerId: string, program: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>): Observable<Program> {
    const payload = { ...program, trainerId };
    return this.http.post<Program>(`${this.apiUrl}/Programs`, payload);
  }

  updateProgram(programId: number, program: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>): Observable<Program> {
    return this.http.put<Program>(`${this.apiUrl}/Programs/${programId}`, program);
  }

  deleteProgram(programId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Programs/${programId}`);
  }

  // ============ WEEKS ============

  getWeeksByProgram(programId: number): Observable<ProgramWeek[]> {
    return this.http.get<ProgramWeek[]>(`${this.apiUrl}/Weeks/by-program/${programId}`);
  }

  getWeekDetails(weekId: number): Observable<ProgramWeek> {
    return this.http.get<ProgramWeek>(`${this.apiUrl}/Weeks/${weekId}`)
      .pipe(
        tap(week => this.selectedWeek$.next(week))
      );
  }

  createWeek(week: Omit<ProgramWeek, 'id'>): Observable<ProgramWeek> {
    return this.http.post<ProgramWeek>(`${this.apiUrl}/Weeks`, week);
  }

  updateWeek(weekId: number, week: Omit<ProgramWeek, 'id'>): Observable<ProgramWeek> {
    return this.http.put<ProgramWeek>(`${this.apiUrl}/Weeks/${weekId}`, week);
  }

  deleteWeek(weekId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Weeks/${weekId}`);
  }

  // ============ DAYS ============

  getDaysByWeek(weekId: number): Observable<ProgramDay[]> {
    return this.http.get<ProgramDay[]>(`${this.apiUrl}/Days/by-week/${weekId}`);
  }

  getDayDetails(dayId: number): Observable<ProgramDay> {
    return this.http.get<ProgramDay>(`${this.apiUrl}/Days/${dayId}`)
      .pipe(
        tap(day => this.selectedDay$.next(day))
      );
  }

  createDay(day: Omit<ProgramDay, 'id'>): Observable<ProgramDay> {
    return this.http.post<ProgramDay>(`${this.apiUrl}/Days`, day);
  }

  updateDay(dayId: number, day: Omit<ProgramDay, 'id'>): Observable<ProgramDay> {
    return this.http.put<ProgramDay>(`${this.apiUrl}/Days/${dayId}`, day);
  }

  deleteDay(dayId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Days/${dayId}`);
  }

  // ============ DAY EXERCISES ============

  getExercisesByDay(dayId: number): Observable<DayExercise[]> {
    return this.http.get<DayExercise[]>(`${this.apiUrl}/DayExercises/by-day/${dayId}`);
  }

  createDayExercise(exercise: Omit<DayExercise, 'id'>): Observable<DayExercise> {
    return this.http.post<DayExercise>(`${this.apiUrl}/DayExercises`, exercise);
  }

  updateDayExercise(exerciseId: number, exercise: Omit<DayExercise, 'id'>): Observable<DayExercise> {
    return this.http.put<DayExercise>(`${this.apiUrl}/DayExercises/${exerciseId}`, exercise);
  }

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
