// src/routes/message.route.ts
import { Router } from 'express';
import { MessageManager } from '../models/Message';

export const messageRouter = (messageManager: MessageManager) => {
    const router = Router();

    // 获取分页消息记录
    router.get('/messages', async (req, res) => {
        try {
            const { page = 1, pageSize = 20, search } = req.query;

            const result = await messageManager.getAllMessages({
                page: Number(page),
                pageSize: Number(pageSize),
                search: search?.toString()
            });

            res.json({
                data: result.messages,
                total: result.total,
                page: Number(page),
                pageSize: Number(pageSize)
            });
        } catch (error) {
            res.status(500).json({ error: '获取消息失败' });
        }
    });

    return router;
};
