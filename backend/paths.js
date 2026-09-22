// 统一管理可写目录（数据库、上传文件）的位置。
// 打包成 exe 后，__dirname 指向只读的打包快照，无法写入，
// 所以把可写数据放到 exe 同级的目录里；开发时保持原有路径不变。
const path = require('path');
const fs = require('fs');

const isPkg = typeof process.pkg !== 'undefined';
const exeDir = isPkg ? path.dirname(process.execPath) : path.join(__dirname, '..');

function ensure(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

module.exports = {
  isPkg,
  exeDir,
  // SQLite 数据库文件路径
  dbPath() {
    const dir = isPkg ? path.join(exeDir, 'data') : path.join(__dirname, 'data');
    ensure(dir);
    return path.join(dir, 'store.db');
  },
  // 商品图片目录（对应 URL /assets/uploads/...）
  productUploadDir() {
    return ensure(
      isPkg
        ? path.join(exeDir, 'uploads', 'products')
        : path.join(__dirname, '..', 'frontend', 'assets', 'uploads')
    );
  },
  // 甲骨文 CSV 上传目录（不对外提供静态访问）
  csvDir() {
    return ensure(
      isPkg ? path.join(exeDir, 'uploads', 'csv') : path.join(__dirname, '..', 'uploads', 'csv')
    );
  },
  // 甲骨文图片目录（对应 URL /images/oracle/...）
  oracleImgDir() {
    return ensure(
      isPkg
        ? path.join(exeDir, 'uploads', 'oracle')
        : path.join(__dirname, '..', 'public', 'images', 'oracle')
    );
  },
};
