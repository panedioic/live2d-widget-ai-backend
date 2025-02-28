declare module '@/config' {
    export interface ServerConfig {
        port: number;
        host: string;
    }

    export interface OpenAIConfig {
        apiKey: string;
        model: string;
        temperature: number;
        maxTokens: number;
    }

    export interface SessionConfig {
        timeout: number;
        maxMessages: number;
        ipCooldown: number;
    }

    export interface AppConfig {
        environment: 'development' | 'production' | 'test';
        server: ServerConfig;
        openai: OpenAIConfig;
        session: SessionConfig;
    }

    const config: AppConfig;
    export default config;
}
