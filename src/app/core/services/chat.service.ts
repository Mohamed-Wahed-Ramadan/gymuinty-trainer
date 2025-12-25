import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const BASE = 'https://gymunity-fp-apis.runasp.net/api/Chat';

@Injectable({ providedIn: 'root' })
export class ChatService {
  constructor(private http: HttpClient) {}

  getThreads(): Observable<any> {
    return this.http.get<any>(`${BASE}/threads`);
  }

  getThreadMessages(threadId: number): Observable<any> {
    return this.http.get<any>(`${BASE}/threads/${threadId}/messages`);
  }

  sendMessage(threadId: number, payload: any): Observable<any> {
    return this.http.post<any>(`${BASE}/threads/${threadId}/messages`, payload);
  }

  markMessageAsRead(messageId: number): Observable<any> {
    return this.http.put<any>(`${BASE}/messages/${messageId}/read`, {});
  }

  markThreadAsRead(threadId: number): Observable<any> {
    return this.http.put<any>(`${BASE}/threads/${threadId}/read`, {});
  }
}
