document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initCardReveal();
  initPlanTabs();
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

function initCardReveal() {
  const cards = document.querySelectorAll('.problem-card');
  if (!cards.length) return;

  if (!('IntersectionObserver' in window)) {
    cards.forEach((card) => card.classList.add('in-view'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        const delay = index * 80;
        setTimeout(() => entry.target.classList.add('in-view'), delay);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  cards.forEach((card) => observer.observe(card));
}

const PLAN_PRICING = {
  basic: { mensal: 180, parcelado: 162, avista: 144, setup: 360 },
  plus: { mensal: 290, parcelado: 261, avista: 232, setup: 580 },
  pro: { mensal: 450, parcelado: 405, avista: 360, setup: 900 },
};

function initPlanTabs() {
  const tabs = document.querySelectorAll('.plan-tab');
  const cards = document.querySelectorAll('.price-card[data-plan]');
  if (!tabs.length || !cards.length) return;

  const setMode = (mode) => {
    tabs.forEach((tab) => {
      tab.setAttribute('aria-selected', String(tab.dataset.mode === mode));
    });

    cards.forEach((card) => {
      const plan = PLAN_PRICING[card.dataset.plan];
      if (!plan) return;

      const price = plan[mode];
      const setup = plan.setup;
      const priceTag = card.querySelector('.price-tag');
      const priceDesc = card.querySelector('.price-desc');
      const fidelityTag = card.querySelector('.fidelity-tag');

      if (priceTag) {
        priceTag.innerHTML = 'R$' + price + '<span>/mês</span>';
      }

      if (priceDesc) {
        if (mode === 'avista') {
          priceDesc.textContent = 'Setup de R$' + setup + ' e as 12 mensalidades pagos à vista';
        } else if (mode === 'parcelado') {
          priceDesc.textContent = 'Setup único de R$' + setup + ' (parcelável em até 8x)';
        } else {
          priceDesc.textContent = 'Setup único de R$' + setup + ' (parcelável em até 8x)';
        }
      }

      if (fidelityTag) {
        const hasCommitment = mode !== 'mensal';
        fidelityTag.textContent = hasCommitment ? '12 meses de fidelidade' : 'Sem fidelidade';
        fidelityTag.classList.toggle('no-commitment', !hasCommitment);
      }
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => setMode(tab.dataset.mode));
  });

  setMode('avista');
}
