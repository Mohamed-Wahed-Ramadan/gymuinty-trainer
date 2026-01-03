import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatbotService } from '../../../core/services/chatbot.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  text: string;
  timestamp: Date;
  isLoading?: boolean;
}

@Component({
  selector: 'app-chatbot-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot-widget.component.html',
  styleUrl: './chatbot-widget.component.css'
})
export class ChatbotWidgetComponent implements OnInit, OnDestroy {
  isOpen = false;
  messages: ChatMessage[] = [];
  userInput = '';
  isLoading = false;
  private destroy$ = new Subject<void>();

  suggestedQuestions = [
    'ما هي الباكدجات المتاحة؟',
    'ما أسعار الباكدجات؟',
    'من هم المدربون؟',
    'كيف أشترك في برنامج؟'
  ];

  constructor(
    private chatbotService: ChatbotService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Initialize with a welcome message
    this.messages.push({
      id: this.generateId(),
      type: 'bot',
      text: 'أهلاً وسهلاً! 👋\n\nأنا مساعدك الافتراضي في Gymunity. يمكنك أن تسأل عن الباكدجات والأسعار والمدربين والبرامج التدريبية.\n\nكيف يمكنني مساعدتك؟',
      timestamp: new Date()
    });
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.cdr.detectChanges();
      // Focus input after opening
      setTimeout(() => {
        const input = document.querySelector('.chat-input') as HTMLInputElement;
        if (input) input.focus();
      }, 100);
    }
  }

  sendMessage(): void {
    if (!this.userInput.trim()) return;

    const userMessage: ChatMessage = {
      id: this.generateId(),
      type: 'user',
      text: this.userInput,
      timestamp: new Date()
    };

    this.messages.push(userMessage);
    const question = this.userInput;
    this.userInput = '';
    this.isLoading = true;

    // Add loading indicator
    const loadingMessage: ChatMessage = {
      id: this.generateId(),
      type: 'bot',
      text: '',
      timestamp: new Date(),
      isLoading: true
    };
    this.messages.push(loadingMessage);

    this.chatbotService.askQuestion(question)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Remove loading message
          this.messages = this.messages.filter(m => !m.isLoading);

          if (response.success && response.data?.answer) {
            const botMessage: ChatMessage = {
              id: this.generateId(),
              type: 'bot',
              text: response.data.answer,
              timestamp: new Date()
            };
            this.messages.push(botMessage);
          } else {
            const errorMessage: ChatMessage = {
              id: this.generateId(),
              type: 'bot',
              text: 'عذراً، حدث خطأ في معالجة طلبك. يرجى المحاولة مرة أخرى.',
              timestamp: new Date()
            };
            this.messages.push(errorMessage);
          }
          this.isLoading = false;
          this.scrollToBottom();
          this.cdr.detectChanges();
        },
        error: (error) => {
          // Remove loading message
          this.messages = this.messages.filter(m => !m.isLoading);

          const errorMessage: ChatMessage = {
            id: this.generateId(),
            type: 'bot',
            text: 'عذراً، حدث خطأ في الاتصال. يرجى التحقق من الاتصال بالإنترنت والمحاولة مرة أخرى.',
            timestamp: new Date()
          };
          this.messages.push(errorMessage);
          this.isLoading = false;
          this.scrollToBottom();
          this.cdr.detectChanges();
        }
      });
  }

  selectSuggestedQuestion(question: string): void {
    this.userInput = question;
    setTimeout(() => {
      this.sendMessage();
    }, 100);
  }

  clearChat(): void {
    this.messages = [{
      id: this.generateId(),
      type: 'bot',
      text: 'تم مسح المحادثة. كيف يمكنني مساعدتك؟',
      timestamp: new Date()
    }];
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const chatBody = document.querySelector('.chat-messages');
      if (chatBody) {
        chatBody.scrollTop = chatBody.scrollHeight;
      }
    }, 100);
  }

  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
