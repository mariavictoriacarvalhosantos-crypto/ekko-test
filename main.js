document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initCarousels();
  initPaymentTabs();
});

function initMobileMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.mobile-menu');
  if (!toggle || !menu) return;

  const closeMenu = () => {
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });
}

/**
 * Carrossel reutilizável: um slide por vez, slide horizontal + fade (56px,
 * 450ms), bolinhas clicáveis, setas ao lado do card, swipe no celular e
 * setas do teclado. Marque o container com [data-carousel].
 */
function initCarousels() {
  document.querySelectorAll('[data-carousel]').forEach(initCarousel);
}

function initCarousel(root) {
  const viewport = root.querySelector('.carousel-viewport');
  const slides = Array.from(root.querySelectorAll('.carousel-slide'));
  const dotsWrap = root.querySelector('.carousel-dots');
  const prevBtn = root.querySelector('.carousel-arrow.prev');
  const nextBtn = root.querySelector('.carousel-arrow.next');
  const focusTarget = root.querySelector('.carousel-row') || root;
  const count = slides.length;
  if (!viewport || !count) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let index = 0;

  root.querySelectorAll('[data-step-counter]').forEach((el, i) => {
    el.textContent = (i + 1) + ' de ' + count;
  });

  const dots = [];
  if (dotsWrap) {
    dotsWrap.innerHTML = '';
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel-dot';
      dot.setAttribute('aria-label', 'Ir para o item ' + (i + 1) + ' de ' + count);
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
      dots.push(dot);
    });
  }

  function recalcHeight() {
    let max = 0;
    slides.forEach((slide) => { max = Math.max(max, slide.offsetHeight); });
    viewport.style.height = max + 'px';
  }

  function render(direction) {
    const prevIndex = slides.findIndex((s) => s.classList.contains('is-active'));
    slides.forEach((slide, i) => {
      slide.classList.remove('enter-left', 'enter-right', 'exit-left', 'exit-right');
      if (i === index) return;
      slide.classList.remove('is-active');
    });

    const active = slides[index];

    if (prevIndex === -1 || reduceMotion) {
      active.classList.add('is-active');
    } else if (prevIndex !== index) {
      const outgoing = slides[prevIndex];
      outgoing.classList.remove('is-active');
      outgoing.classList.add(direction === 'next' ? 'exit-left' : 'exit-right');
      active.classList.add(direction === 'next' ? 'enter-right' : 'enter-left');
      // força o navegador a registrar o estado inicial antes de animar
      void active.offsetHeight;
      requestAnimationFrame(() => {
        active.classList.remove('enter-right', 'enter-left');
        active.classList.add('is-active');
      });
      setTimeout(() => {
        outgoing.classList.remove('exit-left', 'exit-right');
      }, 500);
    } else {
      active.classList.add('is-active');
    }

    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
  }

  function goTo(newIndex) {
    const next = (newIndex + count) % count;
    if (next === index) return;
    let direction;
    if (index === count - 1 && next === 0) direction = 'next';
    else if (index === 0 && next === count - 1) direction = 'prev';
    else direction = next > index ? 'next' : 'prev';
    index = next;
    render(direction);
  }

  if (prevBtn) prevBtn.addEventListener('click', () => goTo(index - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(index + 1));

  focusTarget.setAttribute('tabindex', focusTarget.getAttribute('tabindex') || '0');
  focusTarget.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(index - 1); }
  });

  let touchStartX = null;
  viewport.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  viewport.addEventListener('touchend', (e) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) {
      dx < 0 ? goTo(index + 1) : goTo(index - 1);
    }
    touchStartX = null;
  });

  recalcHeight();
  render('next');

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(recalcHeight, 150);
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(recalcHeight).catch(() => {});
  }
}

/**
 * Abas de forma de pagamento (Mensal / Anual parcelado / Anual à vista):
 * trocam o preço, o texto do setup e a etiqueta de fidelidade dos 3 cards
 * de plano. Valores vêm de CHURCH_PLANS (mesmos do reference ChurchPage).
 */
const CHURCH_PLANS = {
  pro: { setup: 'R$900', m: 'R$450', ap: 'R$405', av: 'R$5.040', avOld: 'R$6.300' },
  plus: { setup: 'R$580', m: 'R$290', ap: 'R$261', av: 'R$3.248', avOld: 'R$4.060' },
  basic: { setup: 'R$360', m: 'R$180', ap: 'R$162', av: 'R$2.016', avOld: 'R$2.520' },
};

function initPaymentTabs() {
  const tabs = document.querySelectorAll('.pay-tab');
  const cards = document.querySelectorAll('.price-card[data-plan]');
  const descEl = document.querySelector('.pay-desc');
  if (!tabs.length || !cards.length) return;

  const descriptions = {
    m: 'Valor cheio, sem fidelidade. Cancele quando quiser.',
    ap: 'Fidelidade de 12 meses, cobrado mês a mês no cartão, com 10% de desconto na mensalidade.',
    av: 'Paga o setup e as 12 mensalidades de uma vez, com 20% de desconto na mensalidade.',
  };

  function setMode(mode) {
    tabs.forEach((tab) => {
      tab.setAttribute('aria-selected', String(tab.dataset.mode === mode));
    });

    if (descEl) descEl.textContent = descriptions[mode];

    cards.forEach((card) => {
      const plan = CHURCH_PLANS[card.dataset.plan];
      if (!plan) return;

      const oldEl = card.querySelector('.price-old');
      const amountEl = card.querySelector('.price-amount');
      const unitEl = card.querySelector('.price-unit');
      const setupEl = card.querySelector('.setup-line');
      const fidelityEl = card.querySelector('.fidelity-tag');

      const showOld = mode !== 'm';
      if (oldEl) {
        oldEl.hidden = !showOld;
        oldEl.textContent = mode === 'av' ? plan.avOld : plan.m;
      }

      if (amountEl) amountEl.textContent = mode === 'av' ? plan.av : plan[mode];
      if (unitEl) unitEl.textContent = mode === 'av' ? 'à vista' : '/mês';

      if (setupEl) {
        setupEl.textContent = mode === 'av'
          ? 'Setup incluso no valor'
          : 'Setup único de ' + plan.setup + ' (parcelável em até 3x)';
      }

      if (fidelityEl) fidelityEl.hidden = mode === 'm';
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => setMode(tab.dataset.mode));
  });

  const initial = document.querySelector('.pay-tab[aria-selected="true"]');
  setMode(initial ? initial.dataset.mode : 'ap');
}
