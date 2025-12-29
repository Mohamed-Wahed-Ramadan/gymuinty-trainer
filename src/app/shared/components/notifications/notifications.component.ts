import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount = 0;
  showDropdown = false;
  private destroy$ = new Subject<void>();

  constructor(private notificationService: NotificationService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.notificationService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        this.notifications = notifications;
        this.cdr.detectChanges();
      });

    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadCount = count;
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  closeDropdown(): void {
    this.showDropdown = false;
  }

  markAsRead(notificationId: string): void {
    this.notificationService.markAsRead(notificationId);
  }

  removeNotification(notificationId: string): void {
    this.notificationService.removeNotification(notificationId);
  }

  clearAll(): void {
    this.notificationService.clearAll();
  }

  getNotificationIcon(type: string): string {
    const icons: { [key: string]: string } = {
      success: 'bi-check-circle',
      error: 'bi-exclamation-circle',
      warning: 'bi-exclamation-triangle',
      info: 'bi-info-circle'
    };
    return icons[type] || 'bi-bell';
  }
}
