// js/app.js
import { getSession, signOut } from './auth.js';
import { mountClientsView } from './views/clients.js';
import { mountServersView } from './views/servers.js';
import { mountPlansView } from './views/plans.js';
import { mountAppsView } from './views/apps.js';

const viewRoot = document.getElementById('viewRoot');
const logoutBtn = document.getElementById('logoutBtn');
const userRoleEl = document.getElementById('userRole');

const session = getSession();
if (!session) {
  window.location.href = './index.html';
} else {
  userRoleEl.textContent = `Role: ${session.role}`;
}

const VIEWS = {
  clients: mountClientsView,
  servers: mountServersView,
  plans: mountPlansView,
  apps: mountAppsView
};

document.querySelectorAll('.menu-item').forEach(btn => {
  btn.addEventListener('click', () => {
    const view = btn.getAttribute('data-view');
    navigateTo(view);
    // close mobile sidebar automatically if open
    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
});

navigateTo('clients');

logoutBtn && logoutBtn.addEventListener('click', () => {
  signOut();
});

async function navigateTo(viewKey) {
  const mount = VIEWS[viewKey];
  if (!mount) return;
  while (viewRoot.firstChild) viewRoot.removeChild(viewRoot.firstChild);
  await mount(viewRoot, { session });
  // focus main content for accessibility
  const main = document.getElementById('mainContent');
  main && main.focus();
}
