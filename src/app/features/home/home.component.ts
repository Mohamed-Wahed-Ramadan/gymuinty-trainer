import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HomeService } from '../../core/services/home.service';
import { AuthService } from '../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  ) {}

  ngOnInit(): void {
    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isLoggedIn = isAuth;
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

    this.homeService.getPackages().subscribe({
      next: (res: any) => {
        this.packages = this.normalizeArrayResp(res);
      },
      error: () => { this.packages = []; },
      complete: () => { this.isLoading = false; }
    });

    this.homeService.getPrograms().subscribe({
      next: (res: any) => { this.programs = this.normalizeArrayResp(res); },
      error: () => { this.programs = []; }
    });

    this.homeService.getTrainers().subscribe({
      next: (res: any) => { this.trainers = this.normalizeArrayResp(res); },
      error: () => { this.trainers = []; }
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
      },
      error: () => { this.isLoading = false; }
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

  viewProgram(program: any): void {
    // navigate to program detail if route exists (placeholder)
    if (program?.id) {
      this.router.navigate(['/programs', program.id]);
    }
  }

  goToRegister(): void { this.router.navigate(['/auth/register']); }
  goToDashboard(): void { this.router.navigate(['/dashboard']); }
}

