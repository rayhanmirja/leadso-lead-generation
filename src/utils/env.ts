/**
 * Validates that all required environment variables are present at startup.
 * Import this in next.config.mjs or layout.tsx to fail fast.
 */

const requiredServerVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SERVICE_ROLE',
  'SSL_STORE_ID',
  'SSL_STORE_PASSWORD',
];

export function validateEnv() {
  const missing: string[] = [];
  for (const key of requiredServerVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}
