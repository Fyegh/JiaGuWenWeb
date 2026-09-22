// 运行: node fix-db.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const db = new Database(path.join(__dirname, 'store.db'));

console.log('\n=== 修复数据库 ===\n');

// 1. 检查products表结构，添加缺失列
try {
  const columns = db.prepare("PRAGMA table_info(products)").all();
  const colNames = columns.map(c => c.name);
  
  if (!colNames.includes('views')) {
    db.prepare('ALTER TABLE products ADD COLUMN views INTEGER DEFAULT 0').run();
    console.log('✅ 添加 views 列');
  }
  if (!colNames.includes('featured')) {
    db.prepare('ALTER TABLE products ADD COLUMN featured INTEGER DEFAULT 0').run();
    console.log('✅ 添加 featured 列');
  }
  if (!colNames.includes('original_price')) {
    db.prepare('ALTER TABLE products ADD COLUMN original_price REAL DEFAULT 0').run();
    console.log('✅ 添加 original_price 列');
  }
  if (!colNames.includes('details')) {
    db.prepare('ALTER TABLE products ADD COLUMN details TEXT DEFAULT ""').run();
    console.log('✅ 添加 details 列');
  }
  if (!colNames.includes('rating')) {
    db.prepare('ALTER TABLE products ADD COLUMN rating REAL DEFAULT 5.0').run();
    console.log('✅ 添加 rating 列');
  }
  if (!colNames.includes('sales')) {
    db.prepare('ALTER TABLE products ADD COLUMN sales INTEGER DEFAULT 0').run();
    console.log('✅ 添加 sales 列');
  }
} catch (e) {
  console.log('列检查:', e.message);
}

// 2. 修复图片路径：清除不存在的图片路径
const products = db.prepare('SELECT id, name, image FROM products').all();
let fixedCount = 0;

products.forEach(p => {
  if (p.image && p.image.trim() !== '') {
    const fullPath = path.join(__dirname, '../frontend', p.image);
    if (!fs.existsSync(fullPath)) {
      db.prepare('UPDATE products SET image = ? WHERE id = ?').run('', p.id);
      console.log(`🔧 清除无效图片路径 - ID:${p.id} "${p.name}" (${p.image})`);
      fixedCount++;
    } else {
      console.log(`✅ 图片正常 - ID:${p.id} "${p.name}" (${p.image})`);
    }
  } else {
    console.log(`ℹ️ 无图片 - ID:${p.id} "${p.name}"`);
  }
});

// 3. 确保有示例数据
const count = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
if (count === 0) {
  console.log('\n数据库为空，插入示例数据...');
  const sampleProducts = [
    { name: '甲骨文「龙」字书法挂轴', desc: '取自殷墟出土甲骨，由书法大师重新演绎。宣纸质地，红木轴头，适合书房悬挂。', price: 299, original_price: 399, category: '书法艺术', stock: 50, details: '材质：安徽宣纸 | 尺寸：138cm×34cm | 装裱：红木轴头', featured: 1, rating: 4.8, sales: 128 },
    { name: '象形文字解密互动笔记本', desc: '每一页都印有不同的甲骨文字，附带详细的字形演变图解和趣味解读。', price: 128, original_price: 168, category: '创意文具', stock: 300, details: '规格：A5 | 页数：200页 | 特色：AR互动 | 纸张：100g无酸纸', featured: 1, rating: 4.6, sales: 445 },
    { name: '青铜器纹饰丝巾', desc: '提取商周青铜器上的经典纹饰，以现代数码印花技术呈现于100%桑蚕丝上。', price: 458, original_price: 598, category: '服饰配件', stock: 80, details: '材质：100%桑蚕丝 | 尺寸：90cm×90cm | 工艺：数码印花', featured: 1, rating: 4.9, sales: 89 },
    { name: '甲骨文字印章套装', desc: '精选寿山石料，以甲骨文字体篆刻"诚、信、雅、和"四方印章。', price: 688, original_price: 888, category: '篆刻艺术', stock: 30, details: '材质：寿山石 | 套装：4方印章+印泥+红木盒 | 工艺：手工篆刻 | 附赠：鉴定证书', featured: 1, rating: 5.0, sales: 42 },
    { name: '金文茶杯套组', desc: '杯身刻有西周金文"和"字，寓意以和为贵。德化白瓷，温润如玉。', price: 368, original_price: 468, category: '生活器具', stock: 120, details: '材质：德化白瓷 | 套装：1壶4杯 | 工艺：浮雕刻字', featured: 1, rating: 4.7, sales: 203 },
    { name: '象形文字拼图游戏', desc: '100片象形文字拼图，拼出完整的甲骨文字表。寓教于乐的文化体验。', price: 89, original_price: 129, category: '益智玩具', stock: 500, details: '片数：100片 | 材质：环保木质 | 适合年龄：6岁以上 | 尺寸：40×30cm', featured: 0, rating: 4.5, sales: 678 },
    { name: '甲骨文书签礼盒', desc: '六枚黄铜书签，分别刻有日、月、山、水、木、火六个象形文字。', price: 168, original_price: 218, category: '文房雅器', stock: 200, details: '材质：黄铜镀金 | 数量：6枚/盒 | 包装：专属礼盒 | 工艺：精密蚀刻', featured: 1, rating: 4.8, sales: 356 },
    { name: '殷商纹饰手机壳', desc: '取材殷商青铜器饕餮纹，3D浮雕工艺。适配主流手机型号。', price: 99, original_price: 139, category: '创意文具', stock: 800, details: '材质：PC+TPU | 工艺：3D浮雕 | 适配：iPhone/华为/小米', featured: 0, rating: 4.3, sales: 1024 },
  ];

  const insert = db.prepare(`
    INSERT INTO products (name, description, price, original_price, category, image, stock, details, featured, rating, sales)
    VALUES (?, ?, ?, ?, ?, '', ?, ?, ?, ?, ?)
  `);

  sampleProducts.forEach(p => {
    insert.run(p.name, p.desc, p.price, p.original_price, p.category, p.stock, p.details, p.featured, p.rating, p.sales);
  });
  console.log(`✅ 插入 ${sampleProducts.length} 个示例产品`);
}

// 4. 确保 uploads 文件夹存在
const uploadsDir = path.join(__dirname, '../frontend/assets/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ 创建 uploads 文件夹');
}

// 5. 检查 favorites 表
try {
  db.prepare('SELECT COUNT(*) FROM favorites').get();
  console.log('✅ favorites 表正常');
} catch (e) {
  db.prepare(`CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
  )`).run();
  console.log('✅ 创建 favorites 表');
}

// 6. 检查 browse_history 表
try {
  db.prepare('SELECT COUNT(*) FROM browse_history').get();
} catch (e) {
  db.prepare(`CREATE TABLE IF NOT EXISTS browse_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();
  console.log('✅ 创建 browse_history 表');
}

// 最终报告
const finalCount = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
console.log(`\n=== 修复完成 ===`);
console.log(`产品总数: ${finalCount}`);
console.log(`用户总数: ${userCount}`);
console.log(`修复图片: ${fixedCount} 个`);
console.log(`\n请重启服务器: node server.js\n`);

db.close();