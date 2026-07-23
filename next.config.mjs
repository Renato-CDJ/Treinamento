/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Garante que os documentos de apoio do assistente sejam empacotados no
  // deploy e fiquem acessiveis para a rota /api/assistant-knowledge.
  outputFileTracingIncludes: {
    "/api/assistant-knowledge": ["./conteudo-assistente/**/*"],
  },
}

export default nextConfig
