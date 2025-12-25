import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Exercise } from '../../core/models/exercise.models';
import { ExerciseLibraryService } from '../../core/services/exercise-library.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-exercise-library',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="exercise-library">
      <h1>Exercise Library</h1>

      <div style="margin-bottom:12px">
        <button class="btn btn-success" (click)="openCreate()">+ New Exercise</button>
      </div>

      <div class="controls">
        <input class="form-control" placeholder="Search exercises..." [(ngModel)]="searchTerm" (ngModelChange)="onSearch()" />
        <select class="form-select" [(ngModel)]="filterCategory" (change)="applyFilters()">
          <option value="">All Categories</option>
          <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
        </select>
        <select class="form-select" [(ngModel)]="filterMuscle" (change)="applyFilters()">
          <option value="">All Muscle Groups</option>
          <option *ngFor="let m of muscleGroups" [value]="m">{{ m }}</option>
        </select>
        <select class="form-select" [(ngModel)]="filterEquipment" (change)="applyFilters()">
          <option value="">All Equipment</option>
          <option *ngFor="let e of equipmentList" [value]="e">{{ e }}</option>
        </select>
      </div>

      <div class="grid">
        <div class="card" *ngFor="let ex of filteredExercises">
          <img *ngIf="ex.thumbnailUrl" [src]="resolveUrl(ex.thumbnailUrl)" alt="{{ ex.name }}" />
          <div class="card-body">
            <h4>{{ ex.name }}</h4>
            <p class="meta">{{ ex.category }} · {{ ex.muscleGroup }} · {{ ex.equipment }}</p>
            <button class="btn btn-sm btn-primary" (click)="openDetail(ex)">Details</button>
            <button class="btn btn-sm btn-outline-success ms-2" (click)="addToDay(ex)">Add to Day</button>
            <button class="btn btn-sm btn-outline-secondary ms-2" (click)="openEdit(ex)">Edit</button>
            <button class="btn btn-sm btn-danger ms-2" (click)="deleteExercise(ex)">Delete</button>
          </div>
        </div>
      </div>

      <div class="modal" *ngIf="selectedExercise">
        <div class="modal-content">
          <button class="close" (click)="closeDetail()">×</button>
          <h3>{{ selectedExercise.name }}</h3>
          <p>{{ selectedExercise.category }} · {{ selectedExercise.muscleGroup }}</p>
          <div *ngIf="selectedExercise.videoDemoUrl">
            <video width="100%" controls [src]="selectedExercise.videoDemoUrl"></video>
          </div>
          <div class="actions">
            <button class="btn btn-primary" (click)="addToDay(selectedExercise)">Add to Day</button>
          </div>
        </div>
      </div>

      <!-- Create / Edit Modal -->
      <div class="modal" *ngIf="showFormModal">
        <div class="modal-content">
          <button class="close" (click)="closeForm()">×</button>
          <h3>{{ isEditing ? 'Edit Exercise' : 'Create Exercise' }}</h3>
          <form (submit)="submitForm($event)">
            <div style="display:flex; gap:8px; flex-wrap:wrap">
              <input class="form-control" placeholder="Name" [(ngModel)]="form.name" name="name" required />
              <input class="form-control" placeholder="Category" [(ngModel)]="form.category" name="category" />
              <input class="form-control" placeholder="Muscle Group" [(ngModel)]="form.muscleGroup" name="muscleGroup" />
              <input class="form-control" placeholder="Equipment" [(ngModel)]="form.equipment" name="equipment" />
              <label class="form-label">Thumbnail</label>
              <input type="file" (change)="onThumbnailChange($event)" />
              <label class="form-label">Video Demo</label>
              <input type="file" (change)="onVideoChange($event)" />
            </div>
            <div style="margin-top:8px">
              <button class="btn btn-primary" type="submit">{{ isEditing ? 'Save' : 'Create' }}</button>
              <button class="btn btn-secondary ms-2" type="button" (click)="closeForm()">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .exercise-library { padding: 24px; }
    .controls { display:flex; gap:8px; margin-bottom:16px; flex-wrap:wrap }
    .grid { display:flex; flex-wrap:wrap; gap:12px }
    .card { width:220px; border:1px solid #eee; border-radius:6px; overflow:hidden }
    .card img { width:100%; height:120px; object-fit:cover }
    .card-body { padding:8px }
    .meta { font-size:12px; color:#666 }
    .modal { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center }
    .modal-content { background:#fff; padding:16px; width:720px; max-width:95%; border-radius:6px }
    .close { float:right; border:none; background:transparent; font-size:20px }
  `]
})
export class ExerciseLibraryComponent implements OnInit {
  exercises: Exercise[] = [];
  filteredExercises: Exercise[] = [];
  selectedExercise: Exercise | null = null;
  showFormModal = false;
  isEditing = false;
  form: any = { name: '', category: '', muscleGroup: '', equipment: '', isCustom: true };
  thumbnailFile: File | null = null;
  videoFile: File | null = null;

  searchTerm = '';
  filterCategory = '';
  filterMuscle = '';
  filterEquipment = '';

  categories: string[] = [];
  muscleGroups: string[] = [];
  equipmentList: string[] = [];

  constructor(private svc: ExerciseLibraryService, private auth: AuthService, private notify: NotificationService) {}

  ngOnInit(): void {
    this.loadExercises();
  }

  loadExercises(): void {
    const trainerId = this.auth.getUserIdFromToken();
    this.svc.getAll(trainerId).subscribe({
      next: data => {
        this.exercises = data || [];
        this.populateFilters();
        this.applyFilters();
      },
      error: err => { console.error('Failed to load exercises', err); this.notify.error('Error', 'Failed to load exercises'); }
    });
  }

  populateFilters(): void {
    const cats = new Set<string>();
    const muscles = new Set<string>();
    const equip = new Set<string>();
    this.exercises.forEach(e => {
      if (e.category) cats.add(e.category);
      if (e.muscleGroup) muscles.add(e.muscleGroup);
      if (e.equipment) equip.add(e.equipment);
    });
    this.categories = Array.from(cats);
    this.muscleGroups = Array.from(muscles);
    this.equipmentList = Array.from(equip);
  }

  resolveUrl(url?: string | null) {
    if (!url) return '';
    return url.startsWith('http') ? url : `https://gymunity-fp-apis.runasp.net/${url}`;
  }

  onSearch() {
    const trainerId = this.auth.getUserIdFromToken();
    if (!this.searchTerm) this.applyFilters();
    else this.svc.search(this.searchTerm, trainerId).subscribe({ next: data => { this.filteredExercises = data; }, error: err => { console.error(err); this.notify.error('Error', 'Search failed'); } });
  }

  applyFilters() {
    this.filteredExercises = this.exercises.filter(e => {
      if (this.filterCategory && e.category !== this.filterCategory) return false;
      if (this.filterMuscle && e.muscleGroup !== this.filterMuscle) return false;
      if (this.filterEquipment && e.equipment !== this.filterEquipment) return false;
      if (this.searchTerm && !e.name.toLowerCase().includes(this.searchTerm.toLowerCase())) return false;
      return true;
    });
  }

  openDetail(ex: Exercise) { this.selectedExercise = ex; }
  closeDetail() { this.selectedExercise = null; }

  addToDay(ex: Exercise) {
    console.log('Add to Day clicked for', ex);
    // Integration point: open program day selector or emit event to parent
    alert(`Added '${ex.name}' to day (stub).`);
  }

  openCreate() {
    this.isEditing = false;
    this.form = { name: '', category: '', muscleGroup: '', equipment: '', isCustom: true };
    this.thumbnailFile = null;
    this.videoFile = null;
    this.showFormModal = true;
  }

  openEdit(ex: Exercise) {
    this.isEditing = true;
    this.form = { ...ex };
    this.thumbnailFile = null;
    this.videoFile = null;
    this.showFormModal = true;
  }

  closeForm() {
    this.showFormModal = false;
  }

  onThumbnailChange(ev: any) {
    const f = ev.target.files?.[0];
    if (f) this.thumbnailFile = f;
  }

  onVideoChange(ev: any) {
    const f = ev.target.files?.[0];
    if (f) this.videoFile = f;
  }

  submitForm(ev: Event) {
    ev.preventDefault();
    // Basic validation (name, category, muscleGroup required)
    if (!this.form.name || !this.form.category || !this.form.muscleGroup) {
      this.notify.error('Validation', 'Name, Category and Muscle Group are required');
      return;
    }

    const trainerId = this.auth.getUserIdFromToken();

    // If files are present, send FormData (multipart). Otherwise send JSON payload.
    if ((this.thumbnailFile || this.videoFile)) {
      const fd = new FormData();
      fd.append('name', this.form.name || '');
      fd.append('category', this.form.category || '');
      fd.append('muscleGroup', this.form.muscleGroup || '');
      if (this.form.equipment) fd.append('equipment', this.form.equipment);
      fd.append('isCustom', String(this.form.isCustom ?? true));
      if (trainerId) fd.append('trainerId', trainerId);
      if (this.thumbnailFile) fd.append('thumbnailUrl', this.thumbnailFile, this.thumbnailFile.name);
      if (this.videoFile) fd.append('videoDemoUrl', this.videoFile, this.videoFile.name);

      if (this.isEditing && this.form.id) {
        this.svc.update(this.form.id, fd).subscribe({ next: () => { this.notify.success('Saved', 'Exercise updated'); this.loadExercises(); this.closeForm(); }, error: err => { console.error(err); this.notify.error('Error', err.message || err); } });
      } else {
        this.svc.create(fd).subscribe({ next: () => { this.notify.success('Created', 'Exercise created'); this.loadExercises(); this.closeForm(); }, error: err => { console.error(err); this.notify.error('Error', err.message || err); } });
      }
    } else {
      const payload: any = {
        name: this.form.name,
        category: this.form.category,
        muscleGroup: this.form.muscleGroup,
        equipment: this.form.equipment || null,
        isCustom: this.form.isCustom ?? true
      };
      if (trainerId) payload.trainerId = trainerId;

      if (this.isEditing && this.form.id) {
        this.svc.update(this.form.id, payload).subscribe({ next: () => { this.notify.success('Saved', 'Exercise updated'); this.loadExercises(); this.closeForm(); }, error: err => { console.error(err); this.notify.error('Error', err.message || err); } });
      } else {
        this.svc.create(payload).subscribe({ next: () => { this.notify.success('Created', 'Exercise created'); this.loadExercises(); this.closeForm(); }, error: err => { console.error(err); this.notify.error('Error', err.message || err); } });
      }
    }
  }

  deleteExercise(ex: Exercise) {
    if (!confirm(`Delete '${ex.name}'? This cannot be undone.`)) return;
    this.svc.delete(ex.id).subscribe({ next: () => { this.loadExercises(); }, error: err => console.error(err) });
  }
}

