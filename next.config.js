// Configurar timezone globalmente
process.env.TZ = 'America/Sao_Paulo'

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    unoptimized: true, // Para desenvolvimento e casos onde otimização não é necessária
  },
  experimental: {
    // Add any experimental features you need here
  },
}

module.exports = nextConfig