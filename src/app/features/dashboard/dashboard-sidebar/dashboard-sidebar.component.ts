import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  constructor(private programService: ProgramService) {}

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
    this.programService.getProgramDetails(programId).subscribe({
      next: (program) => {
        const index = this.programs.findIndex(p => p.id === programId);
        if (index !== -1) {
          this.programs[index] = program;
        }
      },
      error: (error) => console.error('Failed to load program details:', error)
    });
  }

  selectProgram(program: Program): void {
    this.programService.setSelectedProgram(program);
  }

  switchTab(tab: 'programs' | 'packages'): void {
    this.tabChange.emit(tab);
  }
}
