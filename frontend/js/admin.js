// ============================================
// 管理后台 - 完善版（包含商品上架）
// ============================================

class AdminPage {
  constructor() {
    this.currentTab = 'dashboard';
    this.init();
  }

  async init() {
    if (!Auth.requireAdmin()) return;
    this.bindNavigation();
    await this.loadDashboard();
  }

  bindNavigation() {
    document.querySelectorAll('.admin-nav a[data-tab]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchTab(link.dataset.tab);
      });
    });
  }

  switchTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll('.admin-nav a').forEach(l => l.classList.remove('active'));
    document.querySelector(`.admin-nav a[data-tab="${tab}"]`)?.classList.add('active');

    const main = document.getElementById('adminContent');
    if (main) {
      main.style.opacity = '0';
      main.style.transform = 'translateY(10px)';
      setTimeout(() => {
        switch (tab) {
          case 'dashboard': this.loadDashboard(); break;
          case 'products': this.loadProducts(); break;
          case 'add-product': this.showAddProduct(); break;
          case 'orders': this.loadOrders(); break;
          case 'users': this.loadUsers(); break;
        }
        setTimeout(() => {
          main.style.transition = 'all 0.4s ease';
          main.style.opacity = '1';
          main.style.transform = 'translateY(0)';
        }, 50);
      }, 200);
    }
  }

  async loadDashboard() {
    const main = document.getElementById('adminContent');
    if (!main) return;

    try {
      const data = await API.getDashboard();
      
      main.innerHTML = `
        <div class="admin-header">
          <h1>📊 仪表盘</h1>
          <span style="color:var(--text-muted);">欢迎回来，管理员</span>
        </div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-label">用户总数</div>
            <div class="stat-value">${data.stats.totalUsers}</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📦</div>
            <div class="stat-label">产品总数</div>
            <div class="stat-value">${data.stats.totalProducts}</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📋</div>
            <div class="stat-label">订单总数</div>
            <div class="stat-value">${data.stats.totalOrders}</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">💰</div>
            <div class="stat-label">总收入</div>
            <div class="stat-value">¥${data.stats.totalRevenue.toFixed(0)}</div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:30px;">
          <div>
            <h2 style="font-family:var(--font-serif); margin-bottom:20px; font-size:1.2rem;">最近订单</h2>
            ${data.recentOrders.length > 0 ? `
              <table class="admin-table">
                <thead><tr><th>订单号</th><th>用户</th><th>金额</th><th>状态</th></tr></thead>
                <tbody>
                  ${data.recentOrders.slice(0, 5).map(o => `
                    <tr>
                      <td style="font-family:monospace; font-size:0.8rem;">${o.order_no}</td>
                      <td>${o.username}</td>
                      <td style="color:var(--gold); font-weight:600;">¥${o.total_amount.toFixed(0)}</td>
                      <td><span class="status-badge status-${o.status}">${this.statusText(o.status)}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p style="color:var(--text-muted); padding:30px; text-align:center;">暂无订单</p>'}
          </div>
          <div>
            <h2 style="font-family:var(--font-serif); margin-bottom:20px; font-size:1.2rem;">热销产品</h2>
            ${data.topProducts.map((p, i) => `
              <div style="display:flex; align-items:center; gap:16px; padding:14px; border-bottom:1px solid var(--border-color);">
                <span style="font-family:var(--font-serif); font-size:1.3rem; color:var(--gold); width:24px;">${i + 1}</span>
                <div style="flex:1;">
                  <div style="font-weight:500; font-size:0.9rem;">${p.name}</div>
                  <div style="font-size:0.8rem; color:var(--text-muted);">销量: ${p.sales}</div>
                </div>
                <span style="color:var(--gold); font-weight:600;">¥${p.price}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } catch (e) {
      main.innerHTML = '<p style="color:#e74c3c; padding:40px;">加载仪表盘失败</p>';
    }
  }

  async loadProducts() {
    const main = document.getElementById('adminContent');
    if (!main) return;

    try {
      const data = await API.getProducts({ limit: 100 });
      
      main.innerHTML = `
        <div class="admin-header">
          <h1>📦 产品管理</h1>
          <button class="btn btn-primary" onclick="adminPage.switchTab('add-product')">+ 添加新产品</button>
        </div>
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>产品名称</th>
              <th>分类</th>
              <th>价格</th>
              <th>库存</th>
              <th>销量</th>
              <th>推荐</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${data.products.map(p => `
              <tr>
                <td>${p.id}</td>
                <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${p.name}">${p.name}</td>
                <td><span style="color:var(--gold); font-size:0.82rem;">${p.category}</span></td>
                <td style="color:var(--gold); font-weight:600;">¥${p.price}</td>
                <td>${p.stock}</td>
                <td>${p.sales}</td>
                <td>${p.featured ? '<span style="color:#4caf50;">✓ 推荐</span>' : '<span style="color:var(--text-muted);">—</span>'}</td>
                <td>
                  <div style="display:flex; gap:8px;">
                    <button class="btn btn-ghost btn-xs" onclick="adminPage.editProduct(${p.id})">编辑</button>
                    <button class="btn btn-danger btn-xs" onclick="adminPage.deleteProduct(${p.id}, '${p.name.replace(/'/g, "\\'")}')">删除</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (e) {
      main.innerHTML = '<p style="color:#e74c3c; padding:40px;">加载产品列表失败</p>';
    }
  }

  // ★ 商品上架页面
  showAddProduct(editData = null) {
    const main = document.getElementById('adminContent');
    if (!main) return;

    const isEdit = !!editData;
    
    main.innerHTML = `
      <div class="admin-header">
        <h1>${isEdit ? '✏️ 编辑产品' : '➕ 添加新产品'}</h1>
        <button class="btn btn-ghost" onclick="adminPage.switchTab('products')">← 返回产品列表</button>
      </div>
      
      <div style="max-width:800px;">
        <form id="productForm" onsubmit="adminPage.saveProduct(event)" style="display:grid; gap:24px;">
          <input type="hidden" id="editProductId" value="${editData?.id || ''}">
          
          <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:8px; padding:30px;">
            <h3 style="font-family:var(--font-serif); margin-bottom:20px; color:var(--gold);">基本信息</h3>
            <div class="form-group">
              <label>产品名称 *</label>
              <input type="text" id="pName" required placeholder="例如：甲骨文「龙」字书法挂轴" value="${editData?.name || ''}">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>分类 *</label>
                <input type="text" id="pCategory" required placeholder="例如：书法艺术" value="${editData?.category || ''}" list="categoryList">
                <datalist id="categoryList">
                  <option value="书法艺术">
                  <option value="生活器具">
                  <option value="服饰配件">
                  <option value="文房雅器">
                  <option value="创意文具">
                  <option value="篆刻艺术">
                  <option value="益智娱乐">
                </datalist>
              </div>
              <div class="form-group">
                <label>产品图片</label>
                <input type="file" id="pImage" accept="image/*" style="padding:10px;">
              </div>
            </div>
            <div class="form-group">
              <label>产品描述 *</label>
              <textarea id="pDescription" required placeholder="详细描述产品特点和卖点..." style="min-height:120px;">${editData?.description || ''}</textarea>
            </div>
          </div>

          <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:8px; padding:30px;">
            <h3 style="font-family:var(--font-serif); margin-bottom:20px; color:var(--gold);">价格与库存</h3>
            <div class="form-row">
              <div class="form-group">
                <label>售价 (¥) *</label>
                <input type="number" id="pPrice" required step="0.01" min="0" placeholder="298" value="${editData?.price || ''}">
              </div>
              <div class="form-group">
                <label>原价 (¥)（留空则不显示折扣）</label>
                <input type="number" id="pOriginalPrice" step="0.01" min="0" placeholder="398" value="${editData?.original_price || ''}">
              </div>
            </div>
            <div class="form-group">
              <label>库存数量 *</label>
              <input type="number" id="pStock" required min="0" placeholder="100" value="${editData?.stock || ''}">
            </div>
          </div>

          <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:8px; padding:30px;">
            <h3 style="font-family:var(--font-serif); margin-bottom:20px; color:var(--gold);">附加信息</h3>
            <div class="form-group">
              <label>产品规格（用 | 分隔多个规格）</label>
              <input type="text" id="pDetails" placeholder="尺寸：68cm x 138cm | 材质：宣纸 | 工艺：手工装裱" value="${editData?.details || ''}">
            </div>
            <div class="form-group">
              <label style="display:flex; align-items:center; gap:10px; cursor:pointer;">
                <input type="checkbox" id="pFeatured" ${editData?.featured ? 'checked' : ''} style="width:18px; height:18px; accent-color:var(--gold);">
                <span>设为首页推荐产品</span>
              </label>
            </div>
          </div>

          <div style="display:flex; gap:16px;">
            <button type="submit" class="btn btn-primary btn-lg" style="flex:1;">${isEdit ? '保存修改' : '上架产品'}</button>
            <button type="button" class="btn btn-ghost btn-lg" onclick="adminPage.switchTab('products')">取消</button>
          </div>
        </form>
      </div>
    `;
  }

  async editProduct(productId) {
    try {
      const data = await API.getProduct(productId);
      this.showAddProduct(data.product);
    } catch (e) {
      showToast('加载产品信息失败', 'error');
    }
  }

  async saveProduct(e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', document.getElementById('pName').value);
    formData.append('category', document.getElementById('pCategory').value);
    formData.append('description', document.getElementById('pDescription').value);
    formData.append('price', document.getElementById('pPrice').value);
    formData.append('original_price', document.getElementById('pOriginalPrice').value || document.getElementById('pPrice').value);
    formData.append('stock', document.getElementById('pStock').value);
    formData.append('details', document.getElementById('pDetails').value);
    formData.append('featured', document.getElementById('pFeatured').checked ? '1' : '0');

    const imageFile = document.getElementById('pImage')?.files[0];
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      const productId = document.getElementById('editProductId').value;
      if (productId) {
        await API.updateProduct(productId, formData);
        showToast('产品更新成功 ✓', 'success');
      } else {
        await API.addProduct(formData);
        showToast('产品上架成功 🎉', 'success');
      }
      setTimeout(() => this.switchTab('products'), 800);
    } catch (e) {
      showToast('操作失败: ' + (e.message || e.error), 'error');
    }
  }

  async deleteProduct(id, name) {
    if (!confirm(`确定要删除产品「${name}」吗？此操作不可撤销。`)) return;
    try {
      await API.deleteProduct(id);
      showToast('产品已删除', 'success');
      this.loadProducts();
    } catch (e) {
      showToast('删除失败', 'error');
    }
  }

  async loadOrders() {
    const main = document.getElementById('adminContent');
    if (!main) return;

    try {
      const data = await API.getAdminOrders();
      
      main.innerHTML = `
        <div class="admin-header">
          <h1>📋 订单管理</h1>
          <span style="color:var(--text-muted);">共 ${data.orders.length} 个订单</span>
        </div>
        ${data.orders.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📋</div><h3>暂无订单</h3></div>' : `
          <table class="admin-table">
            <thead>
              <tr>
                <th>订单号</th>
                <th>用户</th>
                <th>商品</th>
                <th>金额</th>
                <th>状态</th>
                <th>收货人</th>
                <th>时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              ${data.orders.map(order => `
                <tr>
                  <td style="font-family:monospace; font-size:0.8rem;">${order.order_no}</td>
                  <td>${order.username}</td>
                  <td style="max-width:150px; font-size:0.82rem; color:var(--text-secondary);">
                    ${order.items?.map(i => i.name).join('、') || '-'}
                  </td>
                  <td style="color:var(--gold); font-weight:700;">¥${order.total_amount.toFixed(0)}</td>
                  <td><span class="status-badge status-${order.status}">${this.statusText(order.status)}</span></td>
                  <td>${order.receiver || '-'}</td>
                  <td style="color:var(--text-muted); font-size:0.82rem;">${new Date(order.created_at).toLocaleDateString()}</td>
                  <td>
                    <select onchange="adminPage.updateOrderStatus(${order.id}, this.value)" style="padding:6px 10px; background:var(--bg-secondary); border:1px solid var(--border-color); color:var(--text-primary); border-radius:6px; font-size:0.8rem;">
                      ${['pending','confirmed','shipped','delivered','cancelled'].map(s => `
                        <option value="${s}" ${order.status === s ? 'selected' : ''}>${this.statusText(s)}</option>
                      `).join('')}
                    </select>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      `;
    } catch (e) {
      main.innerHTML = '<p style="color:#e74c3c; padding:40px;">加载订单失败</p>';
    }
  }

  async loadUsers() {
    const main = document.getElementById('adminContent');
    if (!main) return;

    try {
      const data = await API.getAdminUsers();
      
      main.innerHTML = `
        <div class="admin-header">
          <h1>👥 用户管理</h1>
          <span style="color:var(--text-muted);">共 ${data.users.length} 个用户</span>
        </div>
        <table class="admin-table">
          <thead><tr><th>ID</th><th>用户名</th><th>邮箱</th><th>角色</th><th>注册时间</th></tr></thead>
          <tbody>
            ${data.users.map(u => `
              <tr>
                <td>${u.id}</td>
                <td style="font-weight:500;">${u.username}</td>
                <td>${u.email}</td>
                <td><span class="status-badge ${u.role === 'admin' ? 'status-confirmed' : 'status-pending'}">${u.role === 'admin' ? '管理员' : '用户'}</span></td>
                <td style="color:var(--text-muted); font-size:0.85rem;">${new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (e) {
      main.innerHTML = '<p style="color:#e74c3c; padding:40px;">加载用户列表失败</p>';
    }
  }

  async updateOrderStatus(orderId, status) {
    try {
      await API.updateOrderStatus(orderId, status);
      showToast('订单状态已更新 ✓', 'success');
    } catch (e) {
      showToast('更新失败', 'error');
    }
  }

  statusText(status) {
    return { pending:'待处理', confirmed:'已确认', shipped:'已发货', delivered:'已送达', cancelled:'已取消' }[status] || status;
  }
}

let adminPage;
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('adminContent')) {
    adminPage = new AdminPage();
  }
});