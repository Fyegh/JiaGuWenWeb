const express = require('express');
const cors = require('cors');
const path = require('path');
const paths = require('./paths');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件
app.use(express.static(path.join(__dirname, '../frontend')));
app.use(express.static(path.join(__dirname, '../public')));

// 打包成 exe 后，新上传的图片保存在 exe 同级目录，需要额外挂载对外提供访问
if (paths.isPkg) {
  app.use('/assets/uploads', express.static(paths.productUploadDir()));
  app.use('/images/oracle', express.static(paths.oracleImgDir()));
}

// API 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/oracle', require('./routes/oracle'));

// SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API not found' });
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🏛  象形文创服务器已启动`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`📍 管理后台: http://localhost:${PORT}/admin.html`);
  console.log(`📍 甲骨文馆: http://localhost:${PORT}/oracle.html\n`);

  // 双击 exe 运行时自动打开浏览器；开发时(node server.js)不自动打开
  if (paths.isPkg) {
    try {
      const { exec } = require('child_process');
      exec(`start "" http://localhost:${PORT}`);
      console.log('💡 已自动打开浏览器；关闭本窗口即可停止服务器。\n');
    } catch (e) {
      // 忽略自动打开失败
    }
  }
});