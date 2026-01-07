import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrainerProfileComponent } from './trainer-profile.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, TrainerProfileComponent, TranslateModule],
  template: `
    <div class="profile">
      <h1>{{ 'profile.title' | translate }}</h1>
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
