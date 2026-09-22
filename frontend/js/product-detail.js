class ProductDetailPage {
  constructor() {
    this.productId = new URLSearchParams(window.location.search).get('id');
    this.quantity = 1;
    this.product = null;
    this.isFavorited = false;
    if (this.productId) { this.init(); }
    else { this.showError('缺少产品ID'); }
  }

  async init() {
    try {
      const data = await API.getProduct(this.productId);
      if (!data || !data.product) throw new Error('产品不存在');
      this.product = data.product;
      this.isFavorited = data.isFavorited || false;
      this.render();
      document.title = this.product.name + ' | 象形文创';
    } catch (e) {
      console.error('加载产品失败:', e);
      this.showError('产品不存在或已下架');
    }
  }

  showError(msg) {
    const c = document.getElementById('productDetail');
    if (c) {
      c.innerHTML = `<div style="text-align:center;padding:120px 20px;">
        <div style="font-size:4rem;margin-bottom:20px;opacity:0.3;">📦</div>
        <h2 style="font-family:var(--font-serif);margin-bottom:12px;">${msg}</h2>
        <a href="/products.html" class="btn btn-primary" style="margin-top:20px;">返回产品列表</a>
      </div>`;
    }
  }

  render() {
    const c = document.getElementById('productDetail');
    if (!c || !this.product) return;
    const p = this.product;

    // ★ 图片
    const oChars = ['龍','鳳','禾','鼎','壽','福','祿','喜'];
    const ph = oChars[p.id % oChars.length];
    let imgHtml = '';
    if (p.image && p.image.trim() !== '') {
      imgHtml = `
        <img id="mainImg" src="${p.image}" alt="${p.name}" 
          style="width:100%;height:100%;object-fit:contain;padding:20px;position:relative;z-index:2;"
          onerror="this.style.display='none';document.getElementById('imgFallback').style.display='flex';">
        <div id="imgFallback" style="display:none;position:absolute;inset:0;align-items:center;justify-content:center;font-family:var(--font-serif);font-size:10rem;color:rgba(212,175,55,0.08);">${ph}</div>
      `;
    } else {
      imgHtml = `<div style="font-family:var(--font-serif);font-size:10rem;color:rgba(212,175,55,0.08);position:relative;z-index:2;">${ph}</div>`;
    }

    // 鼠标悬浮映射字
    const hoverChars = ['龍','鳳','壽','福','鼎','禾','祿','喜','文','墨','書','道','藝','雅'];
    const hoverChar = hoverChars[p.id % hoverChars.length];

    const stars = '★'.repeat(Math.floor(p.rating || 5));

    // 规格
    const specs = [];
    if (p.details && p.details.trim()) {
      p.details.split('|').forEach(s => {
        const t = s.trim();
        if (!t) return;
        const ci = t.indexOf('：') !== -1 ? t.indexOf('：') : t.indexOf(':');
        if (ci > 0) specs.push({ label: t.substring(0, ci).trim(), value: t.substring(ci + 1).trim() });
        else specs.push({ label: '规格', value: t });
      });
    }

    c.innerHTML = `
      <style>
        .detail-gallery {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid var(--border-color);
          background: linear-gradient(135deg, #0a0908, #141210);
          min-height: 500px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .detail-gallery .hover-oracle {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-serif);
          font-size: 18rem;
          color: rgba(212,175,55,0);
          pointer-events: none;
          z-index: 1;
          transition: all 1.2s cubic-bezier(0.16, 1, 0.3, 1);
          filter: blur(8px);
        }
        .detail-gallery:hover .hover-oracle {
          color: rgba(212,175,55,0.06);
          filter: blur(0px);
          transform: scale(1.1) rotate(-5deg);
        }
        .detail-gallery .glow-follow {
          position: absolute;
          width: 300px; height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%);
          pointer-events: none;
          transform: translate(-50%, -50%);
          transition: all 0.3s ease;
          z-index: 0;
          opacity: 0;
        }
        .detail-gallery:hover .glow-follow { opacity: 1; }
      </style>

      <div class="product-detail" style="display:grid; grid-template-columns:1fr 1fr; gap:50px; padding:140px 40px 80px; max-width:1300px; margin:0 auto;">
        <div class="detail-gallery" id="detailGallery">
          <div class="hover-oracle">${hoverChar}</div>
          <div class="glow-follow" id="galleryGlow"></div>
          ${imgHtml}
        </div>

        <div style="display:flex; flex-direction:column; justify-content:center;">
          <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:16px;">
            <a href="/" style="color:var(--text-muted);text-decoration:none;">首页</a> / 
            <a href="/products.html" style="color:var(--text-muted);text-decoration:none;">全部产品</a> / 
            <a href="/products.html?category=${encodeURIComponent(p.category)}" style="color:var(--text-muted);text-decoration:none;">${p.category}</a>
          </div>

          <div style="font-size:0.72rem; color:var(--gold); letter-spacing:4px; margin-bottom:8px;">${p.category}</div>
          <h1 style="font-family:var(--font-serif); font-size:clamp(1.5rem,3vw,2.2rem); font-weight:700; margin-bottom:20px; line-height:1.4;">${p.name}</h1>

          <div style="display:flex; align-items:baseline; gap:16px; margin-bottom:16px;">
            <span style="font-family:var(--font-serif); font-size:2.2rem; font-weight:700; color:var(--gold);">¥${p.price}</span>
            ${p.original_price > p.price ? `<span style="font-size:1rem; color:var(--text-muted); text-decoration:line-through;">¥${p.original_price}</span>` : ''}
          </div>

          <div style="display:flex; gap:20px; font-size:0.85rem; color:var(--text-secondary); margin-bottom:24px; padding-bottom:20px; border-bottom:1px solid var(--border-color);">
            <span><span style="color:var(--gold);">${stars}</span> ${(p.rating||5).toFixed(1)}分</span>
            <span>· 已售 ${p.sales||0} 件</span>
            <span>· 库存 ${p.stock} 件</span>
          </div>

          <p style="font-size:0.95rem; color:var(--text-secondary); line-height:1.8; margin-bottom:28px;">${p.description || '暂无描述'}</p>

          ${specs.length > 0 ? `
            <div style="margin-bottom:28px;">
              <h3 style="font-family:var(--font-serif); font-size:1rem; margin-bottom:14px;">产品规格</h3>
              <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:10px;">
                ${specs.map(s => `<div style="display:flex; justify-content:space-between; padding:10px 16px; background:var(--bg-secondary); border-radius:6px; font-size:0.85rem;">
                  <span style="color:var(--text-muted);">${s.label}</span>
                  <span style="color:var(--text-primary); font-weight:500;">${s.value}</span>
                </div>`).join('')}
              </div>
            </div>
          ` : ''}

          <div style="display:flex; align-items:center; gap:16px; margin-bottom:24px;">
            <div style="display:flex; align-items:center; border:1px solid var(--border-color); border-radius:8px; overflow:hidden;">
              <button onclick="productDetailPage.changeQuantity(-1)" style="width:44px;height:44px;background:transparent;border:none;color:var(--text-primary);font-size:1.2rem;cursor:pointer;">−</button>
              <input type="number" id="quantityInput" value="1" min="1" max="${p.stock}" readonly style="width:50px;text-align:center;background:transparent;border:none;border-left:1px solid var(--border-color);border-right:1px solid var(--border-color);color:var(--text-primary);font-size:1rem;height:44px;">
              <button onclick="productDetailPage.changeQuantity(1)" style="width:44px;height:44px;background:transparent;border:none;color:var(--text-primary);font-size:1.2rem;cursor:pointer;">+</button>
            </div>
            <button onclick="productDetailPage.addToCart()" style="flex:1;padding:14px 28px;background:var(--gold);border:none;border-radius:8px;color:#000;font-size:0.95rem;font-weight:600;cursor:pointer;transition:all 0.3s;letter-spacing:2px;">
              加入购物车
            </button>
            <button onclick="productDetailPage.toggleFavorite()" id="favBtn"
              style="width:50px;height:50px;border:1px solid ${this.isFavorited ? '#e74c3c' : 'var(--border-color)'};border-radius:8px;background:${this.isFavorited ? 'rgba(231,76,60,0.1)' : 'transparent'};color:${this.isFavorited ? '#e74c3c' : 'var(--text-secondary)'};font-size:1.4rem;cursor:pointer;transition:all 0.3s;">
              ${this.isFavorited ? '♥' : '♡'}
            </button>
          </div>

          <div style="display:flex;gap:24px;padding-top:20px;border-top:1px solid var(--border-color);">
            <span style="font-size:0.82rem;color:var(--text-muted);">🚚 满¥299免运费</span>
            <span style="font-size:0.82rem;color:var(--text-muted);">🔄 7天无理由退换</span>
            <span style="font-size:0.82rem;color:var(--text-muted);">✅ 正品保证</span>
          </div>
        </div>
      </div>
    `;

    // 图片区域鼠标跟踪光效
    const gallery = document.getElementById('detailGallery');
    const glow = document.getElementById('galleryGlow');
    if (gallery && glow) {
      gallery.addEventListener('mousemove', (e) => {
        const rect = gallery.getBoundingClientRect();
        glow.style.left = (e.clientX - rect.left) + 'px';
        glow.style.top = (e.clientY - rect.top) + 'px';
      });
    }
  }

  changeQuantity(delta) {
    const input = document.getElementById('quantityInput');
    if (!input) return;
    let val = parseInt(input.value) + delta;
    val = Math.max(1, Math.min(val, this.product.stock));
    input.value = val;
    this.quantity = val;
  }

  async addToCart() {
    if (!Auth.requireLogin()) return;
    try {
      await API.addToCart(this.productId, this.quantity);
      showToast(`已将 ${this.quantity} 件商品加入购物车 🛒`, 'success');
    } catch (e) { showToast(e.message, 'error'); }
  }

  async toggleFavorite() {
    if (!Auth.requireLogin()) return;
    const btn = document.getElementById('favBtn');
    try {
      if (this.isFavorited) {
        await API.removeFavorite(this.productId);
        this.isFavorited = false;
        btn.innerHTML = '♡';
        btn.style.borderColor = 'var(--border-color)';
        btn.style.background = 'transparent';
        btn.style.color = 'var(--text-secondary)';
        showToast('已取消收藏', 'info');
      } else {
        await API.addFavorite(this.productId);
        this.isFavorited = true;
        btn.innerHTML = '♥';
        btn.style.borderColor = '#e74c3c';
        btn.style.background = 'rgba(231,76,60,0.1)';
        btn.style.color = '#e74c3c';
        showToast('已收藏 ♥', 'success');
      }
    } catch (e) { showToast(e.message, 'error'); }
  }
}

let productDetailPage;
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('productDetail')) {
    productDetailPage = new ProductDetailPage();
  }
});