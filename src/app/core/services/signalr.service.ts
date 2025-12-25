import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private hubConnection: HubConnection | null = null;
  private readonly hubUrl = 'https://gymunity-fp-apis.runasp.net/hubs/chat';

  private isConnectedSubject = new BehaviorSubject<boolean>(false);
  public isConnected$ = this.isConnectedSubject.asObservable();

  private messageReceivedSubject = new BehaviorSubject<any | null>(null);
  public messageReceived$ = this.messageReceivedSubject.asObservable();

  private threadEventSubject = new BehaviorSubject<any | null>(null);
  public threadEvents$ = this.threadEventSubject.asObservable();

  constructor(private zone: NgZone) {}

  connect(token: string): Promise<void> {
    if (this.hubConnection) return Promise.resolve();

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`${this.hubUrl}?access_token=${encodeURIComponent(token)}`)
      .configureLogging(LogLevel.Warning)
      .withAutomaticReconnect()
      .build();

    this.registerHandlers();

    return this.hubConnection.start()
      .then(() => this.isConnectedSubject.next(true))
      .catch(err => {
        console.error('SignalR connection error:', err);
        this.isConnectedSubject.next(false);
        throw err;
      });
  }

  disconnect(): Promise<void> {
    if (!this.hubConnection) return Promise.resolve();
    return this.hubConnection.stop().then(() => {
      this.hubConnection = null;
      this.isConnectedSubject.next(false);
    });
  }

  private registerHandlers() {
    if (!this.hubConnection) return;

    this.hubConnection.on('MessageReceived', (message: any) => {
      this.zone.run(() => this.messageReceivedSubject.next(message));
    });

    this.hubConnection.on('UserJoinedThread', (ev: any) => {
      this.zone.run(() => this.threadEventSubject.next({ type: 'UserJoinedThread', payload: ev }));
    });

    this.hubConnection.on('UserLeftThread', (ev: any) => {
      this.zone.run(() => this.threadEventSubject.next({ type: 'UserLeftThread', payload: ev }));
    });

    this.hubConnection.on('UserTyping', (ev: any) => {
      this.zone.run(() => this.threadEventSubject.next({ type: 'UserTyping', payload: ev }));
    });

    this.hubConnection.on('UserStoppedTyping', (ev: any) => {
      this.zone.run(() => this.threadEventSubject.next({ type: 'UserStoppedTyping', payload: ev }));
    });

    this.hubConnection.on('MessageMarkedAsRead', (ev: any) => {
      this.zone.run(() => this.threadEventSubject.next({ type: 'MessageMarkedAsRead', payload: ev }));
    });

    this.hubConnection.on('ThreadMarkedAsRead', (ev: any) => {
      this.zone.run(() => this.threadEventSubject.next({ type: 'ThreadMarkedAsRead', payload: ev }));
    });
  }

  // Methods that invoke server methods
  joinThread(threadId: number) {
    return this.hubConnection?.invoke('JoinThread', threadId);
  }

  leaveThread(threadId: number) {
    return this.hubConnection?.invoke('LeaveThread', threadId);
  }

  sendMessage(threadId: number, messageRequest: any) {
    return this.hubConnection?.invoke('SendMessage', threadId, messageRequest);
  }

  userTyping(threadId: number) {
    return this.hubConnection?.invoke('UserTyping', threadId);
  }

  userStoppedTyping(threadId: number) {
    return this.hubConnection?.invoke('UserStoppedTyping', threadId);
  }

  markMessageAsRead(messageId: number, threadId: number) {
    return this.hubConnection?.invoke('MarkMessageAsRead', messageId, threadId);
  }

  markThreadAsRead(threadId: number) {
    return this.hubConnection?.invoke('MarkThreadAsRead', threadId);
  }
}

