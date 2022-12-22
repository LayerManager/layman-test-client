// import dotenv from 'dotenv';
// dotenv.config();
const dotenv = require('dotenv');
dotenv.config();

const isProd = process.env.NODE_ENV === 'production';
module.exports = {
  distDir: 'build',
  assetPrefix: process.env.LTC_BASEPATH,
  publicRuntimeConfig: {
    REFRESH_USER_INTERVAL: 60,
    ASSET_PREFIX: process.env.LTC_BASEPATH,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
    }

    return config
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};