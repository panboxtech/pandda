// app.js
// Bootstrap robusto: carrega CSS base, garante #app e importa módulos de views usando base path
// para evitar problemas com caminhos relativos duplicados (ex.: pandda/js/js/...).

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

// Carregar CSS base cedo
loadCssOnce('css/styles.css');
loadCssOnce('css/components/modal.css');

// Utility: aguardar DOM pronto
function onDomReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
}

// Calcula base URL do script atual (onde este app.js reside) e retorna função para resolver módulos
const BASE_URL = (() => {
  // import.meta.url funciona em módulos; retorna a URL completa deste script
  // Ex.: https://panboxtech.github.io/pandda/js/app.js
  // Queremos a base para resolver módulos relativos ao diretório do projeto (root do código publicado)
  try {
    const url = new URL('.', import.meta.url).href; // diretório onde app.js está
    // Se seu app.js estiver em /pandda/js/app.js e as views estão em /pandda/js/views/..., você pode:
    // - usar paths relativos a esse diretório (e.g., new URL('views/login.js', BASE_URL))
    // - ou usar paths a partir do root do deploy se preferir.
    return url;
  } catch (e) {
    // fallback: use document.currentScript src se import.meta não disponível (raro em type=module)
    const s = document.currentScript && document.currentScript.src;
    if (s) return s.replace(/\/[^/]*$/, '/') ;
    return './';
  }
})();

function resolveModulePath(modulePath) {
  // modulePath expected as something like "views/login.js" or "./views/login.js" or "js/views/login.js"
  // Normalize to no leading slash
  const normalized = modulePath.replace(/^\//, '');
  // If modulePath looks already absolute (contains protocol) just return it
  if (/^[a-zA-Z0-9-+]+:\/\//.test(normalized)) return normalized;
  // Resolve relative to BASE_URL
  return new URL(normalized, BASE_URL).href;
}

onDomReady(() => {
  const APP_ROOT_SELECTOR = '#app';
  let root = document.querySelector(APP_ROOT_SELECTOR);

  if (!root) {
    console.warn('[app] elemento #app não encontrado — criando elemento fallback automaticamente');
    root = document.createElement('div');
    root.id = 'app';
    document.body.appendChild(root);
  }

  // Defina as rotas usando caminhos relativos AO DIRETÓRIO DE BASE do app.js.
  // Ex.: se suas views estão em js/views/login.js relativo ao app.js, use 'views/login.js' abaixo.
  // Ajuste conforme sua estrutura real.
  const routes = {
    '/': { module: 'views/login.js', mount: 'mountLoginView' },
    '/clients': { module: 'views/clients.js', mount: 'mountClientsView' },
  };

  function clearRoot() {
    root.innerHTML = '';
    const modalRoot = document.querySelector('.modal-root');
    if (modalRoot) {
      modalRoot.classList.remove('active');
      const modalBox = modalRoot.querySelector('.modal');
      if (modalBox) modalBox.innerHTML = '';
    }
  }

  async function navigateTo(path, replace = false) {
    const route = routes[path] || routes['/'];
    try {
      console.log('[navigateTo]', path);
      clearRoot();
      const moduleUrl = resolveModulePath(route.module);
      // dynamic import by absolute/fully resolved URL
      const mod = await import(moduleUrl);
      const mountFn = mod[route.mount];
      if (typeof mountFn !== 'function') {
        console.error('[navigateTo] mount function not found in', moduleUrl, route.mount);
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

  window.addEventListener('popstate', (e) => {
    const path = (e.state && e.state.path) || location.pathname || '/';
    navigateTo(path, true);
  });

  (async function bootstrap() {
    const initialPath = location.pathname || '/';
    console.log('[app] bootstrap initialPath=', initialPath, 'BASE_URL=', BASE_URL);
    await navigateTo(initialPath, true);
  })().catch(err => console.error('[app] bootstrap error', err));

  window.appNavigateTo = navigateTo;
});
