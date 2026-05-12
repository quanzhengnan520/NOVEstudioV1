/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  async rewrites() {
    const dest = process.env.BACKEND_INTERNAL_URL ?? "http://127.0.0.1:4000";
    return [{ source: "/api/:path*", destination: `${dest}/v1/:path*` }];
  },
};

export default nextConfig;
