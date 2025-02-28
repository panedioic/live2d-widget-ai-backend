import path from 'path';
import fs from 'fs';
import { z } from 'zod';

// 配置验证Schema
const configSchema = z.object({
    environment: z.enum(['development', 'production', 'test']),
    server: z.object({
        port: z.number().int().positive().max(65535),
        host: z.string().ip(),
        cors: z.object({
            allowedOrigins: z.array(z.string()),
            methods: z.array(z.enum(["GET", "POST", "PUT", "DELETE"]))
        }).optional()
    }),
    openai: z.object({
        apiKey: z.string().min(1),
        model: z.string().min(1),
        temperature: z.number().min(0).max(2),
        maxTokens: z.number().int().positive(),
        baseUrl: z.string().url(),
        timeout: z.number().int().min(1000).default(30000),
        retries: z.number().int().min(0).max(5).default(3)
    }),
    session: z.object({
        timeout: z.number().int().positive(),
        maxMessages: z.number().int().positive(),
        ipCooldown: z.number().int().positive(),
        storage: z.enum(["memory", "redis", "sqlite"]),
        redis: z.object({
            host: z.string(),
            port: z.number().int()
        }).optional()
    }),
    admin: z.object({
        username: z.string().min(1),
        password: z.string().min(1)
    }),
    prompt: z.object({
        system: z.string().min(1)
    }),
    database: z.object({
        path: z.string().min(1)
    })
});

// 加载配置文件
const loadConfig = () => {
    const configPath = path.join(
        process.env.CONFIG_DIR || __dirname,
        '../config.json'
    );

    try {
        const rawConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        return configSchema.parse(rawConfig);
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new Error(`配置验证失败: ${error.errors.map(e => `${e.path}: ${e.message}`).join(', ')}`);
        }
        throw new Error(`无法加载配置文件 ${configPath}: ${error}`);
    }
};

const config = loadConfig();
export default config;
