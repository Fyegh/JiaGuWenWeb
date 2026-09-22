// pkg 打包配置
module.exports = {
  targets: ['node24-win-x64'],
  // 需要一并打包进 exe 的资源（静态前端、公共资源、内置数据库、原生模块）
  assets: [
    'frontend/**/*',
    'public/**/*',
    'backend/data/store.db',
    'backend/node_modules/better-sqlite3/build/Release/better_sqlite3.node',
  ],
};
