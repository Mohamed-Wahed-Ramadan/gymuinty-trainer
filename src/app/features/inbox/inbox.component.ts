import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../core/services/chat.service';
import { environment } from '../../../environments/environment';
import { SignalRService } from '../../core/services/signalr.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="inbox container-fluid p-3">
      <div class="row">
        <div class="col-md-4 mb-3">
          <div class="card">
            <div class="card-header">All Conversations</div>
            <div class="list-group list-group-flush" style="max-height:600px; overflow:auto">
              <a *ngFor="let t of threads" (click)="openThread(t)" [class.active]="t.id===activeThreadId" class="list-group-item list-group-item-action d-flex align-items-center">
                <img [src]="resolveProfile(t.otherUserProfilePhoto)" width="40" height="40" class="rounded-circle me-2" />
                <div class="flex-grow-1">
                  <div class="fw-bold">{{ t.otherUserName }}</div>
                  <div class="text-muted small">{{ t.lastMessageAt | date:'short' }}</div>
                </div>
                <span *ngIf="t.unreadCount>0" class="badge bg-danger rounded-pill">{{ t.unreadCount }}</span>
              </a>
            </div>
          </div>
        </div>

        <div class="col-md-8">
          <div *ngIf="!activeThreadId" class="alert alert-secondary">Select a conversation to view messages</div>
          <div *ngIf="activeThreadId">
            <div class="card">
              <div class="card-header">
                <h5 class="mb-0">{{ activeThread?.otherUserName }}</h5>
              </div>
              <div class="card-body" style="height:400px; overflow:auto">
                <div *ngFor="let m of messages" class="mb-3">
                  <div><strong>{{ m.senderName }}</strong></div>
                  <div>{{ m.content }}</div>
                  <small class="text-muted">{{ m.createdAt | date:'short' }}</small>
                </div>
              </div>
              <div class="card-footer">
                <div *ngIf="typingIndicator" class="text-muted small mb-2">{{ typingIndicator }}</div>
                <div class="input-group">
                  <input class="form-control" [(ngModel)]="outgoingMessage" (input)="notifyTyping()" placeholder="Type a message..." />
                  <button class="btn btn-primary" (click)="sendMessage()">Send</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .active { background:#f8f9fa }
  `]
})
export class InboxComponent implements OnInit {
  threads: any[] = [];
  messages: any[] = [];
  activeThreadId: number | null = null;
  activeThread: any = null;
  outgoingMessage = '';
  typingIndicator: string | null = null;

  private userToken = ''; // populated from AuthService

  constructor(private chatSvc: ChatService, private srvc: SignalRService, private auth: AuthService) {}

  ngOnInit(): void {
    this.loadThreads();
    // Initialize token from AuthService
    this.userToken = this.auth.getToken() || '';
    this.auth.currentUser$.subscribe(user => {
      const token = this.auth.getToken() || '';
      if (token && !this.userToken) {
        this.userToken = token;
        this.srvc.connect(this.userToken).catch(err => console.error('SignalR connect failed', err));
        this.srvc.messageReceived$.subscribe(msg => { if (msg) this.onMessageReceived(msg); });
        this.srvc.threadEvents$.subscribe(ev => this.onThreadEvent(ev));
      } else if (!token && this.userToken) {
        this.userToken = '';
        this.srvc.disconnect().catch(() => {});
      }
    });
    // If token already present, connect now
    if (this.userToken) {
      this.srvc.connect(this.userToken).catch(err => console.error('SignalR connect failed', err));
      this.srvc.messageReceived$.subscribe(msg => { if (msg) this.onMessageReceived(msg); });
      this.srvc.threadEvents$.subscribe(ev => this.onThreadEvent(ev));
    }
  }

  resolveProfile(url: string | null) {
    if (!url) return 'https://via.placeholder.com/40?text=U';
    if (url.startsWith('http')) return url;
    const base = environment.apiUrl.replace(/\/$/, '');
    return `${base}/${url.replace(/^\/+/, '')}`;
  }

  loadThreads() {
    this.chatSvc.getThreads().subscribe({ next: res => { if (res && res.data) this.threads = res.data; else this.threads = res || []; }, error: err => console.error(err) });
  }

  openThread(thread: any) {
    this.activeThreadId = thread.id;
    this.activeThread = thread;
    this.messages = [];
    this.chatSvc.getThreadMessages(thread.id).subscribe({ next: res => { this.messages = res.data || []; this.markThreadRead(thread.id); }, error: err => console.error(err) });
    if (this.userToken) {
      const tid = Number(thread.id);
      const p = this.srvc.joinThread(tid as number);
      if (p) p.catch(() => {});
    }
  }

  sendMessage() {
    if (!this.outgoingMessage || !this.activeThreadId) return;
    const payload = { content: this.outgoingMessage, mediaUrl: null, type: 1 };
    this.chatSvc.sendMessage(this.activeThreadId, payload).subscribe({ next: msg => { this.messages.push(msg); this.outgoingMessage = ''; }, error: err => console.error(err) });
    if (this.userToken) {
      const p = this.srvc.sendMessage(this.activeThreadId, payload);
      if (p) p.catch(() => {});
    }
  }

  notifyTyping() {
    if (!this.activeThreadId || !this.userToken) return;
    const p = this.srvc.userTyping(this.activeThreadId);
    if (p) p.catch(() => {});
    // Simple local typing indicator timeout
    this.typingIndicator = 'You are typing...';
    setTimeout(() => this.typingIndicator = null, 1500);
  }

  markThreadRead(threadId: number) {
    this.chatSvc.markThreadAsRead(threadId).subscribe({ next: () => this.loadThreads(), error: () => {} });
    if (this.userToken) {
      const p = this.srvc.markThreadAsRead(threadId);
      if (p) p.catch(() => {});
    }
  }

  private onMessageReceived(msg: any) {
    // If message belongs to active thread, append
    if (this.activeThreadId && msg.threadId === this.activeThreadId) {
      this.messages.push(msg);
      this.markThreadRead(this.activeThreadId);
    } else {
      // Otherwise refresh threads to show unread
      this.loadThreads();
    }
  }

  private onThreadEvent(ev: any) {
    // Handle typing / join / leave events
    if (!ev) return;
    if (ev.type === 'UserTyping' && ev.payload?.threadId === this.activeThreadId) {
      this.typingIndicator = `${ev.payload.userName || 'User'} is typing...`;
      setTimeout(() => this.typingIndicator = null, 2000);
    }
  }
}

