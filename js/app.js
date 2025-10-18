// app.js
// Bootstrap da aplicação: carrega CSS base, inicializa roteamento simples e monta views.
// Importante: as views (ex.: js/views/clients.js) exportam funções async mountXView(root).

// Helper para carregar CSS dinamicamente (normaliza caminhos e evita duplicação)
function loadCssOnce(href) {
  const normalized = href.replace(/^\//, '');
  if (document.querySelector(`link[data-dyn-href="${normalized}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = normalized;
  link.setAttribute('data-dyn-href', normalized);
  link.addEventListener('load', () => console.log('[loadCssOnce] loaded', normalized));
  link.addEventListener('error', (e) => console.error('[loadCssOnce] failed to load', normalized, e));
  document.head.appendChild(link);
}

// Carrega CSS base e componentes globais imediatamente
loadCssOnce('css/styles.css');
loadCssOnce('css/components/modal.css');

// Root de montagem
const APP_ROOT_SELECTOR = '#app';
const root = document.querySelector(APP_ROOT_SELECTOR);
if (!root) {
  console.error('[app] root element not found:', APP_ROOT_SELECTOR);
  throw new Error('App root not found');
}

// Estado simples de rota
const routes = {
  '/': { name: 'login', module: 'js/views/login.js', mount: 'mountLoginView' },
  '/clients': { name: 'clients', module: 'js/views/clients.js', mount: 'mountClientsView' },
  // Adicione outras rotas aqui conforme necessário
};

// Limpa conteúdo do root e realiza unmount simples (se necessário)
function clearRoot() {
  // opcional: executar cleanup registrado nas views (não implementado), apenas limpa DOM
  root.innerHTML = '';
  // fechar modais residuais se houver
  const modalRoot = document.querySelector('.modal-root');
  if (modalRoot && modalRoot.classList.contains('active')) {
    modalRoot.classList.remove('active');
  }
}

// Navegação programática
async function navigateTo(path, replace = false) {
  const route = routes[path] || routes['/'];
  try {
    console.log('[navigateTo]', path);
    clearRoot();

    // Importa módulo da view dinamicamente
    const mod = await import(`./${route.module}`);
    const mountFn = mod[route.mount];
    if (typeof mountFn !== 'function') {
      console.error('[navigateTo] mount function not found in', route.module, route.mount);
      return;
    }

    // monta a view
    await mountFn(root);

    // atualizar histórico
    if (replace) history.replaceState({ path }, '', path);
    else history.pushState({ path }, '', path);
  } catch (err) {
    console.error('[navigateTo] erro ao carregar view', path, err);
    root.innerHTML = `<div style="padding:20px;color:#b91c1c">Erro ao carregar a página. Veja o console para detalhes.</div>`;
  }
}

// Link de navegação: delegação
document.addEventListener('click', (e) => {
  const a = e.target.closest && e.target.closest('a[data-navigate]');
  if (!a) return;
  e.preventDefault();
  const href = a.getAttribute('href') || '/';
  navigateTo(href);
});

// Popstate (back/forward)
window.addEventListener('popstate', (e) => {
  const path = (e.state && e.state.path) || location.pathname || '/';
  navigateTo(path, true);
});

// Inicialização: montar view inicial com base na rota atual
async function bootstrap() {
  const initialPath = location.pathname || '/';
  // Garante que css/styles.css esteja carregado antes de montar (padrão já solicitado)
  // Opcional: aguardar load do CSS base (não estritamente necessário)
  console.log('[app] bootstrap, initialPath=', initialPath);
  await navigateTo(initialPath, true);
}

// Expor navigateTo globalmente para consoles/tests se necessário
window.appNavigateTo = navigateTo;

// Inicia a app
bootstrap().catch(err => console.error('[app] bootstrap error', err));
