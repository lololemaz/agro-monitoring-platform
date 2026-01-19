/**
 * Environment configuration
 * Centralizes all environment variables for type-safety
 */
export const env = {
  // Use relative URL - works with nginx proxy
  // Override with VITE_API_URL env var if needed
  API_URL: import.meta.env.VITE_API_URL || '/api',
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const;
