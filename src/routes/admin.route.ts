import { Router } from 'express';
import path from 'path';
import fs from 'fs';

export const adminRouter = () => {
    const router = Router();

    router.get('/chat', (req, res) => {
        const htmlFilePath = path.resolve(__dirname, '../../public/admin/api_debugger.html');
        fs.readFile(htmlFilePath, 'utf-8', (err, data) => {
            if (err) {
                console.error(err);
                res.status(500).send('Error reading HTML file');
            } else {
                res.setHeader('Content-Type', 'text/html');
                res.send(data);
            }
        });
    });

    router.get('/messages', (req, res) => {
        res.sendFile(path.join(__dirname, 'public/admin/messages.html'))
    });

    return router;
};
