// 打包入口：让 pkg 以项目根目录为快照根，从而保证后端里
// path.join(__dirname, '../frontend') 等相对路径在打包后依然指向正确位置。
require('./backend/server.js');
