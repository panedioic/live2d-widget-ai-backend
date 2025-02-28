import { Request, Response, NextFunction } from 'express';

// src/middlewares/auth.ts
export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    // Here you would normally check the username and password against your database
    // For demonstration purposes, let's assume a simple check
    if (username === 'admin' && password === 'password') {
        next();
    } else {
        return res.status(401).json({ message: 'Invalid username or password' });
    }
};
    