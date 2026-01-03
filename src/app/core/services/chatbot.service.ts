import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ChatBotRequest {
  question: string;
}

export interface ChatBotResponse {
  success: boolean;
  data: {
    question: string;
    answer: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private apiUrl = `${environment.apiUrl}/ChatBot`;

  constructor(private http: HttpClient) { }

  askQuestion(question: string): Observable<ChatBotResponse> {
    const payload: ChatBotRequest = { question };
    return this.http.post<ChatBotResponse>(`${this.apiUrl}/ask`, payload);
  }
}
