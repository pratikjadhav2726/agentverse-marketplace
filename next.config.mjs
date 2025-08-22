/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'standalone',
  async rewrites() {
    return [
      // Route to Python microservices
      {
        source: '/api/workflows/:path*',
        destination: `${process.env.WORKFLOW_ENGINE_URL || 'http://localhost:8001'}/:path*`,
      },
      {
        source: '/api/agents/runtime/:path*',
        destination: `${process.env.AGENT_RUNTIME_URL || 'http://localhost:8002'}/:path*`,
      },
      {
        source: '/api/mcp/:path*',
        destination: `${process.env.MCP_SERVER_URL || 'http://localhost:8003'}/:path*`,
      },
      {
        source: '/api/a2a/:path*',
        destination: `${process.env.A2A_SERVICE_URL || 'http://localhost:8004'}/:path*`,
      },
      {
        source: '/api/ai/:path*',
        destination: `${process.env.AI_ORCHESTRATOR_URL || 'http://localhost:8005'}/:path*`,
      },
    ]
  },
}

export default nextConfig
