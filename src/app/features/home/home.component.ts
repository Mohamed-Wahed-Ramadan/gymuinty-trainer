import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeService } from '../../core/services/home.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="home p-3">
      <div class="mb-3">
        <input class="form-control" placeholder="Search" [(ngModel)]="term" />
        <button class="btn btn-sm btn-primary mt-2" (click)="search()">Search</button>
      </div>

      <section class="mb-4">
        <h3>Packages</h3>
        <div class="row">
          <div class="col-12 col-sm-6 col-md-4" *ngFor="let p of packages">
            <div class="card mb-3">
              <img *ngIf="p.thumbnailUrl" [src]="p.thumbnailUrl" class="card-img-top" />
              <div class="card-body">
                <h5 class="card-title">{{ p.name }}</h5>
                <p class="card-text">{{ p.description }}</p>
                <p class="card-text">{{ p.priceMonthly | currency }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="mb-4">
        <h3>Programs</h3>
        <div class="row">
          <div class="col-12 col-sm-6 col-md-4" *ngFor="let pr of programs">
            <div class="card mb-3">
              <img *ngIf="pr.thumbnailUrl" [src]="pr.thumbnailUrl" class="card-img-top" />
              <div class="card-body">
                <h5 class="card-title">{{ pr.title }}</h5>
                <p class="card-text">{{ pr.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3>Trainers</h3>
        <div class="row">
          <div class="col-12 col-sm-6 col-md-4" *ngFor="let t of trainers">
            <div class="card mb-3">
              <div class="card-body">
                <h5 class="card-title">{{ t.userName || t.userName }}</h5>
                <p class="card-text">{{ t.bio }}</p>
                <p class="card-text">Rating: {{ t.ratingAverage }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [``]
})
export class HomeComponent implements OnInit {
  term = '';
  packages: any[] = [];
  programs: any[] = [];
  trainers: any[] = [];

  constructor(private home: HomeService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.home.getPackages().subscribe(p => this.packages = p || []);
    this.home.getPrograms().subscribe(p => this.programs = p || []);
    this.home.getTrainers().subscribe(t => this.trainers = t || []);
  }

  search(): void {
    if (!this.term) { this.loadAll(); return; }
    this.home.searchAll(this.term).subscribe(res => {
      this.packages = res.packages || [];
      this.programs = res.programs || [];
      this.trainers = res.trainers || [];
    });
  }
}
