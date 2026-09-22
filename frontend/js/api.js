const API_BASE = '';

class API {
  static getHeaders() {
    const h = {};
    const token = localStorage.getItem('token');
    if (token) h['Authorization'] = 'Bearer ' + token;
    return h;
  }

  static async request(url, options = {}) {
    try {
      const response = await fetch(API_BASE + url, options);
      const text = await response.text();
      let data;
      try { data = JSON.parse(text); }
      catch(e) { throw new Error('服务器响应格式错误'); }
      if (!response.ok) throw new Error(data.error || '请求失败(' + response.status + ')');
      return data;
    } catch(err) {
      if (err.message === 'Failed to fetch') throw new Error('无法连接服务器');
      throw err;
    }
  }

  // 认证
  static login(u, p) {
    return this.request('/api/auth/login', { method: 'POST', headers: { ...this.getHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u, password: p }) });
  }
  static register(u, e, p) {
    return this.request('/api/auth/register', { method: 'POST', headers: { ...this.getHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u, email: e, password: p }) });
  }

  // 产品
  static getProducts(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.request('/api/products' + (q ? '?' + q : ''), { headers: this.getHeaders() });
  }
  static getProduct(id) { return this.request('/api/products/' + id, { headers: this.getHeaders() }); }
  static getCategories() { return this.request('/api/products/categories/list', { headers: this.getHeaders() }); }

  // 收藏
  static getFavorites() { return this.request('/api/favorites', { headers: this.getHeaders() }); }
  static addFavorite(pid) { return this.request('/api/favorites', { method: 'POST', headers: { ...this.getHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: pid }) }); }
  static removeFavorite(pid) { return this.request('/api/favorites/' + pid, { method: 'DELETE', headers: this.getHeaders() }); }

  // 购物车
  static getCart() { return this.request('/api/orders/cart', { headers: this.getHeaders() }); }
  static addToCart(pid, qty = 1) { return this.request('/api/orders/cart', { method: 'POST', headers: { ...this.getHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: pid, quantity: qty }) }); }
  static updateCartItem(pid, qty) { return this.request('/api/orders/cart/' + pid, { method: 'PUT', headers: { ...this.getHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ quantity: qty }) }); }
  static removeFromCart(pid) { return this.request('/api/orders/cart/' + pid, { method: 'DELETE', headers: this.getHeaders() }); }

  // 订单
  static createOrder(data) { return this.request('/api/orders', { method: 'POST', headers: { ...this.getHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); }
  static getOrders() { return this.request('/api/orders', { headers: this.getHeaders() }); }

  // 管理后台
  static getDashboard() { return this.request('/api/admin/dashboard', { headers: this.getHeaders() }); }
  static addProduct(formData) { return this.request('/api/admin/products', { method: 'POST', headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }, body: formData }); }
  static deleteProduct(id) { return this.request('/api/admin/products/' + id, { method: 'DELETE', headers: this.getHeaders() }); }
  static getAdminOrders() { return this.request('/api/admin/orders', { headers: this.getHeaders() }); }
  static updateOrderStatus(oid, s) { return this.request('/api/admin/orders/' + oid + '/status', { method: 'PUT', headers: { ...this.getHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ status: s }) }); }
  static getAdminUsers() { return this.request('/api/admin/users', { headers: this.getHeaders() }); }
  static deleteUser(id) { return this.request('/api/admin/users/' + id, { method: 'DELETE', headers: this.getHeaders() }); }

  // ★ 甲骨文
  static getOracleList(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.request('/api/oracle' + (q ? '?' + q : ''));
  }
  static getOracle(id) { return this.request('/api/oracle/' + id); }
  static getRandomOracle(limit = 6) { return this.request('/api/oracle/random/list?limit=' + limit); }
  static uploadOracleCSV(formData) {
    return this.request('/api/oracle/upload-csv', { method: 'POST', headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }, body: formData });
  }
  static addOracle(data) {
    return this.request('/api/oracle', { method: 'POST', headers: { ...this.getHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  }
  static deleteOracle(id) { return this.request('/api/oracle/' + id, { method: 'DELETE', headers: this.getHeaders() }); }
}

window.API = API;