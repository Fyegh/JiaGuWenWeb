// ============================================
// 动画引擎 v3.0
// ============================================

class AnimationEngine {
  constructor() {
    this.setupScrollObserver();
    this.setupNavScroll();
    this.setupLoadingScreen();
  }

  setupScrollObserver() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-visible');
          this.observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      this.observer.observe(el);
    });
  }

  observeNewElements() {
    document.querySelectorAll('.animate-on-scroll:not(.animate-visible)').forEach(el => {
      this.observer.observe(el);
    });
  }

  setupNavScroll() {
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const navbar = document.querySelector('.navbar');
      if (!navbar) return;
      const current = window.scrollY;
      if (current > 50) navbar.classList.add('scrolled');
      else navbar.classList.remove('scrolled');
      lastScroll = current;
    }, { passive: true });
  }

  setupLoadingScreen() {
    const loading = document.querySelector('.loading-screen');
    if (loading) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          loading.classList.add('hidden');
          setTimeout(() => loading.remove(), 800);
        }, 600);
      });
      // 备用：3秒后强制关闭
      setTimeout(() => {
        if (loading.parentNode) {
          loading.classList.add('hidden');
          setTimeout(() => { if (loading.parentNode) loading.remove(); }, 800);
        }
      }, 3000);
    }
  }

  static animateNumber(el, target, duration = 2000) {
    const start = 0;
    const startTime = Date.now();
    const isPlus = target >= 10000;
    
    function update() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(start + (target - start) * eased);
      
      el.textContent = current.toLocaleString() + (isPlus ? '+' : '+');
      
      if (progress < 1) requestAnimationFrame(update);
    }
    
    requestAnimationFrame(update);
  }

  static staggerCards(cards, delay = 80) {
    cards.forEach((card, i) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      setTimeout(() => {
        card.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, i * delay);
    });
  }
}

// 动画CSS注入
const animCSS = document.createElement('style');
animCSS.textContent = `
  .animate-on-scroll {
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .animate-on-scroll.animate-visible {
    opacity: 1;
    transform: translateY(0);
  }
  .delay-1 { transition-delay: 0.1s !important; }
  .delay-2 { transition-delay: 0.2s !important; }
  .delay-3 { transition-delay: 0.3s !important; }
  .delay-4 { transition-delay: 0.4s !important; }
  .delay-5 { transition-delay: 0.5s !important; }
`;
document.head.appendChild(animCSS);

// 全局初始化
let animEngine;
document.addEventListener('DOMContentLoaded', () => {
  animEngine = new AnimationEngine();
  window.animEngine = animEngine;
});