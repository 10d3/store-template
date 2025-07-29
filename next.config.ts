import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "**",
      },
      {
        protocol:"https",
        hostname:"files.stripe.com",
        pathname:"**"
      },
      {
        protocol:"https",
        hostname:"6ay8a7s9vf.ufs.sh",
        pathname:"**"
      }
    ],
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
