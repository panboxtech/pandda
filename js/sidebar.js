// js/sidebar.js
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
    sidebarCollapse.textContent = sidebar.classList.contains('collapsed') ? '»' : '«';
  });
}
