import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // @igr/tax-rules and @igr/database ship TypeScript source, not a build.
  transpilePackages: ['@igr/tax-rules'],
  // typedRoutes stays off until every route in NAV exists; it fails the build
  // on links to routes not yet written, which is unhelpful mid-construction.
  typedRoutes: false,
};

export default nextConfig;
