import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrainerProfileComponent } from './trainer-profile.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, TrainerProfileComponent],
  template: `
    <div class="profile">
      <h1>Profile</h1>
      <app-trainer-profile></app-trainer-profile>
    </div>
  `,
  styles: [`
    .profile {
      padding: 24px;
    }

    h1 {
      margin-bottom: 16px;
    }
  `]
})
export class ProfileComponent {}
