// ============================================
// 收藏页面
// ============================================

class FavoritesPage {
  constructor() {
    this.init();
  }

  async init() {
    if (!Auth.requireLogin()) return;
    await this.loadFavorites();
  }

  async loadFavorites() {
    try {
      const data = await API.getFavorites();
      this.render(data.favorites);
    } catch (e) {
      showToast('加载收藏失败', 'error');
    }
  }

  render(favorites) {
    const container = document.getElementById('favoritesContent');
    if (!container) return;

    if (favorites.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">♡</div>
          <h3>还没有收藏</h3>
          <p>浏览产品时点击心形图标即可收藏</p>
          <a href="/products.html" class="btn btn-primary">去发现</a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="products-grid">
        ${favorites.map(item => createProductCard(item)).join('')}
      </div>
    `;

    setTimeout(() => {
      const cards = container.querySelectorAll('.product-card');
      AnimationEngine.staggerCards(cards, 80);
    }, 50);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('favoritesContent')) {
    new FavoritesPage();
  }
});