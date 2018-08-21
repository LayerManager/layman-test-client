const isProd = process.env.NODE_ENV === 'production';
module.exports = {
  distDir: 'build',
  assetPrefix: isProd ? '/static/test-client' : '',
  exportPathMap: function () {
    return {
      '/': { page: '/index' },
    }
  }
};