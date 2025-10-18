// app.js
// Bootstrap simples e robusto: carrega CSS base, aguarda DOM e garante existência de #app.

// Carrega uma folha de estilo uma única vez (normaliza caminho relativo)
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

// Carregar CSS base imediatamente para evitar flash sem estilo
loadCssOnce('css/styles.css');

// Aguarda DOM pronto antes de inicializar a aplicação
function onDomReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
}

onDomReady(() => {
  const APP_ROOT_SELECTOR = '#app';
  let root = document.querySelector(APP_ROOT_SELECTOR);

  // Se não existir, cria um container #app no body para evitar falha de inicialização
  if (!root) {
    console.warn('[app] elemento #app não encontrado — criando elemento fallback automaticamente');
    root = document.createElement('div');
    root.id = 'app';
    document.body.appendChild(root);
  }

  // Roteamento mínimo para demonstração (substitua/expanda conforme necessário)
  const routes = {
    '/': { module: 'js/views/login.js', mount: 'mountLoginView' },
    '/clients': { module: 'js/views/clients.js', mount: 'mountClientsView' },
  };

  // Limpa o root (simple unmount)
  function clearRoot() {
    root.innerHTML = '';
    const modalRoot = document.querySelector('.modal-root');
    if (modalRoot) {
      modalRoot.classList.remove('active');
      const modalBox = modalRoot.querySelector('.modal');
      if (modalBox) modalBox.innerHTML = '';
    }
  }

  // Navega para uma rota; carrega o módulo dinamicamente
  async function navigateTo(path, replace = false) {
    const route = routes[path] || routes['/'];
    try {
      console.log('[navigateTo]', path);
      clearRoot();
      const mod = await import(`./${route.module}`);
      const mountFn = mod[route.mount];
      if (typeof mountFn !== 'function') {
        console.error('[navigateTo] mount function not found in', route.module, route.mount);
        root.innerHTML = `<div style="padding:16px;color:#b91c1c">Erro ao carregar a página. Veja o console.</div>`;
        return;
      }
      await mountFn(root);
      if (replace) history.replaceState({ path }, '', path);
      else history.pushState({ path }, '', path);
    } catch (err) {
      console.error('[navigateTo] erro ao carregar view', path, err);
      root.innerHTML = `<div style="padding:16px;color:#b91c1c">Erro ao carregar a página. Veja o console.</div>`;
    }
  }

  // Delegação para links com data-navigate
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[data-navigate]');
    if (!a) return;
    e.preventDefault();
    const href = a.getAttribute('href') || '/';
    navigateTo(href);
  });

  // Voltar / avançar
  window.addEventListener('popstate', (e) => {
    const path = (e.state && e.state.path) || location.pathname || '/';
    navigateTo(path, true);
  });

  // Inicialização: navega para a rota atual
  (async function bootstrap() {
    const initialPath = location.pathname || '/';
    console.log('[app] bootstrap initialPath=', initialPath);
    await navigateTo(initialPath, true);
  })().catch(err => console.error('[app] bootstrap error', err));

  // Expor função para navegação manual se necessário
  window.appNavigateTo = navigateTo;
});
