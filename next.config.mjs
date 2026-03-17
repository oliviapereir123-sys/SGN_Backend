/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    turbo: undefined,
  },

  /**
   * Proxy reverso — elimina CORS completamente.
   * O Next.js (porta 3000) faz proxy para o PHP (porta 80)
   * em nome do browser, sem nunca expor cross-origin ao cliente.
   *
   * Configurar no .env.local:
   *   NEXT_PUBLIC_API_URL=/sgn-api
   *   PHP_API_URL=http://localhost/sgn/backend/api
   */
  async rewrites() {
    const phpBase = process.env.PHP_API_URL || "http://localhost/sgn/backend/api"
    return [
      {
        source: "/sgn-api/:path*",
        destination: `${phpBase}/:path*`,
      },
    ]
  },
}

export default nextConfig
