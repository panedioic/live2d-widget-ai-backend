// src/types/session.d.ts
export interface Session {
    sessionId: string;
    sessionId2: string;
    ip: string;
    createdAt: number;
    lastActive: number;
    messageCount: number;
}

export interface SessionManager {
    createSession(ip: string): string;
    getSession(sessionId: string): Session | null;
    updateSession(
        sessionId: string,
        updates: Partial<Pick<Session, 'lastActive' | 'messageCount'>>
    ): void;
    deleteSession(sessionId: string): void;
    isSessionValid(sessionId: string): boolean;
    resetMessageCount(sessionId: string): void;
    batchCreateSessions(ips: string[]): string[];
}
