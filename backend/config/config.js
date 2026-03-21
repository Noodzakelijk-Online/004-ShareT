/**
 * Application Configuration
 * Centralizes all environment variables and configuration settings
 */

require('dotenv').config();

module.exports = {
  // Server Configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/sharet',
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'sharet-jwt-secret-change-in-production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'sharet-refresh-secret-change-in-production',
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '30d',
  
  // Session Configuration
  SESSION_SECRET: process.env.SESSION_SECRET || 'sharet-session-secret-change-in-production',
  
  // Frontend Configuration
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // Trello API Configuration
  TRELLO_API_KEY: process.env.TRELLO_API_KEY,
  TRELLO_API_SECRET: process.env.TRELLO_API_SECRET,
  TRELLO_CALLBACK_URL: process.env.TRELLO_CALLBACK_URL || 'http://localhost:5000/api/trello/callback',
  
  // GitHub API Configuration
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  GITHUB_REPO_OWNER: process.env.GITHUB_REPO_OWNER,
  GITHUB_REPO_NAME: process.env.GITHUB_REPO_NAME || '004-ShareT',
  
  // Email Configuration (for notifications and verification)
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT || 587,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@sharet.com',
  
  // Stripe Configuration (for payments)
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  
  // Resource Pricing Configuration
  PRICING_MULTIPLIER: parseFloat(process.env.PRICING_MULTIPLIER) || 2,
  
  // Security Configuration
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 10,
  MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
  LOCK_TIME: parseInt(process.env.LOCK_TIME) || 2 * 60 * 60 * 1000, // 2 hours
  
  // File Upload Configuration
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  
  // Rate Limiting (disabled per user preference, but kept for future)
  RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED === 'true' || false,
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  
  // Logging Configuration
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE || 'logs/app.log',
  
  // CORS Configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  
  // Share Link Configuration
  SHARE_LINK_BASE_URL: process.env.SHARE_LINK_BASE_URL || 'http://localhost:5173/shared',
  DEFAULT_SHARE_EXPIRATION: parseInt(process.env.DEFAULT_SHARE_EXPIRATION) || 0, // 0 = indefinite
};

