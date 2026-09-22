const jwt = require('jsonwebtoken');

const JWT_SECRET = 'hieroglyph_store_secret_key_2024';

// 验证用户登录
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '请先登录' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

// 验证管理员权限
function adminMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '请先登录' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: '无管理员权限' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: '登录已过期' });
  }
}

// 可选认证（登录了就带用户信息，没登录也放行）
function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // token 无效，忽略
    }
  }
  next();
}

module.exports = { authMiddleware, adminMiddleware, optionalAuth, JWT_SECRET };