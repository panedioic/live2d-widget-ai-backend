import express from 'express';
import ChatController from './controllers/ChatController';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import config from './config';
import cors from 'cors';
import { messageRouter } from './routes/message.route';
import { chatRouter } from './routes/chat.route';
import { adminRouter } from './routes/admin.route';
import { MessageManager } from './models/Message';
import DBSingleton from './db';

const initializeApp = () => {
    const app = express();
    const db = new Database(config.database.path);
    const messageManager = new MessageManager(db, { maxMessages: config.session.maxMessages });
    const chatController = new ChatController();

    const corsOptions = {
        origin: ['https://blog.y1yan.com', 'http://127.0.0.1:5000'],
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization']
    };

    // Middleware
    app.use(cors(corsOptions));

    // Routes
    app.use('/api',
        express.json(),
        chatRouter(chatController),
        messageRouter(messageManager)
    );

    app.use('/admin', adminRouter());

    app.get('/', (req, res) => {
        res.send('Welcome to the Live2D Widget AI Backend!');
    });

    // Serve static files
    const publicPath = path.resolve(__dirname, '../public');
    app.use(express.static(publicPath));

    // Error handling
    app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
        console.error(err.stack);
        res.status(500).send('Internal Server Error');
    });

    return app;
};

const app = initializeApp();
const PORT = config.server.port;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});