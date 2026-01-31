/**
 * Environment Configuration with Validation
 * Uses env-schema for type-safe, validated environment variables
 * GitHub: https://github.com/fastify/env-schema
 */

const envSchema = require('env-schema');
const S = require('fluent-json-schema');

const schema = S.object()
  // Server Configuration
  .prop('NODE_ENV', S.string().enum(['development', 'production', 'test']).default('development'))
  .prop('PORT', S.number().default(5000))
  .prop('HOST', S.string().default('0.0.0.0'))
  
  // Database Configuration
  .prop('MONGODB_URI', S.string().default('mongodb://localhost:27017/sharet'))
  
  // JWT Configuration
  .prop('JWT_SECRET', S.string().minLength(16).default('your-super-secret-jwt-key-change-in-production'))
  .prop('JWT_EXPIRES_IN', S.string().default('7d'))
  
  // Trello API Configuration
  .prop('TRELLO_API_KEY', S.string().default(''))
  .prop('TRELLO_API_SECRET', S.string().default(''))
  .prop('TRELLO_CALLBACK_URL', S.string().default('http://localhost:5000/api/trello/callback'))
  
  // CORS Configuration
  .prop('CORS_ORIGIN', S.string().default('http://localhost:5000'))
  .prop('FRONTEND_URL', S.string().default('http://localhost:5000'))
  
  // Session Configuration
  .prop('SESSION_SECRET', S.string().default('your-session-secret-change-in-production'))
  
  // Logging Configuration
  .prop('LOG_LEVEL', S.string().enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'))
  
  // Clustering Configuration
  .prop('WEB_CONCURRENCY', S.number().default(1))
  
  // Email Configuration (optional)
  .prop('SMTP_HOST', S.string().default(''))
  .prop('SMTP_PORT', S.number().default(587))
  .prop('SMTP_USER', S.string().default(''))
  .prop('SMTP_PASS', S.string().default(''))
  .prop('EMAIL_FROM', S.string().default('noreply@sharet.local'));

let config;

try {
  config = envSchema({
    schema,
    dotenv: false // We use --env-file flag instead
  });
} catch (error) {
  console.error('Environment validation failed:', error.message);
  console.error('Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

// Add computed properties
config.isDevelopment = config.NODE_ENV === 'development';
config.isProduction = config.NODE_ENV === 'production';
config.isTest = config.NODE_ENV === 'test';

module.exports = config;
