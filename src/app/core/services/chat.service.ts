import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, BehaviorSubject } from 'rxjs';
import {
  ChatThread,
  ChatMessage,
  CreateThreadRequest,
  SendMessageRequest,
  ChatThreadListResponse,
  MessageListResponse,
  SingleMessageResponse,
  CreateThreadResponse,
  ApiResponse
} from '../models/chat.models';

const BASE_URL = `${environment.apiUrl}/chat`;

@Injectable({ providedIn: 'root' })
export class ChatService {
  // Track current thread for real-time updates
  private currentThreadSubject = new BehaviorSubject<number | null>(null);
  public currentThread$ = this.currentThreadSubject.asObservable();

  // Track unread count
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadInitialUnreadCount();
  }

  /**
   * 1️⃣ Create Chat Thread (إنشاء محادثة جديدة)
   */
  createThread(otherUserId: string): Observable<CreateThreadResponse> {
    const payload: CreateThreadRequest = { otherUserId };
    return this.http.post<CreateThreadResponse>(`${BASE_URL}/threads`, payload);
  }

  /**
   * 2️⃣ Get All User Chats (جلب كل المحادثات)
   */
  getAllChats(): Observable<ChatThreadListResponse> {
    return this.http.get<ChatThreadListResponse>(`${BASE_URL}/threads`);
  }

  /**
   * 3️⃣ Get Thread Messages (جلب رسائل محادثة معينة)
   */
  getThreadMessages(threadId: number): Observable<MessageListResponse> {
    return this.http.get<MessageListResponse>(`${BASE_URL}/threads/${threadId}/messages`);
  }

  /**
   * 4️⃣ Send Message (إرسال رسالة)
   */
  sendMessage(threadId: number, payload: SendMessageRequest): Observable<SingleMessageResponse> {
    return this.http.post<SingleMessageResponse>(`${BASE_URL}/threads/${threadId}/messages`, payload);
  }

  /**
   * 5️⃣ Mark Message as Read (تعليم رسالة كمقروءة)
   */
  markMessageAsRead(messageId: number): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${BASE_URL}/messages/${messageId}/read`, {});
  }

  /**
   * 6️⃣ Mark All Thread Messages as Read (تعليم كل رسائل محادثة كمقروءة)
   */
  markThreadAsRead(threadId: number): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${BASE_URL}/threads/${threadId}/read`, {});
  }

  /**
   * Set current thread for tracking
   */
  setCurrentThread(threadId: number | null): void {
    this.currentThreadSubject.next(threadId);
  }

  /**
   * Get current thread
   */
  getCurrentThread(): number | null {
    return this.currentThreadSubject.value;
  }

  /**
   * Update unread count
   */
  updateUnreadCount(count: number): void {
    this.unreadCountSubject.next(count);
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.unreadCountSubject.value;
  }

  /**
   * Load initial unread count from all threads
   */
  private loadInitialUnreadCount(): void {
    this.getAllChats().subscribe({
      next: (response) => {
        if (response.data) {
          const totalUnread = response.data.reduce((sum, thread) => sum + (thread.unreadCount || 0), 0);
          this.updateUnreadCount(totalUnread);
        }
      },
      error: (err) => console.error('Failed to load initial unread count:', err)
    });
  }
}
