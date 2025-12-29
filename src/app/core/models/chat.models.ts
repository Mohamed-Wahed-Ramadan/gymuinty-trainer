/**
 * Chat & Messaging Models
 * Interfaces for Chat, Messages, and Threads
 */

// Message Types Enum
export enum MessageType {
  Text = 1,
  Voice = 2,
  Video = 3,
  FormCheck = 4  // صورة تمرين للتقييم
}

// Chat Thread
export interface ChatThread {
  id: number;
  clientId: string;
  trainerId: string;
  createdAt: string;
  lastMessageAt: string;
  isPriority?: boolean;
  otherUserId?: string;
  otherUserName?: string;
  otherUserProfilePhoto?: string;
  unreadCount: number;
}

// Create Thread Request
export interface CreateThreadRequest {
  otherUserId: string;
}

// Chat Message
export interface ChatMessage {
  id: number;
  threadId: number;
  senderId: string;
  senderName: string;
  senderProfilePhoto: string;
  content: string;
  mediaUrl: string | null;
  type: MessageType;
  createdAt: string;
  isRead: boolean;
}

// Send Message Request
export interface SendMessageRequest {
  content: string;
  mediaUrl: string | null;
  type: MessageType;
}

// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  statusCode?: number;
}

// Chat Thread List Response
export interface ChatThreadListResponse extends ApiResponse<ChatThread[]> {}

// Messages List Response
export interface MessageListResponse extends ApiResponse<ChatMessage[]> {}

// Single Message Response
export interface SingleMessageResponse extends ApiResponse<ChatMessage> {}

// Create Thread Response
export interface CreateThreadResponse extends ApiResponse<ChatThread> {}

// Typing Indicator Event
export interface TypingIndicatorEvent {
  userId: string;
  userName: string;
  threadId: number;
}

// Online Status Event
export interface OnlineStatusEvent {
  userId: string;
  isOnline: boolean;
}

// Message Read Event
export interface MessageReadEvent {
  messageId: number;
  threadId: number;
}

// Thread Read Event
export interface ThreadReadEvent {
  threadId: number;
}
