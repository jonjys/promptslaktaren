import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Permissions-Policy",
            value:
              "publickey-credentials-get=*, usb=*, hid=*, compute-pressure=*",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'self' https://fred-platform.vercel.app https://*.vercel.app http://localhost:3000",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
