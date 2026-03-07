/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: process.env.NEXT_PUBLIC_API_URL
                    ? `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`
                    : 'https://loomiflow-backend-production-db59.up.railway.app/api/:path*',
            },
        ]
    },
}

export default nextConfig;
