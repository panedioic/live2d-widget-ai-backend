// src/models/Session.ts
import { Database, Statement } from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { SessionConfig } from '../types/config';

export interface Session {
    sessionId: string;
    sessionId2: string;
    ip: string;
    createdAt: number;
    lastActive: number;
    messageCount: number;
}

export class SessionManager {
    private db: Database;
    private config: SessionConfig;

    // Prepared statements
    private createStmt!: Statement;
    private getStmt!: Statement;
    private updateStmt!: Statement;
    private deleteStmt!: Statement;
    private cleanupStmt!: Statement;
    private updateSessionId2Stmt!: Statement;

    constructor(db: Database, config: SessionConfig) {
        this.db = db;
        this.config = config;
        this.initializeSchema();
        this.prepareStatements();
        this.setupCleanupJob();
    }

    private initializeSchema(): void {
        this.db.exec(`
          CREATE TABLE IF NOT EXISTS sessions (
        sessionId TEXT PRIMARY KEY,
        sessionId2 TEXT DEFAULT '',
        ip TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        lastActive INTEGER NOT NULL,
        messageCount INTEGER DEFAULT 0
          );
          
          CREATE INDEX IF NOT EXISTS idx_last_active 
          ON sessions(lastActive);
        `);
    }

    private prepareStatements(): void {
        this.createStmt = this.db.prepare(`
      INSERT INTO sessions 
      (sessionId, ip, createdAt, lastActive, messageCount)
      VALUES (?, ?, ?, ?, ?)
    `);

        this.updateSessionId2Stmt = this.db.prepare(`
      UPDATE sessions
      SET sessionId2 = ?
      WHERE sessionId = ?
    `);

        this.getStmt = this.db.prepare(`
      SELECT * FROM sessions WHERE sessionId = ?
    `);

        this.updateStmt = this.db.prepare(`
      UPDATE sessions
      SET lastActive = ?, messageCount = ?, sessionId2 = ?
      WHERE sessionId = ?
    `);

        this.deleteStmt = this.db.prepare(`
      DELETE FROM sessions WHERE sessionId = ?
    `);

        this.cleanupStmt = this.db.prepare(`
      DELETE FROM sessions 
      WHERE lastActive < ? 
        OR messageCount >= ?
    `);
    }

    createSession(ip: string): string {

        if (ip !== '127.0.0.1' && ip !== '::1') {
            const lastSession = this.db.prepare(`
            SELECT * FROM sessions 
            WHERE ip = ? 
            ORDER BY createdAt DESC 
            LIMIT 1
            `).get(ip) as Session | undefined;

            if (lastSession) {
                const now = Date.now();
                const cooldownPeriod = this.config.ipCooldown * 1000;
                if (now - lastSession.createdAt < cooldownPeriod) {
                    return '';
                }
            }
        }

        const sessionId = uuidv4();
        const now = Date.now();

        this.createStmt.run(
            sessionId,
            ip,
            now,
            now,
            0  // Initial message count
        );

        return sessionId;
    }

    getSession(sessionId: string): Session | null {
        const result = this.getStmt.get(sessionId) as Session | undefined;
        return result ?? null;
    }

    updateSession(
        sessionId: string,
        updates: Partial<Pick<Session, 'lastActive' | 'messageCount' | 'sessionId2'>>
    ): void {
        const session = this.getSession(sessionId);
        if (!session) throw new Error('Session not found');

        this.updateStmt.run(
            updates.lastActive ?? session.lastActive,
            updates.messageCount ?? session.messageCount,
            updates.sessionId2 ?? session.sessionId2,
            sessionId
        );
    }

    deleteSession(sessionId: string): void {
        this.deleteStmt.run(sessionId);
    }

    isSessionValid(sessionId: string): boolean {
        const session = this.getSession(sessionId);
        if (!session) return false;

        const now = Date.now();
        return (
            now - session.createdAt < this.config.timeout * 1000 &&
            now - session.lastActive < this.config.timeout * 1000 &&
            session.messageCount < this.config.maxMessages
        );
    }

    private setupCleanupJob(): void {
        setInterval(() => {
            const cutoff = Date.now() - this.config.timeout * 1000;
            try {
                this.cleanupStmt.run(
                    cutoff,
                    this.config.maxMessages
                );
            } catch (error) {
                console.error('Session cleanup failed:', error);
            }
        }, 300_000); // 默认5分钟
    }

    // 事务示例：重置会话计数器
    resetMessageCount(sessionId: string): void {
        const transaction = this.db.transaction(() => {
            this.updateStmt.run(Date.now(), 0, sessionId);
        });

        try {
            transaction();
        } catch (error) {
            throw new Error(`Failed to reset session: ${error}`);
        }
    }

    // 批量操作示例
    batchCreateSessions(ips: string[]): string[] {
        const insert = this.db.prepare(`
      INSERT INTO sessions 
      (sessionId, ip, createdAt, lastActive, messageCount)
      VALUES (?, ?, ?, ?, ?)
    `);

        const transaction = this.db.transaction((ips: string[]) => {
            return ips.map(ip => {
                const sessionId = uuidv4();
                const now = Date.now();
                insert.run(sessionId, ip, now, now, 0);
                return sessionId;
            });
        });

        return transaction(ips);
    }
}
