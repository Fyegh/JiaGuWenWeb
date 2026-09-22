// ============================================
// 主入口文件
// ============================================

// Toast 提示
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

window.showToast = showToast;

// 产品卡片HTML生成
function createProductCard(product) {
  const discount = product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : 0;

  const stars = '★'.repeat(Math.floor(product.rating || 5));
  const oracleChars = ['龍', '鳳', '禾', '鼎', '壽', '福', '祿', '喜', '文', '墨'];
  const randomChar = oracleChars[product.id % oracleChars.length];

  // ★ 核心修改：判断是否有真实图片
  let imageHtml = '';
  if (product.image && product.image.trim() !== '' && product.image.startsWith('/assets/uploads/')) {
    imageHtml = `<img src="${product.image}" alt="${product.name}" style="width:100%; height:100%; object-fit:cover;">`;
  } else {
    imageHtml = `<div class="product-placeholder">${randomChar}</div>`;
  }

  return `
    <div class="product-card shine-effect" onclick="navigateToProduct(${product.id})">
      <div class="product-card-image">
        ${imageHtml}
        ${discount > 0 ? `<div class="product-card-badge">-${discount}%</div>` : ''}
        <button class="product-card-favorite" onclick="event.stopPropagation(); toggleFavorite(${product.id}, this)" title="收藏">♡</button>
        <div class="product-overlay">
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); quickAddToCart(${product.id})">🛒 加入购物车</button>
          <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); navigateToProduct(${product.id})">查看详情</button>
        </div>
      </div>
      <div class="product-card-info">
        <div class="product-card-category">${product.category}</div>
        <div class="product-card-name">${product.name}</div>
        <div class="product-card-bottom">
          <div class="product-card-price">
            <span class="price-current">¥${product.price}</span>
            ${product.original_price > product.price ? `<span class="price-original">¥${product.original_price}</span>` : ''}
          </div>
          <div class="product-card-rating">
            <span class="stars">${stars}</span>
            <span>${product.rating || 5}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

window.createProductCard = createProductCard;

// 跳转到产品详情
function navigateToProduct(id) {
  AnimationEngine.pageTransition(() => {
    window.location.href = `/product-detail.html?id=${id}`;
  });
}

window.navigateToProduct = navigateToProduct;

// 快速加入购物车
async function quickAddToCart(productId) {
  if (!Auth.requireLogin()) return;
  try {
    await API.addToCart(productId, 1);
    showToast('已加入购物车', 'success');
    Auth.updateCartBadge();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

window.quickAddToCart = quickAddToCart;

// 切换收藏
async function toggleFavorite(productId, btn) {
  if (!Auth.requireLogin()) return;
  try {
    if (btn.classList.contains('active')) {
      await API.removeFavorite(productId);
      btn.classList.remove('active');
      btn.innerHTML = '♡';
      showToast('已取消收藏', 'info');
    } else {
      await API.addFavorite(productId);
      btn.classList.add('active');
      btn.innerHTML = '♥';
      showToast('已添加到收藏', 'success');
    }
  } catch (e) {
    showToast(e.message, 'error');
  }
}

window.toggleFavorite = toggleFavorite;

// 导航栏滚动效果
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // 移动端菜单
  const menuBtn = document.querySelector('.nav-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      menuBtn.classList.toggle('active');
    });
  }

  // 更新导航栏用户状态
  Auth.updateNavbar();
}

// 加载屏幕
function hideLoading() {
  const loading = document.querySelector('.loading-screen');
  if (loading) {
    setTimeout(() => {
      loading.classList.add('hidden');
      setTimeout(() => loading.remove(), 500);
    }, 800);
  }
}

// 页面初始化
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  hideLoading();
  new AnimationEngine();
});