/**
 * Environment configuration
 * Centralizes all environment variables for type-safety
 */
export const env = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const;
