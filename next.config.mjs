/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.LOCAL_BUILD_DIR || ".next",
  reactStrictMode: false,
  transpilePackages: [
    "antd",
    "@ant-design/icons",
    "rc-pagination",
    "rc-picker",
    "rc-util",
  ],
};

export default nextConfig;
