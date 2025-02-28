declare module '@/controllers/ChatController' {
    import { Request, Response } from 'express';

    export interface ChatRequest {
        sessionId: string;
        message: string;
    }

    export interface ChatResponse {
        response: string;
        remaining: number;
    }

    export interface SessionResponse {
        sessionId: string;
        expiresAt: number;
        maxMessages: number;
    }

    export interface ErrorResponse {
        error: string;
        code: number;
        timestamp: string;
    }
}
