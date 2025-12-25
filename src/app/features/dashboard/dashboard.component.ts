import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService, ProgramService, PackageService, Program, Package } from '../../core/services';
import { DashboardSidebarComponent } from './dashboard-sidebar/dashboard-sidebar.component';
import { ProgramsComponent } from './programs/programs.component';
import { PackagesComponent } from './packages/packages.component';
import { ProgramDetailComponent } from './program-detail/program-detail.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DashboardSidebarComponent,
    ProgramsComponent,
    PackagesComponent,
    ProgramDetailComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  activeTab: 'programs' | 'packages' = 'programs';
  programs: Program[] = [];
  packages: Package[] = [];
  isLoadingPrograms = false;
  isLoadingPackages = false;
  userId: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private programService: ProgramService,
    private packageService: PackageService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.userId = this.authService.getUserIdFromToken();
  }

  ngOnInit(): void {
    // Listen to query params to allow linking to specific tab: /dashboard?tab=packages
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const tab = params['tab'];
      if (tab === 'packages' || tab === 'programs') this.activeTab = tab;
    });
    if (!this.userId) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.loadPrograms();
    this.loadPackages();
  }

  loadPrograms(): void {
    this.isLoadingPrograms = true;
    this.programService.getMyPrograms(this.userId!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (programs) => {
          this.programs = programs;
          this.isLoadingPrograms = false;
        },
        error: (error) => {
          console.error('Failed to load programs:', error);
          this.isLoadingPrograms = false;
        }
      });
  }

  loadPackages(): void {
    this.isLoadingPackages = true;
    // Use getAllPackages() since we don't have Trainer Profile ID
    // and API returns all packages (can filter by trainer on backend)
    this.packageService.getAllPackages()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (packages) => {
          this.packages = packages;
          this.isLoadingPackages = false;
        },
        error: (error) => {
          console.error('Failed to load packages:', error);
          this.isLoadingPackages = false;
        }
      });
  }

  switchTab(tab: 'programs' | 'packages'): void {
    this.activeTab = tab;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
