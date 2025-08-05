// Global type declarations

interface Window {
  Sentry?: {
    captureException: (error: Error | string, context?: any) => void;
    captureMessage: (message: string, level?: string) => void;
    setUser: (user: { id?: string; email?: string; username?: string }) => void;
    setContext: (key: string, context: any) => void;
  };
  AudioContext: typeof AudioContext;
  webkitAudioContext: typeof AudioContext;
}

// Extend process.env types
declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_API_URL: string;
    NEXT_PUBLIC_WS_URL: string;
    NEXT_PUBLIC_ENVIRONMENT: 'development' | 'staging' | 'production';
    NEXT_PUBLIC_AUTH_DOMAIN: string;
    NEXT_PUBLIC_AUTH_CLIENT_ID: string;
    CLEARINGHOUSE_API_KEY: string;
    CLEARINGHOUSE_API_SECRET: string;
    CLEARINGHOUSE_ENDPOINT: string;
    STRIPE_PUBLIC_KEY: string;
    STRIPE_SECRET_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
    AWS_ACCESS_KEY_ID: string;
    AWS_SECRET_ACCESS_KEY: string;
    AWS_REGION: string;
    AWS_S3_BUCKET: string;
    SENDGRID_API_KEY: string;
    EMAIL_FROM: string;
    SENTRY_DSN: string;
    DATADOG_API_KEY: string;
    GOOGLE_ANALYTICS_ID: string;
    ENABLE_TELEHEALTH: string;
    ENABLE_AI_SUGGESTIONS: string;
    ENABLE_VOICE_COMMANDS: string;
    ENABLE_MULTI_LANGUAGE: string;
    SESSION_SECRET: string;
    ENCRYPTION_KEY: string;
    JWT_SECRET: string;
    RATE_LIMIT_WINDOW: string;
    RATE_LIMIT_MAX_REQUESTS: string;
    DATABASE_URL: string;
    REDIS_URL: string;
    HIPAA_AUDIT_LOG_RETENTION_DAYS: string;
    DATA_RETENTION_POLICY_DAYS: string;
    ENABLE_AUDIT_LOGGING: string;
  }
}