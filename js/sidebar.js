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

    // manter foco em itens quando expandir
    if (!sidebar.classList.contains('collapsed')) {
      const firstItem = sidebar.querySelector('.menu-item');
      firstItem && firstItem.focus();
    }
  });
}
