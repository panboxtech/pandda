// js/sidebar.js
// Controla abertura/fechamento do menu em mobile e minimização no desktop.

const sidebar = document.getElementById('sidebar');
const mobileToggle = document.getElementById('mobileMenuToggle');
const sidebarCollapse = document.getElementById('sidebarCollapse');

if (mobileToggle) {
  mobileToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    if (sidebar.classList.contains('open')) {
      const firstItem = sidebar.querySelector('.menu-item');
      firstItem && firstItem.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  });

  // fecha ao clicar fora
  document.addEventListener('click', (e) => {
    if (!sidebar.classList.contains('open')) return;
    const isClickInside = sidebar.contains(e.target) || mobileToggle.contains(e.target);
    if (!isClickInside) {
      sidebar.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
}

if (sidebarCollapse) {
  sidebarCollapse.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    // trocar ícone visual do botão
    sidebarCollapse.textContent = sidebar.classList.contains('collapsed') ? '»' : '«';

    // Ao colapsar, mover foco para o botão de collapse (acessibilidade)
    if (sidebar.classList.contains('collapsed')) {
      sidebarCollapse.focus();
    } else {
      // ao expandir, focar primeiro item do menu
      const firstItem = sidebar.querySelector('.menu-item');
      firstItem && firstItem.focus();
    }
  });
}

// A11y: permitir navegar com teclado e mostrar tooltip via title quando colapsado
document.querySelectorAll('.menu-item').forEach(btn => {
  // set title to label content for tooltip when collapsed
  const labelEl = btn.querySelector('.menu-label');
  if (labelEl) btn.setAttribute('title', labelEl.textContent);
});
