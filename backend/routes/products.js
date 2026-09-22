const express = require('express');
const { db } = require('../database');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const router = express.Router();

// ★ 分类列表必须在 /:id 前面，否则会被当成id
router.get('/categories/list', (req, res) => {
  try {
    const cats = db.prepare(
      'SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != "" ORDER BY category'
    ).all();
    res.json({ categories: cats.map(c => c.category) });
  } catch (err) {
    res.status(500).json({ error: '获取分类失败: ' + err.message });
  }
});

// 获取所有产品
router.get('/', (req, res) => {
  try {
    const { search, category, sort, page = 1, limit = 50, featured } = req.query;
    let where = ['1=1'];
    const params = [];

    if (search && search.trim()) {
      where.push('(name LIKE ? OR description LIKE ? OR category LIKE ?)');
      const kw = '%' + search.trim() + '%';
      params.push(kw, kw, kw);
    }

    if (category && category.trim() && category !== '全部') {
      where.push('category = ?');
      params.push(category.trim());
    }

    if (featured === '1' || featured === 'true') {
      where.push('featured = 1');
    }

    const whereSql = where.join(' AND ');

    // 排序
    let orderSql;
    switch (sort) {
      case 'price_asc': orderSql = 'ORDER BY price ASC'; break;
      case 'price_desc': orderSql = 'ORDER BY price DESC'; break;
      case 'sales': orderSql = 'ORDER BY sales DESC'; break;
      case 'rating': orderSql = 'ORDER BY rating DESC'; break;
      case 'newest': orderSql = 'ORDER BY id DESC'; break;
      default: orderSql = 'ORDER BY featured DESC, sales DESC, id DESC';
    }

    // 总数
    const total = db.prepare(`SELECT COUNT(*) as c FROM products WHERE ${whereSql}`).get(...params).c;

    // 分页
    const lim = parseInt(limit) || 50;
    const offset = (Math.max(1, parseInt(page)) - 1) * lim;

    const products = db.prepare(
      `SELECT * FROM products WHERE ${whereSql} ${orderSql} LIMIT ? OFFSET ?`
    ).all(...params, lim, offset);

    res.json({
      products,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / lim)
    });
  } catch (err) {
    console.error('产品列表错误:', err);
    res.status(500).json({ error: '获取产品失败: ' + err.message });
  }
});

// 获取单个产品 - 必须在最后
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的产品ID' });
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!product) {
      return res.status(404).json({ error: '产品不存在' });
    }

    let isFavorited = false;
    if (req.user) {
      const fav = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND product_id = ?').get(req.user.id, id);
      isFavorited = !!fav;
    }

    // 更新浏览量
    try {
      db.prepare('UPDATE products SET views = COALESCE(views, 0) + 1 WHERE id = ?').run(id);
    } catch (e) {}

    res.json({ product, isFavorited });
  } catch (err) {
    console.error('产品详情错误:', err);
    res.status(500).json({ error: '获取产品失败: ' + err.message });
  }
});

module.exports = router;