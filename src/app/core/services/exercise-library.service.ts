import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Exercise } from '../models/exercise.models';

@Injectable({ providedIn: 'root' })
export class ExerciseLibraryService {
  private readonly baseUrl = `${environment.apiUrl}/trainer/ExerciseLibrary`;

  constructor(private http: HttpClient) {}

  getAll(trainerId?: string | null): Observable<Exercise[]> {
    let params = new HttpParams();
    if (trainerId) params = params.set('trainerId', trainerId);
    return this.http.get<Exercise[]>(`${this.baseUrl}`, { params })
      .pipe(catchError(this.handleError));
  }

  search(name: string, trainerId?: string | null): Observable<Exercise[]> {
    let params = new HttpParams().set('name', name || '');
    if (trainerId) params = params.set('trainerId', trainerId);
    return this.http.get<Exercise[]>(`${this.baseUrl}/search`, { params })
      .pipe(catchError(this.handleError));
  }

  getById(id: number): Observable<Exercise> {
    return this.http.get<Exercise>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // payload may be JSON or FormData (for file uploads)
  create(payload: any): Observable<Exercise> {
    return this.http.post<Exercise>(this.baseUrl, payload)
      .pipe(catchError(this.handleError));
  }

  update(id: number, payload: any): Observable<Exercise> {
    return this.http.put<Exercise>(`${this.baseUrl}/${id}`, payload)
      .pipe(catchError(this.handleError));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let message = 'An unexpected error occurred';
    if (error.error && error.error.message) message = error.error.message;
    else if (error.status === 0) message = 'Network error. Check your connection.';
    console.error('ExerciseLibraryService Error:', message, error);
    return throwError(() => new Error(message));
  }
}
