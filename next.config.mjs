/** @type {import("next").NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["192.168.0.100"],
  serverExternalPackages: [],
  env: (() => {
    const required = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SERVICE_ROLE',
      'SSL_STORE_ID',
      'SSL_STORE_PASSWORD',
    ];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      console.warn(`[WARNING] Missing environment variables: ${missing.join(', ')}. This may cause runtime errors.`);
    }
    return {};
  })(),
};

export default nextConfig;
