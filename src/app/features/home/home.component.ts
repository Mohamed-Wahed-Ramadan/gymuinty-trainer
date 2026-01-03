import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HomeService } from '../../core/services/home.service';
import { AuthService } from '../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { ProgramDetailModalComponent } from '../../shared/components/program-detail-modal/program-detail-modal.component';
import { TrainerProfileModalComponent } from '../../shared/components/trainer-profile-modal/trainer-profile-modal.component';
import { ChatbotWidgetComponent } from '../../shared/components/chatbot-widget/chatbot-widget.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, ProgramDetailModalComponent, TrainerProfileModalComponent, ChatbotWidgetComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        animate('320ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('expandCollapse', [
      transition(':enter', [
        style({ height: 0, opacity: 0 }),
        animate('300ms ease-in', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ height: 0, opacity: 0 }))
      ])
    ])
  ]
})
export class HomeComponent implements OnInit {
  term = '';
  packages: any[] = [];
  programs: any[] = [];
  trainers: any[] = [];
  isLoggedIn = false;
  isLoading = false;

  // Modal states
  showProgramModal = false;
  selectedProgramId: number | null = null;
  showTrainerModal = false;
  selectedTrainerId: number | null = null;

  // UI state
  expandedPackageId: number | null = null;

  // Program types mapping
  programTypeMap: { [key: number]: string } = {
    1: 'Workout',
    2: 'Nutrition',
    3: 'Hybrid',
    4: 'Challenge'
  };

  constructor(
    private homeService: HomeService,
    private authService: AuthService,
    private router: Router
  , private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isLoggedIn = isAuth;
      this.cdr.detectChanges();
    });

    this.loadAll();
  }

  private normalizeArrayResp(data: any): any[] {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.value)) return data.value;
    if (Array.isArray(data.result)) return data.result;
    return [];
  }

  loadAll(): void {
    this.isLoading = true;

    forkJoin({
      packages: this.homeService.getPackages(),
      programs: this.homeService.getPrograms(),
      trainers: this.homeService.getTrainers()
    }).subscribe({
      next: (results: any) => {
        this.packages = this.normalizeArrayResp(results.packages);
        this.programs = this.normalizeArrayResp(results.programs);
        this.trainers = this.normalizeArrayResp(results.trainers);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading data:', err);
        this.packages = [];
        this.programs = [];
        this.trainers = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  search(): void {
    if (!this.term) { this.loadAll(); return; }
    this.isLoading = true;
    this.homeService.searchAll(this.term).subscribe({
      next: (res: any) => {
        this.packages = this.normalizeArrayResp(res?.packages ?? res?.packages?.data ?? res);
        this.programs = this.normalizeArrayResp(res?.programs ?? []);
        this.trainers = this.normalizeArrayResp(res?.trainers ?? []);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  togglePackage(pkg: any): void {
    this.expandedPackageId = this.expandedPackageId === pkg.id ? null : pkg.id;
  }

  isPackageExpanded(pkg: any): boolean {
    return this.expandedPackageId === pkg.id;
  }

  getProgramTypeLabel(type: number): string {
    return this.programTypeMap[type] || 'Program';
  }

  // Program Modal Methods
  openProgramModal(program: any): void {
    this.selectedProgramId = program?.id || null;
    this.showProgramModal = true;
  }

  closeProgramModal(): void {
    this.showProgramModal = false;
    this.selectedProgramId = null;
  }

  viewProgram(program: any): void {
    this.openProgramModal(program);
  }

  exploreProgram(program: any): void {
    this.openProgramModal(program);
  }

  // Trainer Profile Modal Methods
  openTrainerProfile(trainer: any): void {
    this.selectedTrainerId = trainer?.id || null;
    this.showTrainerModal = true;
  }

  closeTrainerModal(): void {
    this.showTrainerModal = false;
    this.selectedTrainerId = null;
  }

  viewTrainerProfile(trainer: any): void {
    this.openTrainerProfile(trainer);
  }

  goToRegister(): void { this.router.navigate(['/auth/register']); }
  goToDashboard(): void { this.router.navigate(['/dashboard']); }
}

