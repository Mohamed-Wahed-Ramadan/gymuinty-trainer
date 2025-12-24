import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="inbox">
      <h1>Messages</h1>
      <p>Chat with your clients and manage messages.</p>
    </div>
  `,
  styles: [`
    .inbox {
      padding: 24px;
    }

    h1 {
      margin-bottom: 16px;
    }
  `]
})
export class InboxComponent {}
