/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  redirects: async () => [
    {
      source: "/",
      destination: "/login",
      permanent: true,
    },
  ],
};

export default nextConfig;
