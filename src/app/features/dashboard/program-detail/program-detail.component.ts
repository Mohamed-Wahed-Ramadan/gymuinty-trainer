import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProgramService, Program, ProgramWeek, ProgramDay, DayExercise } from '../../../core/services/program.service';
import { ExerciseLibraryService } from '../../../core/services/exercise-library.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-program-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="program; else empty" class="program-detail card mt-4 p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 class="mb-1">{{ program.title }}</h3>
          <p class="text-muted mb-0">Manage weeks, days, and exercises</p>
        </div>
        <div>
          <button class="btn btn-sm btn-outline-secondary me-2" (click)="refresh()">
            <i class="bi bi-arrow-clockwise"></i> Refresh
          </button>
          <button class="btn btn-sm btn-outline-danger" (click)="closeDetail()">
            <i class="bi bi-x"></i> Close
          </button>
        </div>
      </div>

      <div class="mb-3">
        <button class="btn btn-sm btn-primary me-2" (click)="addWeek()">
          <i class="bi bi-plus"></i> Add Week
        </button>
      </div>

      <div *ngFor="let w of program.weeks || []" class="card mb-3">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <strong>Week {{ w.weekNumber }}</strong>
            </div>
            <div>
              <button class="btn btn-sm btn-outline-secondary me-2" (click)="addDay(w)">Add Day</button>
              <button class="btn btn-sm btn-outline-danger" (click)="deleteWeek(w)">Delete Week</button>
            </div>
          </div>

          <div class="mt-3">
            <div *ngFor="let d of w.days || []" class="border rounded p-2 mb-2">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <strong>Day {{ d.dayNumber }}</strong>
                  <span class="text-muted ms-2">{{ d.title }}</span>
                </div>
                <div>
                  <button class="btn btn-sm btn-outline-success me-2" (click)="openAddExercise(d)">Add Exercise</button>
                  <button class="btn btn-sm btn-outline-danger" (click)="deleteDay(d)">Delete Day</button>
                </div>
              </div>

              <div class="mt-2">
                <div *ngFor="let ex of d.exercises || []; let i = index" class="d-flex justify-content-between align-items-center p-2 bg-light mb-1">
                  <div>
                    <strong>#{{ ex.orderIndex }} </strong>
                    ExerciseId: {{ ex.exerciseId }}
                    <div class="small text-muted">Sets: {{ ex.sets }} · Reps: {{ ex.reps }}</div>
                  </div>
                  <div>
                    <button class="btn btn-sm btn-outline-secondary me-2" (click)="removeExercise(ex)">Remove</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Exercise Panel -->
      <div *ngIf="addingToDay" class="card p-3 mb-3">
        <h5>Add Exercise to Day {{ addingToDay.dayNumber }}</h5>
        <div class="d-flex gap-2 mb-2">
          <input class="form-control" placeholder="Search exercises..." [(ngModel)]="exerciseSearch" (ngModelChange)="searchExercises()" />
        </div>
        <div *ngIf="searchResults.length===0" class="text-muted">No results</div>
        <div *ngFor="let s of searchResults" class="d-flex align-items-center gap-2 mb-2">
          <div class="flex-grow-1">{{ s.name }} <small class="text-muted">· {{ s.muscleGroup }}</small></div>
          <button class="btn btn-sm btn-primary" (click)="confirmAddExercise(s)">Add</button>
        </div>
        <div class="mt-2">
          <button class="btn btn-sm btn-secondary" (click)="cancelAdd()">Cancel</button>
        </div>
      </div>
    </div>
    <ng-template #empty>
      <div class="alert alert-info mt-4" role="alert">
        <i class="bi bi-info-circle"></i>
        <strong>No program selected.</strong> Click "View Details" on a program card to manage its weeks, days and exercises.
      </div>
    </ng-template>
  `
})
export class ProgramDetailComponent implements OnInit {
  program: Program | null = null;
  addingToDay: ProgramDay | null = null;
  exerciseSearch = '';
  searchResults: any[] = [];

  constructor(private svc: ProgramService, private exSvc: ExerciseLibraryService, private notify: NotificationService) {}

  ngOnInit(): void {
    this.svc.getSelectedProgram$().subscribe(p => this.program = p);
  }

  closeDetail(): void {
    this.svc.clearSelection();
    this.addingToDay = null;
    this.searchResults = [];
  }

  refresh() {
    if (!this.program?.id) return;
    this.svc.getProgramDetails(this.program.id).subscribe({ next: p => this.program = p, error: () => this.notify.error('Error','Failed to refresh program') });
  }

  addWeek() {
    if (!this.program?.id) return;
    const next = (this.program.weeks?.length || 0) + 1;
    this.svc.createWeek({ programId: this.program.id!, weekNumber: next }).subscribe({ next: () => this.refresh(), error: () => this.notify.error('Error','Failed to create week') });
  }

  deleteWeek(w: ProgramWeek) {
    if (!w.id) return;
    if (!confirm('Delete week?')) return;
    this.svc.deleteWeek(w.id).subscribe({ next: () => this.refresh(), error: () => this.notify.error('Error','Failed to delete week') });
  }

  addDay(w: ProgramWeek) {
    if (!w.id) return;
    const next = (w.days?.length || 0) + 1;
    this.svc.createDay({ programWeekId: w.id, dayNumber: next, title: `Day ${next}` }).subscribe({ next: () => this.refresh(), error: () => this.notify.error('Error','Failed to create day') });
  }

  deleteDay(d: ProgramDay) {
    if (!d.id) return;
    if (!confirm('Delete day?')) return;
    this.svc.deleteDay(d.id).subscribe({ next: () => this.refresh(), error: () => this.notify.error('Error','Failed to delete day') });
  }

  openAddExercise(d: ProgramDay) {
    this.addingToDay = d;
    this.exerciseSearch = '';
    this.searchResults = [];
  }

  cancelAdd() { this.addingToDay = null; this.searchResults = []; }

  searchExercises() {
    if (!this.exerciseSearch) { this.searchResults = []; return; }
    this.exSvc.search(this.exerciseSearch).subscribe({ next: r => this.searchResults = r || [], error: () => this.notify.error('Error','Search failed') });
  }

  confirmAddExercise(ex: any) {
    if (!this.addingToDay || !this.addingToDay.id) return;
    const order = (this.addingToDay.exercises?.length || 0) + 1;
    const payload: Omit<DayExercise,'id'> = { programDayId: this.addingToDay.id!, exerciseId: ex.id, orderIndex: order, sets: '3', reps: '12', restSeconds: 60 };
    this.svc.createDayExercise(payload).subscribe({ next: () => { this.notify.success('Added','Exercise added to day'); this.cancelAdd(); this.refresh(); }, error: () => this.notify.error('Error','Failed to add exercise') });
  }

  removeExercise(ex: DayExercise) {
    if (!ex.id) return; if (!confirm('Remove exercise from day?')) return;
    this.svc.deleteDayExercise(ex.id).subscribe({ next: () => this.refresh(), error: () => this.notify.error('Error','Failed to remove') });
  }
}
