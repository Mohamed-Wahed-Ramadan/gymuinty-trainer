import { Component, OnInit, OnDestroy, OnChanges, Input, Output, EventEmitter, ChangeDetectorRef, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ChatService } from '../../../core/services/chat.service';
import { SignalRService } from '../../../core/services/signalr.service';
import { ChatThread } from '../../../core/models/chat.models';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './chat-list.component.html',
  styleUrls: ['./chat-list.component.css']
})
export class ChatListComponent implements OnInit, OnDestroy, OnChanges {
  @Input() threads: ChatThread[] = [];
  @Input() selectedThreadId: number | null = null;
  @Output() onSelectThread = new EventEmitter<ChatThread>();
  @Output() onNewChat = new EventEmitter<void>();

  filteredChats: ChatThread[] = [];
  searchQuery = '';
  onlineUsers: Set<string> = new Set();

  private destroy$ = new Subject<void>();

  constructor(
    private chatService: ChatService,
    private signalRService: SignalRService
    , private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Listen for online status updates
    this.signalRService.userOnline$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (event.isOnline) {
          this.onlineUsers.add(event.userId);
        } else {
          this.onlineUsers.delete(event.userId);
        }
        this.cdr.detectChanges();
      });

    this.filterChats();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['threads']) {
      this.filterChats();
      this.cdr.detectChanges();
    }
  }

  filterChats(): void {
    if (!this.searchQuery.trim()) {
      this.filteredChats = [...this.threads];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredChats = this.threads.filter(thread =>
        thread.otherUserName?.toLowerCase().includes(query)
      );
    }
  }

  isUserOnline(userId: string | undefined): boolean {
    return userId ? this.onlineUsers.has(userId) : false;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

    // Avatar error fallback handler
  setAvatarFallback(event: any): void {
    try { event.target.src = './avatar.png'; } catch (e) { /* ignore */ }
  }

}
