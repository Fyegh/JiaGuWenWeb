const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'data', 'store.db');
const fs = require('fs');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      price REAL NOT NULL,
      original_price REAL DEFAULT 0,
      category TEXT DEFAULT '',
      image TEXT DEFAULT '',
      stock INTEGER DEFAULT 0,
      sales INTEGER DEFAULT 0,
      rating REAL DEFAULT 5.0,
      featured INTEGER DEFAULT 0,
      details TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      address TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      note TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS oracle_bones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hanzi TEXT NOT NULL,
      pinyin TEXT DEFAULT '',
      description TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 创建管理员
  const admin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!admin) {
    const hashed = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)').run('admin', 'admin@oracle.com', hashed, 'admin');
    console.log('✓ 管理员已创建: admin / admin123');
  }

  // 种子产品
  const productCount = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
  if (productCount === 0) {
    const products = [
      { name: '甲骨文书签套装', desc: '精选12个甲骨文字符，黄铜材质镂空设计', price: 68, orig: 88, cat: '创意文具', stock: 200, featured: 1 },
      { name: '象形文字拼图(1000片)', desc: '100个甲骨文字符组成的艺术拼图，寓教于乐', price: 98, orig: 128, cat: '益智玩具', stock: 150, featured: 1 },
      { name: '甲骨文印章定制', desc: '选择你喜欢的甲骨文字，定制专属篆刻印章', price: 168, orig: 218, cat: '篆刻艺术', stock: 100, featured: 1 },
      { name: '金文毛笔字帖', desc: '精选金文名篇，配临摹纸，适合书法爱好者', price: 45, orig: 58, cat: '书法艺术', stock: 300, featured: 1 },
      { name: '甲骨文T恤（龙纹）', desc: '纯棉面料，甲骨文"龙"字印花，舒适透气', price: 128, orig: 168, cat: '服饰配件', stock: 180, featured: 1 },
      { name: '青铜器纹饰笔记本', desc: 'A5精装笔记本，青铜器纹饰封面设计', price: 38, orig: 48, cat: '创意文具', stock: 500, featured: 0 },
      { name: '甲骨文冰箱贴套装', desc: '20枚甲骨文冰箱贴，覆盖常用字', price: 35, orig: 45, cat: '创意文具', stock: 400, featured: 0 },
      { name: '殷墟陶器复制品', desc: '按照殷墟出土陶器1:2比例复制', price: 298, orig: 388, cat: '生活器具', stock: 50, featured: 1 },
      { name: '甲骨文帆布包', desc: '文艺复古风，实用大容量', price: 58, orig: 78, cat: '服饰配件', stock: 250, featured: 0 },
      { name: '文房四宝套装', desc: '笔墨纸砚精品套装，送礼佳品', price: 388, orig: 498, cat: '文房雅器', stock: 80, featured: 1 },
      { name: '甲骨文解密卡牌', desc: '120张卡牌学习甲骨文，亲子互动', price: 58, orig: 78, cat: '益智玩具', stock: 200, featured: 0 },
      { name: '古文字台灯', desc: '甲骨文镂空灯罩，营造文化氛围', price: 218, orig: 288, cat: '生活器具', stock: 100, featured: 1 },
    ];

    const insert = db.prepare('INSERT INTO products (name, description, price, original_price, category, stock, featured, rating, sales) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    products.forEach(p => {
      insert.run(p.name, p.desc, p.price, p.orig, p.cat, p.stock, p.featured, (4 + Math.random()).toFixed(1), Math.floor(Math.random() * 500));
    });
    console.log('✓ 种子产品已创建:', products.length, '个');
  }

  // 种子甲骨文
  const oracleCount = db.prepare('SELECT COUNT(*) as c FROM oracle_bones').get().c;
  if (oracleCount === 0) {
    const oracleData = [
      { hanzi: '龍', pinyin: 'lóng', desc: '象形字。像一种头上有角、大口、纹身、蜿蜒的神异动物。' },
      { hanzi: '鳳', pinyin: 'fèng', desc: '象形字。像一种高冠、华丽的大鸟。凤为百鸟之王。' },
      { hanzi: '安', pinyin: 'ān', desc: '会意字。从宀从女。表示屋中有女则安。本义为安定、安全。' },
      { hanzi: '福', pinyin: 'fú', desc: '形声字。从示，畐声。本义为福气、福运。甲骨文像双手捧酒坛向神祈祷。' },
      { hanzi: '壽', pinyin: 'shòu', desc: '形声字。本义为长寿。甲骨文像老人拄杖之形。' },
      { hanzi: '文', pinyin: 'wén', desc: '象形字。甲骨文像一个正面站立的人，胸前有纹饰图案。本义为花纹、纹理。' },
      { hanzi: '道', pinyin: 'dào', desc: '会意字。从辵(行走)从首(头)。人行走之路、引申为道理、规律。' },
      { hanzi: '美', pinyin: 'měi', desc: '会意字。从大从羊。大羊为美。古人以羊大为美。' },
      { hanzi: '德', pinyin: 'dé', desc: '形声字。甲骨文从彳从直从心。直心而行为德。' },
      { hanzi: '仁', pinyin: 'rén', desc: '会意字。从人从二。二人相处之道，本义为仁爱。' },
      { hanzi: '日', pinyin: 'rì', desc: '象形字。甲骨文像太阳之形，中间一横或一点表示太阳的光辉。' },
      { hanzi: '月', pinyin: 'yuè', desc: '象形字。甲骨文像弯月之形。本义为月亮。' },
    ];

    const insert = db.prepare('INSERT INTO oracle_bones (hanzi, pinyin, description) VALUES (?, ?, ?)');
    oracleData.forEach(o => insert.run(o.hanzi, o.pinyin, o.desc));
    console.log('✓ 种子甲骨文已创建:', oracleData.length, '个');
  }

  console.log('✓ 数据库初始化完成');
}

initDatabase();

module.exports = { db };