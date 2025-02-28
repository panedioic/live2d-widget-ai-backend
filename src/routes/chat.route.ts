import { Router } from 'express';
import ChatController from '../controllers/ChatController';

export const chatRouter = (controller: ChatController) => {
    const router = Router();

    // 会话管理
    router.post('/create_session', (req, res) => controller.createSession(req, res));

    // 消息处理
    router.post('/chat', (req, res) => controller.handleChat(req, res));

    return router;
};
