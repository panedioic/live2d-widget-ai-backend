// src/types/message.d.ts
export interface Message {
    id: number;
    sessionId: string;
    role: 'system' | 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export interface MessageManager {
    saveMessage(sessionId: string, message: Omit<Message, 'id' | 'sessionId'>): number;
    getMessages(sessionId: string, options?: {
        page?: number;
        pageSize?: number;
        ascending?: boolean
    }): Message[];
    getMessageHistory(sessionId: string): Array<Pick<Message, 'role' | 'content'>>;
    countMessages(sessionId: string): number;
    deleteMessage(messageId: number): boolean;
    deleteAllMessages(sessionId: string): number;
    batchInsertMessages(messages: Array<Omit<Message, 'id'>>): number[];
    searchMessages(sessionId: string, query: string): Message[];
}
