// ============================================
// 认证模块 v4.0 - 修复 setAuth
// ============================================

class Auth {
  static getToken() {
    return localStorage.getItem('token');
  }

  static getUser() {
    const s = localStorage.getItem('user');
    if (!s) return null;
    try { return JSON.parse(s); } catch(e) { return null; }
  }

  static isLoggedIn() {
    return !!this.getToken() && !!this.getUser();
  }

  static isAdmin() {
    const u = this.getUser();
    return u && u.role === 'admin';
  }

  // ★★★ 关键：登录成功后保存认证信息 ★★★
  static setAuth(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this.updateNav();
  }

  static logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.updateNav();
    showToast('已退出登录', 'info');
    setTimeout(() => window.location.href = '/', 600);
  }

  static requireLogin() {
    if (!this.isLoggedIn()) {
      showToast('请先登录', 'warning');
      setTimeout(() => window.location.href = '/login.html', 800);
      return false;
    }
    return true;
  }

  static updateNav() {
    const nav = document.getElementById('navActions');
    if (!nav) return;

    if (this.isLoggedIn()) {
      const user = this.getUser();
      const initial = (user.username || 'U').charAt(0).toUpperCase();
      nav.innerHTML = `
        <div class="nav-user-menu">
          <button class="nav-avatar" onclick="Auth.toggleUserMenu()" id="navAvatarBtn">
            ${initial}
          </button>
          <div class="nav-dropdown" id="navDropdown">
            <div class="nav-dropdown-header">
              <div class="nav-dropdown-name">${user.username}</div>
              <div class="nav-dropdown-email">${user.email || ''}</div>
            </div>
            <div class="nav-dropdown-divider"></div>
            <a href="/favorites.html" class="nav-dropdown-item">♡ 我的收藏</a>
            <a href="/cart.html" class="nav-dropdown-item">🛒 购物车</a>
            <a href="/orders.html" class="nav-dropdown-item">📦 我的订单</a>
            ${this.isAdmin() ? '<a href="/admin.html" class="nav-dropdown-item">⚙ 管理后台</a>' : ''}
            <div class="nav-dropdown-divider"></div>
            <a href="javascript:void(0)" onclick="Auth.logout()" class="nav-dropdown-item nav-dropdown-logout">退出登录</a>
          </div>
        </div>
      `;
    } else {
      nav.innerHTML = `
        <a href="/login.html" class="btn btn-ghost btn-sm">登录</a>
        <a href="/register.html" class="btn btn-primary btn-sm">注册</a>
      `;
    }
  }

  static toggleUserMenu() {
    const d = document.getElementById('navDropdown');
    if (d) d.classList.toggle('show');
  }

  static updateCartBadge() {}
}

// Toast
function showToast(message, type = 'info') {
  document.querySelectorAll('.toast-msg').forEach(t => t.remove());
  const toast = document.createElement('div');
  toast.className = 'toast-msg';
  
  const colors = {
    success: { bg: 'rgba(39,174,96,0.95)', color: '#fff', icon: '✓' },
    error: { bg: 'rgba(231,76,60,0.95)', color: '#fff', icon: '✕' },
    warning: { bg: 'rgba(241,196,15,0.95)', color: '#000', icon: '!' },
    info: { bg: 'rgba(52,73,94,0.95)', color: '#fff', icon: 'i' }
  };
  const c = colors[type] || colors.info;

  toast.style.cssText = `
    position:fixed; top:24px; right:24px; z-index:99999;
    padding:14px 24px 14px 20px; border-radius:10px;
    font-size:0.88rem; font-weight:500;
    background:${c.bg}; color:${c.color};
    box-shadow:0 12px 40px rgba(0,0,0,0.3);
    backdrop-filter:blur(12px);
    border:1px solid rgba(255,255,255,0.08);
    display:flex; align-items:center; gap:10px;
    animation:toastIn 0.5s cubic-bezier(0.16,1,0.3,1) forwards;
  `;
  toast.innerHTML = `<span style="width:22px;height:22px;border-radius:50%;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;font-size:0.72rem;font-weight:700;">${c.icon}</span><span>${message}</span>`;

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.4s cubic-bezier(0.16,1,0.3,1) forwards';
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// 关闭下拉
document.addEventListener('click', e => {
  if (!e.target.closest('.nav-user-menu')) {
    const d = document.getElementById('navDropdown');
    if (d) d.classList.remove('show');
  }
});

// 页面加载时同步登录状态
document.addEventListener('DOMContentLoaded', () => Auth.updateNav());