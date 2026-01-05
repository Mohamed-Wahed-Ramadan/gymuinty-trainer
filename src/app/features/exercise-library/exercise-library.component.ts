import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Exercise } from '../../core/models/exercise.models';
import { environment } from '../../../environments/environment';
import { ExerciseLibraryService } from '../../core/services/exercise-library.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-exercise-library',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './exercise-library.component.html',
  styleUrl: './exercise-library.component.css'
})
export class ExerciseLibraryComponent implements OnInit {
  exercises: Exercise[] = [];
  filteredExercises: Exercise[] = [];
  selectedExercise: Exercise | null = null;
  showFormModal = false;
  isEditing = false;
  form: any = { name: '', category: '', muscleGroup: '', equipment: '', isCustom: true, thumbnailUrl: '', videoDemoUrl: '' };

  searchTerm = '';
  filterCategory = '';
  filterMuscle = '';
  filterEquipment = '';

  categories: string[] = [];
  muscleGroups: string[] = [];
  equipmentList: string[] = [];

  constructor(
    private svc: ExerciseLibraryService,
    private auth: AuthService,
    private notify: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

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
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Failed to load exercises', err);
        this.notify.error('Error', 'Failed to load exercises');
        this.cdr.detectChanges();
      }
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
    if (url.startsWith('http')) return url;
    const base = environment.apiUrl.replace(/\/$/, '');
    return `${base}/${url.replace(/^\/+/, '')}`;
  }

  onSearch() {
    const trainerId = this.auth.getUserIdFromToken();
    if (!this.searchTerm) {
      this.applyFilters();
    } else {
      this.svc.search(this.searchTerm, trainerId).subscribe({
        next: data => {
          this.filteredExercises = data;
          this.cdr.detectChanges();
        },
        error: err => {
          console.error(err);
          this.notify.error('Error', 'Search failed');
          this.cdr.detectChanges();
        }
      });
    }
  }

  /**
   * Run the full search using current searchTerm and dropdown filters.
   * If searchTerm is provided we call the API search and then apply
   * category/muscle/equipment filters to the returned results.
   * Otherwise we simply apply the local filters to the loaded exercises.
   */
  searchAll() {
    const trainerId = this.auth.getUserIdFromToken();
    if (this.searchTerm && this.searchTerm.trim()) {
      this.svc.search(this.searchTerm.trim(), trainerId).subscribe({
        next: data => {
          // apply dropdown filters on top of search results
          let list = data || [];
          if (this.filterCategory) list = list.filter((e: any) => e.category === this.filterCategory);
          if (this.filterMuscle) list = list.filter((e: any) => e.muscleGroup === this.filterMuscle);
          if (this.filterEquipment) list = list.filter((e: any) => e.equipment === this.filterEquipment);
          this.filteredExercises = list;
          this.cdr.detectChanges();
        },
        error: err => {
          console.error(err);
          this.notify.error('Error', 'Search failed');
          this.cdr.detectChanges();
        }
      });
    } else {
      // no search term — just apply local filters
      this.applyFilters();
    }
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
    alert("Added '" + ex.name + "' to day (stub).");
  }

  openCreate() {
    this.isEditing = false;
    this.form = { name: '', category: '', muscleGroup: '', equipment: '', isCustom: true };
    this.showFormModal = true;
  }

  openEdit(ex: Exercise) {
    this.isEditing = true;
    this.form = { ...ex };
    this.showFormModal = true;
  }

  closeForm() {
    this.showFormModal = false;
  }


  submitForm(ev: Event) {
    ev.preventDefault();

    // Basic validation (name, category, muscleGroup required)
    if (!this.form.name || !this.form.category || !this.form.muscleGroup) {
      this.notify.error('Validation', 'Name, Category and Muscle Group are required');
      return;
    }

    const trainerId = this.auth.getUserIdFromToken();

    // Build JSON payload (API expects JSON). Use URLs from form if provided.
    const payload: any = {
      name: this.form.name,
      category: this.form.category,
      muscleGroup: this.form.muscleGroup,
      equipment: this.form.equipment || null,
      isCustom: this.form.isCustom ?? true
    };

    if (this.form.thumbnailUrl) { payload.thumbnailUrl = this.form.thumbnailUrl; }
    if (this.form.videoDemoUrl) { payload.videoDemoUrl = this.form.videoDemoUrl; }
    if (trainerId) { payload.trainerId = trainerId; }

    if (this.isEditing && this.form.id) {
      this.svc.update(this.form.id, payload).subscribe({
        next: () => {
          this.notify.success('Saved', 'Exercise updated');
          this.loadExercises();
          this.closeForm();
          this.cdr.detectChanges();
        },
        error: err => {
          console.error(err);
          this.notify.error('Error', err.message || err);
          this.cdr.detectChanges();
        }
      });
    } else {
      this.svc.create(payload).subscribe({
        next: () => {
          this.notify.success('Created', 'Exercise created');
          this.loadExercises();
          this.closeForm();
          this.cdr.detectChanges();
        },
        error: err => {
          console.error(err);
          this.notify.error('Error', err.message || err);
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteExercise(ex: Exercise) {
    if (!confirm(`Delete '${ex.name}'? This cannot be undone.`)) return;
    this.svc.delete(ex.id).subscribe({
      next: () => {
        this.loadExercises();
        this.cdr.detectChanges();
      },
      error: err => {
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }
}

