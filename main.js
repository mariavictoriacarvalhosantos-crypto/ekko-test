document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initCardReveal();
  initCarousels();
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

/**
 * Carrossel reutilizável: um slide por vez, com animação de slide + fade,
 * bolinhas clicáveis, setas (desktop), swipe (touch) e setas do teclado.
 * Marque o container com [data-carousel] e cada slide com .carousel-slide.
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
  const count = slides.length;
  if (!viewport || !count) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let index = 0;

  // Contadores "1 de N" dentro de cada slide, se existirem.
  root.querySelectorAll('[data-step-counter]').forEach((el, i) => {
    el.textContent = (i + 1) + ' de ' + count;
  });

  // Bolinhas de navegação, geradas a partir da quantidade real de slides.
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
    slides.forEach((slide) => {
      max = Math.max(max, slide.offsetHeight);
    });
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
      // eslint-disable-next-line no-unused-expressions
      active.offsetHeight;
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
    if (prevBtn) prevBtn.setAttribute('aria-label', 'Anterior');
    if (nextBtn) nextBtn.setAttribute('aria-label', 'Próximo');
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

  root.setAttribute('tabindex', root.getAttribute('tabindex') || '0');
  root.addEventListener('keydown', (e) => {
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
