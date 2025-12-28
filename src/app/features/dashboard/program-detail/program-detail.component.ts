import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProgramService, Program, ProgramWeek, ProgramDay, DayExercise } from '../../../core/services/program.service';
import { Exercise } from '../../../core/models/exercise.models';
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
              <button class="btn btn-sm btn-outline-secondary me-2" (click)="openCreateDay(w)">Add Day</button>
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
                <div *ngFor="let ex of d.exercises || []; let i = index" class="d-flex align-items-center p-2 bg-light mb-1">
                  <div class="d-flex align-items-center flex-grow-1">
                    <img *ngIf="resolveExerciseThumbnail(ex.exerciseId)" [src]="resolveExerciseThumbnail(ex.exerciseId)" alt="thumb" style="width:56px;height:40px;object-fit:cover;border-radius:4px;margin-right:8px" />
                    <div>
                      <div><strong>#{{ ex.orderIndex }}</strong> — {{ resolveExerciseName(ex.exerciseId) }}</div>
                      <div class="small text-muted">Sets: {{ ex.sets }} · Reps: {{ ex.reps }}</div>
                    </div>
                  </div>
                  <div>
                    <button class="btn btn-sm btn-outline-secondary me-2" (click)="removeExercise(ex)">Remove</button>
                    <button class="btn btn-sm btn-outline-info" (click)="viewExerciseDetail(ex.id)">Details</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Create Day Modal (renders once per-week when creatingDayForWeek matches) -->
          <div *ngIf="creatingDayForWeek?.id === w.id" class="card p-3 mb-3">
            <h5>Create Day for Week {{ creatingDayForWeek?.weekNumber }}</h5>
            <form (submit)="createDaySubmit($event)">
              <div class="row g-2 align-items-center">
                <div class="col-auto" style="width:110px">
                  <label class="form-label">Day No</label>
                  <input class="form-control" type="number" [(ngModel)]="dayForm.dayNumber" name="dayNumber" required />
                </div>
                <div class="col">
                  <label class="form-label">Title</label>
                  <input class="form-control" [(ngModel)]="dayForm.title" name="title" placeholder="e.g. Active Recovery" />
                </div>
                <div class="col-12">
                  <label class="form-label">Notes</label>
                  <textarea class="form-control" [(ngModel)]="dayForm.notes" name="notes" rows="2"></textarea>
                </div>
              </div>
              <div class="mt-2">
                <button class="btn btn-sm btn-primary" type="submit">Create</button>
                <button class="btn btn-sm btn-secondary ms-2" type="button" (click)="cancelCreateDay()">Cancel</button>
              </div>
            </form>
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
          <button class="btn btn-sm btn-primary" (click)="prepareAddExercise(s)">Add</button>
        </div>

        <!-- Exercise add details form (appears after selecting an exercise) -->
        <div *ngIf="selectedExerciseToAdd" class="card p-3 mb-3">
          <h6>Adding: {{ selectedExerciseToAdd.name }}</h6>
          <form (submit)="submitAddExercise($event)">
            <div class="row g-2">
              <div class="col-3">
                <label class="form-label">Sets</label>
                <input class="form-control" [(ngModel)]="addExerciseForm.sets" name="sets" />
              </div>
              <div class="col-3">
                <label class="form-label">Rest (s)</label>
                <input class="form-control" type="number" [(ngModel)]="addExerciseForm.restSeconds" name="restSeconds" />
              </div>
              <div class="col-3">
                <label class="form-label">Tempo</label>
                <input class="form-control" [(ngModel)]="addExerciseForm.tempo" name="tempo" />
              </div>
              <div class="col-3">
                <label class="form-label">RPE</label>
                <input class="form-control" type="number" [(ngModel)]="addExerciseForm.rpe" name="rpe" />
              </div>
              <div class="col-3">
                <label class="form-label">%1RM</label>
                <input class="form-control" type="number" [(ngModel)]="addExerciseForm.percent1RM" name="percent1RM" />
              </div>

              <div class="col-12">
                <label class="form-label">Notes</label>
                <textarea class="form-control" rows="2" [(ngModel)]="addExerciseForm.notes" name="notes"></textarea>
              </div>
              <div class="col-12">
                <label class="form-label">Extra JSON</label>
                <input class="form-control" [(ngModel)]="addExerciseForm.exerciseDataJson" name="exerciseDataJson" placeholder='{"intensity":"moderate"}' />
              </div>
            </div>
            <div class="mt-2">
              <button class="btn btn-sm btn-primary" type="submit">Add to Day</button>
              <button class="btn btn-sm btn-secondary ms-2" type="button" (click)="cancelPrepareAdd()">Cancel</button>
            </div>
          </form>
        </div>
        <div class="mt-2">
          <button class="btn btn-sm btn-secondary" (click)="cancelAdd()">Cancel</button>
        </div>
      </div>

      <!-- Day Exercise Detail Modal -->
      <div *ngIf="dayExerciseDetail" class="modal" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);z-index:1050;">
        <div class="modal-content card p-3" style="max-width:640px;width:90%;position:relative;">
          <button class="btn btn-sm btn-outline-secondary" style="position:absolute;top:8px;right:8px;" (click)="closeExerciseDetail()">Close</button>
          <h5 style="text-align:center;margin-top:6px;">Exercise Detail</h5>
          <div class="row mt-2">
            <div class="col-md-8">
              <div><strong>Order:</strong> {{ dayExerciseDetail.orderIndex }}</div>
              <div><strong>Sets / Reps:</strong> {{ dayExerciseDetail.sets }} · {{ dayExerciseDetail.reps }}</div>
              <div><strong>Tempo:</strong> {{ dayExerciseDetail.tempo || '-' }}</div>
              <div><strong>RPE:</strong> {{ dayExerciseDetail.rpe ?? '-' }}</div>
              <div><strong>Notes:</strong> {{ dayExerciseDetail.notes || '-' }}</div>
              <div *ngIf="resolveExerciseName(dayExerciseDetail.exerciseId)">
                <strong>Exercise:</strong> {{ resolveExerciseName(dayExerciseDetail.exerciseId) }}
              </div>
            </div>
            <div class="col-md-4 d-flex align-items-center justify-content-center">
              <div *ngIf="resolveExerciseThumbnail(dayExerciseDetail.exerciseId)">
                <img [src]="resolveExerciseThumbnail(dayExerciseDetail.exerciseId)" alt="thumb" style="max-width:100%;max-height:140px;object-fit:cover;border-radius:6px;" />
              </div>
            </div>
          </div>
          <div class="mt-3">
            <div *ngIf="dayExerciseDetail.videoUrl">
              <video width="100%" controls [src]="dayExerciseDetail.videoUrl"></video>
            </div>
          </div>
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
  creatingDayForWeek: ProgramWeek | null = null;
  dayForm: { dayNumber?: number; title?: string; notes?: string } = {};
  selectedExerciseToAdd: any | null = null;
  addExerciseForm: any = { sets: '3', reps: '12', restSeconds: 60, tempo: '', rpe: null, percent1RM: null, notes: '', videoUrl: '', exerciseDataJson: '' };
  exerciseSearch = '';
  searchResults: any[] = [];
  private exerciseCache: Record<number, Exercise> = {};
  dayExerciseDetail: any | null = null;

  constructor(private svc: ProgramService, private exSvc: ExerciseLibraryService, private notify: NotificationService) {}

  ngOnInit(): void {
    this.svc.getSelectedProgram$().subscribe(p => { this.program = p; this.prefetchExercises(); });
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

  private prefetchExercises() {
    // collect all exerciseIds in current program and fetch details into cache
    const ids = new Set<number>();
    if (!this.program) return;
    (this.program.weeks || []).forEach(w => (w.days || []).forEach(d => (d.exercises || []).forEach(e => { if (e.exerciseId) ids.add(e.exerciseId); })));
    ids.forEach(id => {
      if (!this.exerciseCache[id]) {
        this.exSvc.getById(id).subscribe({ next: ex => this.exerciseCache[id] = ex, error: () => { /* ignore fetch errors */ } });
      }
    });
  }

  resolveExerciseName(id?: number) {
    if (!id) return 'Unknown Exercise';
    return this.exerciseCache[id]?.name || `Exercise ${id}`;
  }

  resolveExerciseThumbnail(id?: number) {
    if (!id) return '';
    return this.exerciseCache[id]?.thumbnailUrl || '';
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

  openCreateDay(w: ProgramWeek) {
    if (!w.id) return;
    const next = (w.days?.length || 0) + 1;
    this.creatingDayForWeek = w;
    this.dayForm = { dayNumber: next, title: `Day ${next}`, notes: '' };
  }

  cancelCreateDay() {
    this.creatingDayForWeek = null;
    this.dayForm = {};
  }

  createDaySubmit(ev: Event) {
    ev.preventDefault();
    if (!this.creatingDayForWeek || !this.creatingDayForWeek.id) return;
    const payload: any = {
      programWeekId: this.creatingDayForWeek.id,
      dayNumber: this.dayForm.dayNumber,
      title: this.dayForm.title || `Day ${this.dayForm.dayNumber}`,
      notes: this.dayForm.notes || ''
    };
    this.svc.createDay(payload).subscribe({ next: () => { this.notify.success('Created', 'Day created'); this.cancelCreateDay(); this.refresh(); }, error: () => this.notify.error('Error','Failed to create day') });
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

  prepareAddExercise(ex: any) {
    this.selectedExerciseToAdd = ex;
    this.addExerciseForm = {
      sets: '3',
      reps: '12',
      restSeconds: 60,
      tempo: '',
      rpe: null,
      percent1RM: null,
      notes: '',
      videoUrl: ex.videoDemoUrl || ex.videoUrl || '',
      exerciseDataJson: ''
    };
  }

  cancelPrepareAdd() {
    this.selectedExerciseToAdd = null;
    this.addExerciseForm = { sets: '3', reps: '12', restSeconds: 60, tempo: '', rpe: null, percent1RM: null, notes: '', videoUrl: '', exerciseDataJson: '' };
  }

  submitAddExercise(ev: Event) {
    ev.preventDefault();
    if (!this.addingToDay || !this.addingToDay.id || !this.selectedExerciseToAdd) return;
    const order = (this.addingToDay.exercises?.length || 0) + 1;
    const setsNum = Number(this.addExerciseForm.sets) || 0;
    const repsNum = Number(this.addExerciseForm.reps) || 0;
    const restSecNum = Number(this.addExerciseForm.restSeconds) || 0;
    const rpeNum = this.addExerciseForm.rpe == null ? null : Number(this.addExerciseForm.rpe);
    let percentNum = this.addExerciseForm.percent1RM == null ? null : Number(this.addExerciseForm.percent1RM);
    if (percentNum != null) {
      if (isNaN(percentNum)) percentNum = null;
      else percentNum = Math.max(0, Math.min(100, percentNum));
    }

    const payload: any = {
      programDayId: this.addingToDay.id,
      exerciseId: this.selectedExerciseToAdd.id,
      orderIndex: Number(order),
      sets: String(setsNum),
      reps: String(repsNum),
      restSeconds: restSecNum,
      tempo: this.addExerciseForm.tempo,
      rpe: rpeNum,
      percent1RM: percentNum,
      notes: this.addExerciseForm.notes,
      videoUrl: this.addExerciseForm.videoUrl,
      exerciseDataJson: this.addExerciseForm.exerciseDataJson
    };

    this.svc.createDayExercise(payload).subscribe({ next: () => { this.notify.success('Added','Exercise added to day'); this.cancelPrepareAdd(); this.cancelAdd(); this.refresh(); }, error: (err) => { console.error('Failed to create day exercise', err); this.notify.error('Error','Failed to add exercise'); } });
  }

  viewExerciseDetail(id?: number) {
    if (!id) return;
    this.svc.getDayExerciseById(id).subscribe({
      next: d => { this.dayExerciseDetail = d; this.ensureExerciseCached(d.exerciseId); },
      error: err => { console.error('Failed to load day exercise', id, err); this.notify.error('Error','Failed to load exercise details'); }
    });
  }

  closeExerciseDetail() { this.dayExerciseDetail = null; }

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

  // helper to ensure exercise metadata is cached
  private ensureExerciseCached(exId?: number) {
    if (!exId) return;
    if (!this.exerciseCache[exId]) {
      this.exSvc.getById(exId).subscribe({ next: ex => this.exerciseCache[exId] = ex, error: () => {} });
    }
  }
}
