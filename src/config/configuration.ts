export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    whisperModel: process.env.OPENAI_MODEL_WHISPER || 'whisper-1',
    gptModel: process.env.OPENAI_MODEL_GPT || 'gpt-4o-mini-2024-07-18',
  },

  storage: {
    type: process.env.STORAGE_TYPE || 'local',
    path: process.env.STORAGE_PATH || './uploads',
    s3: {
      bucket: process.env.S3_BUCKET,
      region: process.env.S3_REGION,
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  },

  voice: {
    maxAudioFileSizeMB: parseInt(process.env.MAX_AUDIO_FILE_SIZE_MB || '10', 10),
    maxAudioDurationSec: parseInt(process.env.MAX_AUDIO_DURATION_SEC || '60', 10),
  },

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },

  telegram: {
    enabled: process.env.TELEGRAM_ENABLED,
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL,
  },
});
