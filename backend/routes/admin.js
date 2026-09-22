const express = require('express');
const { db } = require('../database');
const { authMiddleware } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const paths = require('../paths');
const router = express.Router();

// 确保上传目录存在
const uploadsDir = paths.productUploadDir();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, 'product-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8) + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// 管理员检查中间件
function adminCheck(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
}

// ★ 仪表盘数据
router.get('/dashboard', authMiddleware, adminCheck, (req, res) => {
  try {
    const totalProducts = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
    const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users').get().c;

    let totalOrders = 0, totalRevenue = 0, recentOrders = [];
    try {
      totalOrders = db.prepare('SELECT COUNT(*) as c FROM orders').get().c;
      const rev = db.prepare('SELECT COALESCE(SUM(total_amount),0) as r FROM orders').get();
      totalRevenue = rev.r || 0;
      recentOrders = db.prepare('SELECT o.*, u.username FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 10').all();
    } catch(e) {}

    const topProducts = db.prepare('SELECT * FROM products ORDER BY sales DESC LIMIT 5').all();
    const recentUsers = db.prepare('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5').all();

    res.json({
      stats: {
        totalProducts,
        totalUsers,
        totalOrders,
        totalRevenue: totalRevenue.toFixed(2)
      },
      topProducts,
      recentOrders,
      recentUsers
    });
  } catch (err) {
    console.error('仪表盘错误:', err);
    res.status(500).json({ error: '获取数据失败: ' + err.message });
  }
});

// 获取所有产品
router.get('/products', authMiddleware, adminCheck, (req, res) => {
  try {
    const products = db.prepare('SELECT * FROM products ORDER BY id DESC').all();
    res.json({ products });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// 上架新产品
router.post('/products', authMiddleware, adminCheck, upload.single('image'), (req, res) => {
  try {
    const { name, description, price, original_price, category, stock, details, featured } = req.body;
    if (!name || !price) return res.status(400).json({ error: '产品名和价格必填' });

    let imagePath = '';
    if (req.file) {
      imagePath = '/assets/uploads/' + req.file.filename;
    }

    const result = db.prepare(`
      INSERT INTO products (name, description, price, original_price, category, image, stock, details, featured, rating, sales)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 5.0, 0)
    `).run(
      name,
      description || '',
      parseFloat(price),
      parseFloat(original_price || price),
      category || '',
      imagePath,
      parseInt(stock || 0),
      details || '',
      parseInt(featured || 0)
    );

    res.json({ message: '产品上架成功', productId: result.lastInsertRowid });
  } catch(err) {
    console.error('上架错误:', err);
    res.status(500).json({ error: '上架失败: ' + err.message });
  }
});

// 更新产品
router.put('/products/:id', authMiddleware, adminCheck, upload.single('image'), (req, res) => {
  try {
    const { name, description, price, original_price, category, stock, details, featured } = req.body;
    const id = parseInt(req.params.id);

    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: '产品不存在' });

    let imagePath = existing.image;
    if (req.file) {
      imagePath = '/assets/uploads/' + req.file.filename;
    }

    db.prepare(`
      UPDATE products SET name=?, description=?, price=?, original_price=?, category=?, image=?, stock=?, details=?, featured=?
      WHERE id=?
    `).run(
      name || existing.name,
      description !== undefined ? description : existing.description,
      parseFloat(price || existing.price),
      parseFloat(original_price || existing.original_price),
      category !== undefined ? category : existing.category,
      imagePath,
      parseInt(stock !== undefined ? stock : existing.stock),
      details !== undefined ? details : existing.details,
      parseInt(featured !== undefined ? featured : existing.featured),
      id
    );

    res.json({ message: '更新成功' });
  } catch(err) {
    res.status(500).json({ error: '更新失败: ' + err.message });
  }
});

// 删除产品
router.delete('/products/:id', authMiddleware, adminCheck, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    db.prepare('DELETE FROM cart WHERE product_id = ?').run(id);
    db.prepare('DELETE FROM favorites WHERE product_id = ?').run(id);
    res.json({ message: '删除成功' });
  } catch(err) {
    res.status(500).json({ error: '删除失败: ' + err.message });
  }
});

// 获取所有订单
router.get('/orders', authMiddleware, adminCheck, (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.*, u.username FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `).all();

    orders.forEach(order => {
      order.items = db.prepare(`
        SELECT oi.*, p.name, p.image FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `).all(order.id);
    });

    res.json({ orders });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// 更新订单状态
router.put('/orders/:id/status', authMiddleware, adminCheck, (req, res) => {
  try {
    const { status } = req.body;
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ message: '状态已更新' });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取所有用户
router.get('/users', authMiddleware, adminCheck, (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC').all();
    res.json({ users });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// 删除用户
router.delete('/users/:id', authMiddleware, adminCheck, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (id === req.user.id) return res.status(400).json({ error: '不能删除自己' });
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    res.json({ message: '用户已删除' });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;