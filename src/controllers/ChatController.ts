// src/controllers/ChatController.ts
import { Request, Response } from 'express';
import { Database } from 'better-sqlite3';
import axios from 'axios';

import { SessionConfig } from '@/types/config';
import { SessionManager } from '../models/Session';
import { MessageManager } from '../models/Message';
import DatabaseSingleton from '../db';

import config from '../config';

interface Session {
    sessionId: string;
    sessionId2: string;
    ip: string;
    createdAt: number;
    lastActive: number;
    messageCount: number;
}

class ChatController {
    private static instance: ChatController;

    private db: Database;
    
    private sessionManager: SessionManager;
    private messageManager: MessageManager;
    private sessionConfig: SessionConfig;

    constructor() {
        this.db = DatabaseSingleton.getInstance();
        this.sessionConfig = config.session;
        this.sessionManager = new SessionManager(this.db, config.session);
        this.messageManager = new MessageManager(this.db, { maxMessages: this.sessionConfig.maxMessages });
    }

    /**
     * 创建新会话
     */
    async createSession(req: Request, res: Response): Promise<void> {
        try {
            const ip = this.getClientIp(req);
            const sessionId = this.sessionManager.createSession(ip);
            
            if (!sessionId) {
                return this.sendError(res, 500, 'IP cooldown period has not expired');
            }

            res.status(201).json({
                status: 200,
                message: 'ok',
                output: {
                    session_id: sessionId,
                    expiresAt: Date.now() + this.sessionConfig.timeout * 1000,
                    remaining: this.sessionConfig.maxMessages,
                }
            });
        } catch (error) {
            this.handleError(res, error, '创建会话失败');
        }
    }

    /**
     * 处理聊天消息
     */
    async handleChat(req: Request, res: Response): Promise<void> {
        const { session_id, message } = req.body;

        if (!session_id || !message) {
            return this.sendError(res, 400, '缺少必要参数');
        }

        try {
            // 验证会话有效性
            const session = this.sessionManager.getSession(session_id);
            if (!session) {
                return this.sendError(res, 404, '会话不存在或已过期');
            }

            // 检查会话限制
            const ip = this.getClientIp(req);
            if (ip === '127.0.0.1' || ip === '::1') {
                // console.log('Request from localhost, skipping session check.');
            } else {
                if (this.isSessionExpired(session) || session.messageCount >= this.sessionConfig.maxMessages) {
                    this.sessionManager.deleteSession(session_id);
                    return this.sendError(res, 403, '会话已过期或达到消息限制');
                }
            }

            // 保存用户消息
            await this.messageManager.saveMessage(session_id, {
                role: 'user',
                content: message,
                timestamp: Date.now(),
            });

            // 获取 SessionID2 
            const session_id_2 = this.sessionManager.getSession(session_id)?.sessionId2;
            // console.log(`session_id_2=${session_id_2}`);

            // 获取AI响应
            const aiResponse = await this.getAIResponse(message, session_id_2 || '');
            // console.log(`aiResponseID=${aiResponse.session_id}`);


            // 保存AI回复
            await this.messageManager.saveMessage(session_id, {
                role: 'assistant',
                content: aiResponse.text,
                timestamp: Date.now(),
            });

            // 更新会话状态
            this.sessionManager.updateSession(session_id, {
                messageCount: session.messageCount + 1,
                lastActive: Date.now(),
                sessionId2: aiResponse.session_id
            });

            res.json({
                status: 200,
                message: 'ok',
                output: {
                    text: aiResponse.text,
                    session_id: session_id,
                    session_id_2: aiResponse.session_id
                },
                remaining: this.sessionConfig.maxMessages - (session.messageCount + 1),
            });
        } catch (error) {
            this.handleError(res, error, '处理消息失败');
        }
    }

    /**
     * 调用OpenAI API获取响应
     */
    private async getAIResponse(messages: string, session_id: string): Promise<{ text: string, session_id: string }> {
        const apiKey = process.env.OPENAI_API_KEY;

        const url = config.openai.baseUrl;
        const data = {
            input: {
                prompt: messages,
                ...(session_id && { session_id: session_id }),
            },
            parameters: {},
            debug: {}
        };

        try {
            const response = await axios.post(url, data, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200) {
                // console.log(`${response.data.output.text}`);
                // console.log(`session_id=${response.data.output.session_id}`);
                return {
                    text: response.data.output.text,
                    session_id: response.data.output.session_id
                };
            } else {
                console.log(`request_id=${response.headers['request_id']}`);
                console.log(`code=${response.status}`);
                console.log(`message=${response.data.message}`);
            }
        } catch (error) {
            console.error(`Error calling DashScope: ${error}`);
        }
        return { text: '', session_id: '' };
    }

    /**
     * 检查会话是否过期
     */
    private isSessionExpired(session: Session): boolean {
        const now = Date.now();
        return (
            now - session.createdAt > this.sessionConfig.timeout * 1000 ||
            now - session.lastActive > this.sessionConfig.timeout * 1000
        );
    }

    /**
     * 获取客户端真实IP
     */
    private getClientIp(req: Request): string {
        return (req.headers['x-forwarded-for']?.toString() || req.ip) as string;
    }

    /**
     * 统一错误处理
     */
    private handleError(res: Response, error: unknown, defaultMessage: string): void {
        console.error('[ChatController]', error);

        const message = error instanceof Error
            ? error.message
            : defaultMessage;

        this.sendError(res, 500, message);
    }

    /**
     * 发送错误响应
     */
    private sendError(res: Response, code: number, message: string): void {
        res.status(code).json({
            error: message,
            code,
            timestamp: new Date().toISOString(),
        });
    }
}

export default ChatController;