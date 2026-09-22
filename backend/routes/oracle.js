const express = require('express');
const { db } = require('../database');
const { authMiddleware } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const paths = require('../paths');
const router = express.Router();

// CSV上传目录
const csvDir = paths.csvDir();

const upload = multer({ dest: csvDir, limits: { fileSize: 10 * 1024 * 1024 } });

// 获取所有甲骨文数据
router.get('/', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    let where = '';
    let params = [];
    if (search) {
      where = 'WHERE hanzi LIKE ? OR pinyin LIKE ?';
      params = [`%${search}%`, `%${search}%`];
    }

    const total = db.prepare(`SELECT COUNT(*) as c FROM oracle_bones ${where}`).get(...params).c;
    const items = db.prepare(`SELECT * FROM oracle_bones ${where} ORDER BY id ASC LIMIT ? OFFSET ?`).all(...params, limit, offset);

    res.json({
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('获取甲骨文数据:', err);
    res.status(500).json({ error: err.message });
  }
});
// 获取随机甲骨文
router.get('/random/list', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const items = db.prepare('SELECT * FROM oracle_bones ORDER BY RANDOM() LIMIT ?').all(limit);
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取单个甲骨文
router.get('/:id', (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM oracle_bones WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ error: '未找到' });
    res.json({ item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// CSV上传导入
// Excel 上传导入（仅支持 .xlsx / .xls）
router.post('/upload-csv', authMiddleware, upload.single('csvfile'), (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  if (!req.file) return res.status(400).json({ error: '请上传Excel文件' });

  const filePath = req.file.path;

  try {
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    const insert = db.prepare(`
      INSERT OR REPLACE INTO oracle_bones (id, hanzi, pinyin, description, image_url)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((dataRows) => {
      let count = 0;
      for (const row of dataRows) {
        const id = parseInt(row.id || row.ID || row['编号']) || null;
        const hanzi = (row.hanzi || row['汉字'] || row['字'] || '').toString().trim();
        const pinyin = (row.pinyin || row['拼音'] || '').toString().trim();
        const desc = (row.desc || row.description || row['描述'] || row['释义'] || row['说明'] || '').toString().trim();
        const img = (row.img || row.image_url || row.image || row['图片'] || row['图片链接'] || '').toString().trim();
        if (hanzi) {
          insert.run(id, hanzi, pinyin, desc, img);
          count++;
        }
      }
      return count;
    });

    const count = insertMany(rawRows);
    fs.unlinkSync(filePath);
    res.json({ message: `成功导入 ${count} 条甲骨文数据`, count });

  } catch (err) {
    console.error('导入Excel错误:', err);
    try { fs.unlinkSync(filePath); } catch(e) {}
    res.status(500).json({ error: '导入失败: ' + err.message });
  }
});
// 甲骨文图片上传目录
const imgDir = paths.oracleImgDir();

const imgUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, imgDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '.png';
      cb(null, `oracle_${req.params.id}_${Date.now()}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('只能上传图片文件'));
  }
});

// 为某个甲骨文上传图片
router.post('/:id/upload-image', authMiddleware, imgUpload.single('image'), (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  if (!req.file) return res.status(400).json({ error: '请选择图片' });

  try {
    const item = db.prepare('SELECT * FROM oracle_bones WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ error: '未找到该记录' });

    // 删除旧图片文件（如果存在）
    if (item.image_url && item.image_url.startsWith('/images/oracle/')) {
      const oldPath = path.join(imgDir, path.basename(item.image_url));
      try { fs.unlinkSync(oldPath); } catch(e) {}
    }

    const imageUrl = `/images/oracle/${req.file.filename}`;
    db.prepare('UPDATE oracle_bones SET image_url = ? WHERE id = ?').run(imageUrl, req.params.id);

    res.json({ message: '图片上传成功', image_url: imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// 手动添加单条
router.post('/', authMiddleware, (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  try {
    const { hanzi, pinyin, description, image_url } = req.body;
    if (!hanzi) return res.status(400).json({ error: '汉字必填' });

    const result = db.prepare('INSERT INTO oracle_bones (hanzi, pinyin, description, image_url) VALUES (?, ?, ?, ?)')
      .run(hanzi, pinyin || '', description || '', image_url || '');

    res.json({ message: '添加成功', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// 清空所有甲骨文数据
router.delete('/clear-all', authMiddleware, (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  try {
    const info = db.prepare('DELETE FROM oracle_bones').run();
    res.json({ message: `已清空全部数据（共删除 ${info.changes} 条）` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// 删除
router.delete('/:id', authMiddleware, (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  try {
    db.prepare('DELETE FROM oracle_bones WHERE id = ?').run(req.params.id);
    res.json({ message: '已删除' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;