// src/types/config.ts
import { z } from "zod";

// 基础配置Schema
const ServerConfigSchema = z.object({
    port: z.number().int().min(1024).max(65535),
    host: z.string().ip(),
    cors: z.object({
        allowedOrigins: z.array(z.string()),
        methods: z.array(z.enum(["GET", "POST", "PUT", "DELETE"]))
    }).optional()
});

const OpenAIConfigSchema = z.object({
    apiKey: z.string().min(32),
    model: z.enum(["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"]),
    temperature: z.number().min(0).max(2).default(0.7),
    maxTokens: z.number().int().min(100).max(4000),
    baseUrl: z.string().url().optional(),
    timeout: z.number().int().min(1000).default(30000),
    retries: z.number().int().min(0).max(5).default(3)
});

const SessionConfigSchema = z.object({
    timeout: z.number().int().min(60).transform(n => n * 1000), // 转换为毫秒
    maxMessages: z.number().int().min(5).max(100),
    ipCooldown: z.number().int().min(10),
    storage: z.enum(["memory", "redis", "sqlite"]),
    redis: z.object({
        host: z.string(),
        port: z.number().int()
    }).optional()
});

const RateLimitConfigSchema = z.object({
    windowMs: z.number().int().min(60000),
    max: z.number().int().min(10),
    message: z.string().optional()
});

// 主配置Schema
export const AppConfigSchema = z.object({
    env: z.enum(["development", "production", "test"]),
    server: ServerConfigSchema,
    openai: OpenAIConfigSchema,
    session: SessionConfigSchema,
    rateLimit: RateLimitConfigSchema,
    features: z.object({
        analytics: z.boolean().default(false),
        debugEndpoint: z.boolean().default(false)
    })
});

// 生成配置类型
export type ServerConfig = z.infer<typeof ServerConfigSchema>;
export type OpenAIConfig = z.infer<typeof OpenAIConfigSchema>;
export type SessionConfig = z.infer<typeof SessionConfigSchema>;
export type RateLimitConfig = z.infer<typeof RateLimitConfigSchema>;
export type AppConfig = z.infer<typeof AppConfigSchema>;

// 环境变量覆盖类型
export type EnvOverrides = Partial<{
    OPENAI_API_KEY: string;
    REDIS_HOST: string;
    REDIS_PORT: string;
}>;

// 配置文件加载器类型
export interface ConfigLoader {
    loadConfig(env?: NodeJS.ProcessEnv): Promise<AppConfig>;
    getConfig(): AppConfig;
}

// 配置更新观察者类型
export type ConfigUpdateCallback = (newConfig: AppConfig) => void;
