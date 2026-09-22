const express = require('express');
const { db } = require('../database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// ===== 购物车 =====

// 获取购物车
router.get('/cart', authMiddleware, (req, res) => {
  try {
    const items = db.prepare(`
      SELECT c.id, c.product_id, c.quantity,
             p.name, p.price, p.original_price, p.image, p.stock, p.category
      FROM cart c
      INNER JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `).all(req.user.id);
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: '获取购物车失败: ' + err.message });
  }
});

// 添加到购物车
router.post('/cart', authMiddleware, (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ error: '缺少产品ID' });

    const product = db.prepare('SELECT id, stock FROM products WHERE id = ?').get(productId);
    if (!product) return res.status(404).json({ error: '产品不存在' });

    const existing = db.prepare('SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?').get(req.user.id, productId);
    if (existing) {
      const newQty = existing.quantity + parseInt(quantity);
      if (newQty > product.stock) return res.status(400).json({ error: '库存不足' });
      db.prepare('UPDATE cart SET quantity = ? WHERE id = ?').run(newQty, existing.id);
    } else {
      if (parseInt(quantity) > product.stock) return res.status(400).json({ error: '库存不足' });
      db.prepare('INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)').run(req.user.id, productId, parseInt(quantity));
    }

    res.json({ message: '已加入购物车' });
  } catch (err) {
    res.status(500).json({ error: '加入购物车失败: ' + err.message });
  }
});

// 更新购物车数量
router.put('/cart/:productId', authMiddleware, (req, res) => {
  try {
    const { quantity } = req.body;
    if (quantity <= 0) {
      db.prepare('DELETE FROM cart WHERE user_id = ? AND product_id = ?').run(req.user.id, req.params.productId);
    } else {
      db.prepare('UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?').run(quantity, req.user.id, req.params.productId);
    }
    res.json({ message: '已更新' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 删除购物车项
router.delete('/cart/:productId', authMiddleware, (req, res) => {
  try {
    db.prepare('DELETE FROM cart WHERE user_id = ? AND product_id = ?').run(req.user.id, req.params.productId);
    res.json({ message: '已删除' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== 订单 =====

// 创建订单
router.post('/', authMiddleware, (req, res) => {
  try {
    const { address, phone, note } = req.body;
    if (!address || !phone) return res.status(400).json({ error: '请填写收货地址和电话' });

    const cartItems = db.prepare(`
      SELECT c.*, p.price, p.stock, p.name FROM cart c
      INNER JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
    `).all(req.user.id);

    if (cartItems.length === 0) return res.status(400).json({ error: '购物车为空' });

    // 检查库存
    for (const item of cartItems) {
      if (item.quantity > item.stock) {
        return res.status(400).json({ error: `"${item.name}" 库存不足` });
      }
    }

    const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const orderResult = db.prepare(
      'INSERT INTO orders (user_id, total_amount, status, address, phone, note) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.user.id, totalAmount, 'pending', address, phone, note || '');

    const orderId = orderResult.lastInsertRowid;

    const insertItem = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');
    const updateStock = db.prepare('UPDATE products SET stock = stock - ?, sales = COALESCE(sales, 0) + ? WHERE id = ?');

    for (const item of cartItems) {
      insertItem.run(orderId, item.product_id, item.quantity, item.price);
      updateStock.run(item.quantity, item.quantity, item.product_id);
    }

    db.prepare('DELETE FROM cart WHERE user_id = ?').run(req.user.id);

    res.json({ message: '下单成功', orderId });
  } catch (err) {
    console.error('下单错误:', err);
    res.status(500).json({ error: '下单失败: ' + err.message });
  }
});

// 获取我的订单
router.get('/', authMiddleware, (req, res) => {
  try {
    const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    orders.forEach(order => {
      order.items = db.prepare(`
        SELECT oi.*, p.name, p.image, p.category FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `).all(order.id);
    });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;