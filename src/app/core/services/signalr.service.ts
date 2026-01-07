import { Injectable, NgZone } from '@angular/core';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Subject } from 'rxjs';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import {
  ChatMessage,
  TypingIndicatorEvent,
  OnlineStatusEvent,
  MessageReadEvent,
  ThreadReadEvent
} from '../models/chat.models';

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private hubConnection: HubConnection | null = null;
  private readonly hubUrl = `${environment.apiUrl.replace(/\/api\/?$/, '')}/chatHub`;

  private isConnectedSubject = new BehaviorSubject<boolean>(false);
  public isConnected$ = this.isConnectedSubject.asObservable();

  private messageReceivedSubject = new Subject<ChatMessage>();
  public messageReceived$ = this.messageReceivedSubject.asObservable();

  private userTypingSubject = new Subject<TypingIndicatorEvent>();
  public userTyping$ = this.userTypingSubject.asObservable();

  private userOnlineSubject = new Subject<OnlineStatusEvent>();
  public userOnline$ = this.userOnlineSubject.asObservable();

  private messageReadSubject = new Subject<MessageReadEvent>();
  public messageRead$ = this.messageReadSubject.asObservable();

  private threadReadSubject = new Subject<ThreadReadEvent>();
  public threadRead$ = this.threadReadSubject.asObservable();

  constructor(private zone: NgZone) {}

  /**
   * Connect to SignalR Hub
   */
  connect(token: string): Promise<void> {
    if (this.hubConnection) {
      return Promise.resolve();
    }

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(this.hubUrl, {
        accessTokenFactory: () => token // استخدام accessTokenFactory بدلاً من query string
      })
      .configureLogging(LogLevel.Warning)
      .withAutomaticReconnect()
      .build();

    this.registerHandlers();

    return this.hubConnection
      .start()
      .then(() => this.isConnectedSubject.next(true))
      .catch(err => {
        console.error('SignalR connection error:', err);
        this.isConnectedSubject.next(false);
        throw err;
      });
  }

  /**
   * Disconnect from SignalR Hub
   */
  disconnect(): Promise<void> {
    if (!this.hubConnection) {
      return Promise.resolve();
    }
    return this.hubConnection
      .stop()
      .then(() => {
        this.hubConnection = null;
        this.isConnectedSubject.next(false);
      });
  }

  /**
   * Register event handlers
   */
  private registerHandlers(): void {
    if (!this.hubConnection) {
      return;
    }

    // MessageReceived - رسالة جديدة
    this.hubConnection.on('MessageReceived', (message: ChatMessage) => {
      this.zone.run(() => this.messageReceivedSubject.next(message));
    });

    // UserOnline - مستخدم دخل أونلاين
    this.hubConnection.on('UserOnline', (event: OnlineStatusEvent) => {
      this.zone.run(() => this.userOnlineSubject.next(event));
    });

    // UserOffline - مستخدم خرج أوفلاين
    this.hubConnection.on('UserOffline', (event: OnlineStatusEvent) => {
      this.zone.run(() => this.userOnlineSubject.next(event));
    });

    // UserTyping - المستخدم بيكتب
    this.hubConnection.on('UserTyping', (event: TypingIndicatorEvent) => {
      this.zone.run(() => this.userTypingSubject.next(event));
    });

    // MessageMarkedAsRead - رسالة اتعلمت مقروءة
    this.hubConnection.on('MessageMarkedAsRead', (event: MessageReadEvent) => {
      this.zone.run(() => this.messageReadSubject.next(event));
    });

    // ThreadMarkedAsRead - محادثة اتعلمت مقروءة
    this.hubConnection.on('ThreadMarkedAsRead', (event: ThreadReadEvent) => {
      this.zone.run(() => this.threadReadSubject.next(event));
    });
  }

  /**
   * Join Thread
   */
  joinThread(threadId: number): Promise<any> | undefined {
    if (!this.hubConnection) {
      return undefined;
    }
    return this.hubConnection.invoke('JoinThread', threadId);
  }

  /**
   * Leave Thread
   */
  leaveThread(threadId: number): Promise<any> | undefined {
    if (!this.hubConnection) {
      return undefined;
    }
    return this.hubConnection.invoke('LeaveThread', threadId);
  }

  /**
   * Notify Typing
   */
  notifyTyping(threadId: number): Promise<any> | undefined {
    if (!this.hubConnection) {
      return undefined;
    }
    return this.hubConnection.invoke('UserTyping', threadId);
  }

  /**
   * Notify Stopped Typing
   */
  notifyStoppedTyping(threadId: number): Promise<any> | undefined {
    if (!this.hubConnection) {
      return undefined;
    }
    return this.hubConnection.invoke('UserStoppedTyping', threadId);
  }

  /**
   * Mark Message as Read via SignalR
   */
  markMessageAsReadSignalR(messageId: number, threadId: number): Promise<any> | undefined {
    if (!this.hubConnection) {
      return undefined;
    }
    return this.hubConnection.invoke('MarkMessageAsRead', messageId, threadId);
  }

  /**
   * Mark Thread as Read via SignalR
   */
  markThreadAsReadSignalR(threadId: number): Promise<any> | undefined {
    if (!this.hubConnection) {
      return undefined;
    }
    return this.hubConnection.invoke('MarkThreadAsRead', threadId);
  }
}

