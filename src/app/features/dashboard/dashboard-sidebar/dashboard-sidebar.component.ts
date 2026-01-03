import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Program, ProgramService } from '../../../core/services';

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-sidebar.component.html',
  styleUrls: ['./dashboard-sidebar.component.css']
})
export class DashboardSidebarComponent implements OnInit {
  @Input() programs: Program[] = [];
  @Output() tabChange = new EventEmitter<'programs' | 'packages'>();

  expandedProgram: number | null = null;
  expandedWeek: number | null = null;
  settingsMenuOpen = false;

  constructor(private programService: ProgramService, private cdr: ChangeDetectorRef, private router: Router) {}

  ngOnInit(): void {}

  toggleProgram(programId: number | undefined): void {
    if (!programId) return;
    
    if (this.expandedProgram === programId) {
      this.expandedProgram = null;
    } else {
      this.expandedProgram = programId;
      // Load program details if not already loaded
      if (!this.programs.find(p => p.id === programId)?.weeks) {
        this.loadProgramDetails(programId);
      }
    }
  }

  toggleWeek(weekId: number | undefined): void {
    if (!weekId) return;
    this.expandedWeek = this.expandedWeek === weekId ? null : weekId;
  }

  loadProgramDetails(programId: number): void {
    const index = this.programs.findIndex(p => p.id === programId);
    if (index === -1) return;
    // mark as loading (weeks undefined) so template shows loading state
    this.programs[index].weeks = undefined as any;

    // First load weeks for the program, then for each week load its days.
    this.programService.getWeeksByProgram(programId).subscribe({
      next: (weeks) => {
        this.programs[index].weeks = weeks || [];
        this.cdr.detectChanges();
        // load days for each week (parallel requests)
        this.programs[index].weeks.forEach((w, wi) => {
          if (w && w.id) {
            this.programService.getDaysByWeek(w.id).subscribe({
              next: (days) => {
                this.programs[index].weeks![wi].days = days || [];
                this.cdr.detectChanges();
                // For each day, fetch its exercises so sidebar can show counts
                (this.programs[index].weeks![wi].days || []).forEach((d, di) => {
                  if (d && d.id) {
                    this.programService.getExercisesByDay(d.id).subscribe({
                      next: (exs) => { this.programs[index].weeks![wi].days![di].exercises = exs || []; this.cdr.detectChanges(); },
                      error: (err) => { console.error('Failed to load exercises for day', d.id, err); this.programs[index].weeks![wi].days![di].exercises = []; this.cdr.detectChanges(); }
                    });
                  } else {
                    this.programs[index].weeks![wi].days![di].exercises = [];
                  }
                });
              },
              error: (err) => { console.error('Failed to load days for week', w.id, err); this.cdr.detectChanges(); }
            });
          } else {
            this.programs[index].weeks![wi].days = [];
          }
        });
      },
      error: (error) => { console.error('Failed to load program weeks:', error); this.cdr.detectChanges(); }
    });
  }

  selectProgram(program: Program): void {
    this.programService.setSelectedProgram(program);
  }

  switchTab(tab: 'programs' | 'packages'): void {
    this.tabChange.emit(tab);
  }

  toggleSettingsMenu(): void {
    this.settingsMenuOpen = !this.settingsMenuOpen;
  }

  navigateToSettings(tab: 'update-profile' | 'change-password' | 'reset-password' | 'delete-profile'): void {
    this.settingsMenuOpen = false;
    this.router.navigate(['/dashboard/settings'], { 
      queryParams: { tab } 
    });
  }
}
