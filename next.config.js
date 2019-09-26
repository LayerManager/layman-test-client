const isProd = process.env.NODE_ENV === 'production';
module.exports = {
  distDir: 'build',
  assetPrefix: isProd ? '/static/test-client' : '',
  publicRuntimeConfig: {
    REFRESH_USER_INTERVAL: 2,
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