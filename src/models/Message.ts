// src/models/Message.ts
import { Database, Statement } from 'better-sqlite3';
import { SessionConfig } from '../types/config';

export interface Message {
    id: number;
    sessionId: string;
    role: 'system' | 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export class MessageManager {
    private db: Database;
    private config: Pick<SessionConfig, 'maxMessages'>;

    // Prepared statements
    private insertStmt!: Statement;
    private getBySessionStmt!: Statement;
    private countBySessionStmt!: Statement;
    private deleteStmt!: Statement;
    private deleteAllStmt!: Statement;

    constructor(db: Database, config: Pick<SessionConfig, 'maxMessages'>) {
        this.db = db;
        this.config = config;
        this.initializeSchema();
        this.prepareStatements();
    }

    private initializeSchema(): void {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sessionId TEXT NOT NULL,
        role TEXT CHECK(role IN ('system', 'user', 'assistant')) NOT NULL,
        content TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY(sessionId) REFERENCES sessions(sessionId) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_session_timestamp 
      ON messages(sessionId, timestamp);
    `);
    }

    private prepareStatements(): void {
        this.insertStmt = this.db.prepare(`
      INSERT INTO messages 
      (sessionId, role, content, timestamp)
      VALUES (?, ?, ?, ?)
    `);

        this.getBySessionStmt = this.db.prepare(`
      SELECT id, role, content, timestamp 
      FROM messages 
      WHERE sessionId = ?
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `);

        this.countBySessionStmt = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM messages 
      WHERE sessionId = ?
    `);

        this.deleteStmt = this.db.prepare(`
      DELETE FROM messages 
      WHERE id = ?
    `);

        this.deleteAllStmt = this.db.prepare(`
      DELETE FROM messages 
      WHERE sessionId = ?
    `);
    }

    saveMessage(sessionId: string, message: Omit<Message, 'id' | 'sessionId'>): number {
        const result = this.insertStmt.run(
            sessionId,
            message.role,
            message.content,
            message.timestamp || Date.now()
        );

        if (result.changes !== 1) {
            throw new Error('Failed to save message');
        }

        // 自动清理旧消息（保持不超过maxMessages）
        this.cleanupMessages(sessionId);

        return result.lastInsertRowid as number;
    }

    getMessages(
        sessionId: string,
        options: {
            page?: number;
            pageSize?: number;
            ascending?: boolean
        } = {}
    ): Message[] {
        const pageSize = options.pageSize || this.config.maxMessages;
        const page = options.page || 1;
        const offset = (page - 1) * pageSize;

        const order = options.ascending ? 'ASC' : 'DESC';

        return this.db.prepare(`
      SELECT * FROM messages 
      WHERE sessionId = ?
      ORDER BY timestamp ${order}
      LIMIT ? OFFSET ?
    `).all(sessionId, pageSize, offset) as Message[];
    }

    getMessageHistory(sessionId: string): Array<Pick<Message, 'role' | 'content'>> {
        return this.db.prepare(`
      SELECT role, content 
      FROM messages 
      WHERE sessionId = ?
      ORDER BY timestamp ASC
    `).all(sessionId) as Array<Pick<Message, 'role' | 'content'>>;
    }

    countMessages(sessionId: string): number {
        const result = this.countBySessionStmt.get(sessionId) as { count: number };
        return result?.count || 0;
    }

    deleteMessage(messageId: number): boolean {
        const result = this.deleteStmt.run(messageId);
        return result.changes === 1;
    }

    deleteAllMessages(sessionId: string): number {
        const result = this.deleteAllStmt.run(sessionId);
        return result.changes;
    }

    private cleanupMessages(sessionId: string): void {
        const currentCount = this.countMessages(sessionId);
        if (currentCount > this.config.maxMessages) {
            const excess = currentCount - this.config.maxMessages;
            this.db.prepare(`
        DELETE FROM messages 
        WHERE id IN (
          SELECT id 
          FROM messages 
          WHERE sessionId = ? 
          ORDER BY timestamp ASC 
          LIMIT ?
        )
      `).run(sessionId, excess);
        }
    }

    // 批量插入事务示例
    batchInsertMessages(messages: Array<Omit<Message, 'id'>>): number[] {
        const insert = this.db.prepare(`
      INSERT INTO messages 
      (sessionId, role, content, timestamp)
      VALUES (?, ?, ?, ?)
    `);

        const transaction = this.db.transaction((msgs: Array<Omit<Message, 'id'>>) => {
            return msgs.map(msg => {
                const result = insert.run(
                    msg.sessionId,
                    msg.role,
                    msg.content,
                    msg.timestamp
                );
                return result.lastInsertRowid as number;
            });
        });

        return transaction(messages);
    }

    // 全文搜索（需要启用SQLite FTS扩展）
    searchMessages(sessionId: string, query: string): Message[] {
        return this.db.prepare(`
      SELECT * 
      FROM messages 
      WHERE sessionId = ? 
      AND content LIKE ?
      ORDER BY timestamp DESC
    `).all(sessionId, `%${query}%`) as Message[];
    }
    async getAllMessages(options: {
        page: number;
        pageSize: number;
        search?: string;
    }): Promise<{ messages: Message[]; total: number }> {
        const offset = (options.page - 1) * options.pageSize;
        let query = this.db.prepare(`
      SELECT * FROM messages
      ${options.search ? 'WHERE content LIKE ?' : ''}
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `);

        let countQuery = this.db.prepare(`
      SELECT COUNT(*) as total FROM messages
      ${options.search ? 'WHERE content LIKE ?' : ''}
    `);

        const searchParam = options.search ? `%${options.search}%` : null;

        const messages = query.all(
            ...(searchParam ? [searchParam] : []),
            options.pageSize,
            offset
        ) as Message[];

        const totalResult = countQuery.get(
            ...(searchParam ? [searchParam] : [])
        ) as { total: number };

        return {
            messages,
            total: totalResult.total
        };
    }
}
