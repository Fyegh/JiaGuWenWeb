// ============================================
// 购物车 - 完善版
// ============================================

class CartPage {
  constructor() {
    this.items = [];
    this.init();
  }

  async init() {
    if (!Auth.requireLogin()) return;
    await this.loadCart();
  }

  async loadCart() {
    try {
      const data = await API.getCart();
      this.items = data.items;
      this.render();
    } catch (e) {
      showToast('加载购物车失败', 'error');
    }
  }

  render() {
    const container = document.getElementById('cartContent');
    if (!container) return;

    if (this.items.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🛒</div>
          <h3>购物车是空的</h3>
          <p>去看看有什么心仪的文创产品吧</p>
          <a href="/products.html" class="btn btn-primary">去逛逛 →</a>
        </div>
      `;
      return;
    }

    const subtotal = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal >= 299 ? 0 : 15;
    const total = subtotal + shipping;

    container.innerHTML = `
      <div class="cart-container">
        <div class="cart-items">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <h3 style="font-family:var(--font-serif);">购物车商品 (${this.items.length})</h3>
          </div>
          ${this.items.map(item => {
            const oracleChars = ['龍','鳳','禾','鼎','壽','福','祿','喜'];
            const char = oracleChars[item.product_id % oracleChars.length];
            return `
              <div class="cart-item">
                <div class="cart-item-image" style="cursor:pointer;" onclick="navigateToProduct(${item.product_id})">
                  <div class="product-placeholder" style="font-size:2rem; width:100%; height:100%; display:flex; align-items:center; justify-content:center;">${char}</div>
                </div>
                <div>
                  <div class="cart-item-name" style="cursor:pointer;" onclick="navigateToProduct(${item.product_id})">${item.name}</div>
                  <div class="cart-item-price">¥${item.price} / 件</div>
                </div>
                <div class="quantity-selector">
                  <button onclick="cartPage.updateQuantity(${item.product_id}, ${item.quantity - 1})">−</button>
                  <input type="number" value="${item.quantity}" readonly>
                  <button onclick="cartPage.updateQuantity(${item.product_id}, ${item.quantity + 1})">+</button>
                </div>
                <div style="text-align:right; min-width:100px;">
                  <div style="color:var(--gold); font-weight:700; font-size:1.1rem; font-family:var(--font-serif);">¥${(item.price * item.quantity).toFixed(2)}</div>
                  <button class="cart-item-remove" onclick="cartPage.removeItem(${item.product_id})">✕ 删除</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <div class="cart-summary">
          <h3>订单摘要</h3>
          <div class="summary-row">
            <span>商品数量</span>
            <span>${this.items.reduce((s, i) => s + i.quantity, 0)} 件</span>
          </div>
          <div class="summary-row">
            <span>商品总额</span>
            <span>¥${subtotal.toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span>运费</span>
            <span>${shipping === 0 ? '<span style="color:#4caf50;">免运费</span>' : '¥' + shipping.toFixed(2)}</span>
          </div>
          ${shipping > 0 ? `<div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:12px;">再买 ¥${(299 - subtotal).toFixed(0)} 即可免运费</div>` : ''}
          <div class="summary-row total">
            <span>合计</span>
            <span>¥${total.toFixed(2)}</span>
          </div>
          <button class="btn btn-primary btn-lg btn-block" style="margin-top:24px;" onclick="cartPage.showCheckout()">
            去结算
          </button>
          <a href="/products.html" style="display:block; text-align:center; margin-top:16px; font-size:0.85rem; color:var(--text-secondary);">继续购物 →</a>
        </div>
      </div>

      <div class="modal-overlay" id="checkoutModal">
        <div class="modal">
          <div class="modal-header">
            <h2>📦 填写收货信息</h2>
            <button class="modal-close" onclick="cartPage.hideCheckout()">✕</button>
          </div>
          <form onsubmit="cartPage.submitOrder(event)">
            <div class="form-row">
              <div class="form-group">
                <label>收货人 *</label>
                <input type="text" id="receiverInput" required placeholder="姓名">
              </div>
              <div class="form-group">
                <label>联系电话 *</label>
                <input type="tel" id="phoneInput" required placeholder="手机号码">
              </div>
            </div>
            <div class="form-group">
              <label>收货地址 *</label>
              <textarea id="addressInput" required placeholder="省市区 + 详细地址"></textarea>
            </div>
            <div class="form-group">
              <label>备注</label>
              <textarea id="noteInput" placeholder="有什么要告诉我们的？" style="min-height:60px;"></textarea>
            </div>
            <div style="background:rgba(212,175,55,0.05); border:1px solid var(--border-color); border-radius:8px; padding:16px; margin-bottom:24px;">
              <div style="display:flex; justify-content:space-between; font-size:1.1rem; font-weight:700; color:var(--gold);">
                <span>应付总额</span>
                <span>¥${total.toFixed(2)}</span>
              </div>
            </div>
            <button type="submit" class="btn btn-primary btn-lg btn-block">确认下单</button>
          </form>
        </div>
      </div>
    `;
  }

  async updateQuantity(productId, quantity) {
    try {
      if (quantity <= 0) {
        await this.removeItem(productId);
        return;
      }
      await API.updateCartItem(productId, quantity);
      await this.loadCart();
      Auth.updateCartBadge();
    } catch (e) {
      showToast(e.message, 'error');
    }
  }

  async removeItem(productId) {
    try {
      await API.removeFromCart(productId);
      showToast('已移除', 'info');
      await this.loadCart();
      Auth.updateCartBadge();
    } catch (e) {
      showToast(e.message, 'error');
    }
  }

  showCheckout() {
    document.getElementById('checkoutModal')?.classList.add('active');
  }

  hideCheckout() {
    document.getElementById('checkoutModal')?.classList.remove('active');
  }

  async submitOrder(e) {
    e.preventDefault();
    try {
      const result = await API.createOrder({
        receiver: document.getElementById('receiverInput').value,
        phone: document.getElementById('phoneInput').value,
        address: document.getElementById('addressInput').value,
        note: document.getElementById('noteInput').value
      });
      
      this.hideCheckout();
      showToast('🎉 订单创建成功！', 'success');
      
      setTimeout(() => {
        this.loadCart();
        Auth.updateCartBadge();
      }, 1000);
    } catch (e) {
      showToast(e.message, 'error');
    }
  }
}

let cartPage;
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('cartContent')) {
    cartPage = new CartPage();
  }
});