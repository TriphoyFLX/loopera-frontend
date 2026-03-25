const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = (req, res) => {
  const target = 'http://45.83.140.152:5001';
  
  const proxy = createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: {
      '^/api': '/api',
      '^/uploads': '/uploads'
    },
    onProxyReq: (proxyReq, req, res) => {
      // Добавляем CORS headers
      proxyReq.setHeader('Origin', target);
    },
    onProxyRes: (proxyRes, req, res) => {
      // Добавляем CORS headers в ответ
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'X-Requested-With, Content-Type, Authorization';
    }
  });

  return proxy(req, res);
};
