import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-exercise-library',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="exercise-library">
      <h1>Exercise Library</h1>
      <p>Browse and manage your exercise library.</p>
    </div>
  `,
  styles: [`
    .exercise-library {
      padding: 24px;
    }

    h1 {
      margin-bottom: 16px;
    }
  `]
})
export class ExerciseLibraryComponent {}
