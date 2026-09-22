const express = require('express');
const { db } = require('../database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// 获取收藏列表（返回完整产品信息）
router.get('/', authMiddleware, (req, res) => {
  try {
    const favorites = db.prepare(`
      SELECT f.id as fav_id, f.product_id, f.created_at as fav_date, 
             p.id, p.name, p.description, p.price, p.original_price, 
             p.category, p.image, p.stock, p.rating, p.sales
      FROM favorites f
      INNER JOIN products p ON f.product_id = p.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `).all(req.user.id);

    res.json({ favorites });
  } catch (err) {
    res.status(500).json({ error: '获取收藏失败: ' + err.message });
  }
});

// 添加收藏
router.post('/', authMiddleware, (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: '缺少产品ID' });

    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
    if (!product) return res.status(404).json({ error: '产品不存在' });

    const existing = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND product_id = ?').get(req.user.id, productId);
    if (existing) return res.json({ message: '已在收藏中' });

    db.prepare('INSERT INTO favorites (user_id, product_id) VALUES (?, ?)').run(req.user.id, productId);
    res.json({ message: '收藏成功' });
  } catch (err) {
    res.status(500).json({ error: '收藏失败: ' + err.message });
  }
});

// 取消收藏
router.delete('/:productId', authMiddleware, (req, res) => {
  try {
    db.prepare('DELETE FROM favorites WHERE user_id = ? AND product_id = ?').run(req.user.id, req.params.productId);
    res.json({ message: '已取消收藏' });
  } catch (err) {
    res.status(500).json({ error: '取消收藏失败: ' + err.message });
  }
});

module.exports = router;