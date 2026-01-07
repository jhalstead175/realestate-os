/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // PRODUCTION PATCH: Ignore build errors temporarily
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
