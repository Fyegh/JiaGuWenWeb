// ============================================
// 产品列表 - 完善版
// ============================================

class ProductsPage {
  constructor() {
    this.currentCategory = '';
    this.currentSort = '';
    this.currentSearch = '';
    this.currentPage = 1;
    this.init();
  }

  async init() {
    // 从URL参数读取分类
    const params = new URLSearchParams(window.location.search);
    this.currentCategory = params.get('category') || '';

    await this.loadCategories();
    await this.loadProducts();
    this.bindEvents();
  }

  async loadCategories() {
    try {
      const data = await API.getCategories();
      const container = document.getElementById('categoryFilters');
      if (!container) return;

      container.innerHTML = `
        <button class="filter-btn ${!this.currentCategory ? 'active' : ''}" data-category="">全部</button>
        ${data.categories.map(cat => `
          <button class="filter-btn ${this.currentCategory === cat ? 'active' : ''}" data-category="${cat}">${cat}</button>
        `).join('')}
      `;
    } catch (e) {
      console.error('加载分类失败:', e);
    }
  }

  async loadProducts() {
    try {
      const container = document.getElementById('productsGrid');
      if (!container) return;

      container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:80px;"><div class="loader-oracle"></div></div>';

      const params = { page: this.currentPage, limit: 12 };
      if (this.currentCategory) params.category = this.currentCategory;
      if (this.currentSort) params.sort = this.currentSort;
      if (this.currentSearch) params.search = this.currentSearch;

      const data = await API.getProducts(params);

      // 更新计数
      const countEl = document.getElementById('productsCount');
      if (countEl) {
        countEl.textContent = `共 ${data.pagination.total} 件产品`;
      }

      if (data.products.length === 0) {
        container.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1;">
            <div class="empty-state-icon">📦</div>
            <h3>没有找到产品</h3>
            <p>${this.currentSearch ? '换个关键词试试吧' : '该分类下暂无产品'}</p>
            <button class="btn btn-outline" onclick="productsPage.resetFilters()">查看全部</button>
          </div>
        `;
        return;
      }

      container.innerHTML = data.products.map(p => createProductCard(p)).join('');

      setTimeout(() => {
        AnimationEngine.staggerCards(container.querySelectorAll('.product-card'), 70);
      }, 50);

      this.renderPagination(data.pagination);
    } catch (e) {
      console.error('加载产品失败:', e);
    }
  }

  renderPagination(pagination) {
    const container = document.getElementById('pagination');
    if (!container || pagination.totalPages <= 1) {
      if (container) container.innerHTML = '';
      return;
    }

    let html = '';
    
    if (pagination.page > 1) {
      html += `<button class="filter-btn" onclick="productsPage.goToPage(${pagination.page - 1})">← 上一页</button>`;
    }

    for (let i = 1; i <= pagination.totalPages; i++) {
      if (i === 1 || i === pagination.totalPages || Math.abs(i - pagination.page) <= 2) {
        html += `<button class="filter-btn ${i === pagination.page ? 'active' : ''}" onclick="productsPage.goToPage(${i})">${i}</button>`;
      } else if (Math.abs(i - pagination.page) === 3) {
        html += `<span style="color:var(--text-muted); padding: 8px;">...</span>`;
      }
    }

    if (pagination.page < pagination.totalPages) {
      html += `<button class="filter-btn" onclick="productsPage.goToPage(${pagination.page + 1})">下一页 →</button>`;
    }

    container.innerHTML = html;
  }

  goToPage(page) {
    this.currentPage = page;
    this.loadProducts();
    window.scrollTo({ top: 200, behavior: 'smooth' });
  }

  search() {
    this.currentSearch = document.getElementById('searchInput')?.value || '';
    this.currentPage = 1;
    this.loadProducts();
  }

  resetFilters() {
    this.currentCategory = '';
    this.currentSort = '';
    this.currentSearch = '';
    this.currentPage = 1;
    
    document.querySelectorAll('#categoryFilters .filter-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('#categoryFilters .filter-btn')?.classList.add('active');
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) sortSelect.value = '';
    
    this.loadProducts();
  }

  bindEvents() {
    document.addEventListener('click', (e) => {
      if (e.target.matches('#categoryFilters .filter-btn')) {
        document.querySelectorAll('#categoryFilters .filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentCategory = e.target.dataset.category;
        this.currentPage = 1;
        this.loadProducts();
      }
    });

    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.currentSort = e.target.value;
        this.currentPage = 1;
        this.loadProducts();
      });
    }

    // 回车搜索
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.search();
      });
    }
  }
}

let productsPage;
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('productsGrid')) {
    productsPage = new ProductsPage();
  }
});