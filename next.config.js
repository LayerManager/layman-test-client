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
  exportPathMap: function () {
    return {
      '/': { page: '/index' },
    }
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.node = {
        fs: 'empty',
        net: 'empty',
        tls: 'empty',
      }
    }

    return config
  },
};