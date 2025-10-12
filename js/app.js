const CONTENT = document.getElementById('content');
const STORAGE_KEY = 'pandda_simple_v2';

/* Determina base do app (suporta GitHub Pages em /repo/ e sites em raiz) */
window.APP_BASE = (function(){
  const baseTag = document.querySelector('base');
  if (baseTag && baseTag.href) return baseTag.href;
  // keep trailing slash
  const path = window.location.pathname.replace(/\/[^\/]*$/, '/');
  return window.location.origin + path;
})();

/* Usa dados mock externos se não houver dados salvos */
function defaultData(){
  return window.MockData || { planos: [], servidores: [], clientes: [] };
}
function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const d = defaultData();
    saveState(d);
    return d;
  }
  try {
    return JSON.parse(raw);
  } catch(e){
    const d = defaultData();
    saveState(d);
    return d;
  }
}
function saveState(s){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

/* Utilitários de carregamento */
function normalizeUrl(base, relative){
  try {
    return new URL(relative, base).toString();
  } catch(e){
    return relative;
  }
}
function loadScriptAbsolute(src){
  return new Promise((resolve,reject)=>{
    const exists = Array.from(document.scripts).some(s=>s.src === src);
    if (exists) return resolve(src);
    const s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.onload = () => resolve(src);
    s.onerror = () => reject(new Error('Falha ao carregar script: '+src));
    document.body.appendChild(s);
  });
}
function loadCssAbsolute(href){
  return new Promise((resolve)=>{
    const exists = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(l=>l.href === href);
    if (exists) return resolve(href);
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    l.onload = () => resolve(href);
    l.onerror = () => { console.warn('Falha ao carregar CSS:',href); resolve(href); };
    document.head.appendChild(l);
  });
}

/* Corrige caminhos de assets usando APP_BASE quando apropriado */
function resolveAssetUrl(baseUrl, assetPath){
  if (!assetPath) return assetPath;
  if (/^(https?:)?\/\//i.test(assetPath)) return assetPath;
  if (assetPath.startsWith('/')) {
    // caminho absoluto a partir da origem
    return new URL(assetPath, window.location.origin).toString();
  }
  // tratar "js/..." e "css/..." como relativos à base do app (index)
  if (/^(\.\/|\.\.\/)?(js|css)\//.test(assetPath)) {
    const clean = assetPath.replace(/^(\.\/|\.\.\/)/, '');
    return new URL(clean, window.APP_BASE).toString();
  }
  // caso padrão: relativo à view/baseUrl
  return new URL(assetPath, baseUrl).toString();
}

/* Nome da view a partir do caminho */
function viewNameFromPath(path){
  try {
    return path.split('/').pop().split('.').shift();
  } catch(e){
    return null;
  }
}

/* Chama função init da view */
function callViewInit(view){
  if (!view) return;
  const cap = view.charAt(0).toUpperCase() + view.slice(1);
  const fn = 'init' + cap;
  try {
    if (typeof window[fn] === 'function') {
      window[fn]();
      return;
    }
    if (typeof window.viewInit === 'function') {
      window.viewInit();
      return;
    }
  } catch(e){
    console.error('Erro ao executar init da view', fn, e);
  }
}

/* Carrega view HTML + assets + init */
async function loadView(path){
  if (!CONTENT) throw new Error('#content não encontrado');
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error('HTTP '+res.status+' ao buscar '+path);
    const html = await res.text();

    const temp = document.createElement('div');
    temp.innerHTML = html;

    const baseUrl = new URL(path, window.location.href).toString();

    const links = Array.from(temp.querySelectorAll('link[rel="stylesheet"]'));
    const cssPromises = links.map(l => {
      const href = l.getAttribute('href');
      const abs = resolveAssetUrl(baseUrl, href);
      l.remove();
      return loadCssAbsolute(abs);
    });

    const scripts = Array.from(temp.querySelectorAll('script[src]'));
    const scriptSrcs = scripts.map(s => {
      const src = s.getAttribute('src');
      const abs = resolveAssetUrl(baseUrl, src);
      s.remove();
      return abs;
    });

    CONTENT.innerHTML = temp.innerHTML;
    await Promise.all(cssPromises);

    for (const s of scriptSrcs){
      await loadScriptAbsolute(s).catch(err => {
        console.warn('Falha ao carregar script da view:', s, err);
      });
    }

    const view = viewNameFromPath(path);
    setTimeout(()=> callViewInit(view), 0);
    return;
  } catch(err){
    CONTENT.innerHTML = `<div style="padding:20px;color:#500;background:#fff7f7;border-radius:8px">Erro ao carregar a view: ${err.message || err}</div>`;
    throw err;
  }
}

/* Sidebar */
function injectSidebar(){
  if (document.getElementById('sidebar')) return;
  const aside = document.createElement('aside');
  aside.id = 'sidebar';
  aside.innerHTML = `
    <div class="sidebar-top">
      <div class="logo-mini">PANDDA</div>
      <nav>
        <button class="nav-btn" data-view="views/clientes.html">Clientes</button>
        <button class="nav-btn" data-view="views/planos.html">Planos</button>
        <button class="nav-btn" data-view="views/servidores.html">Servidores</button>
      </nav>
    </div>
    <div class="sidebar-bottom"><button id="logoutBtn" class="link-like">Sair</button></div>
  `;
  document.body.insertBefore(aside, document.getElementById('app'));
  bindSidebar();
  showTopbarAndShiftContent();
  loadView('views/clientes.html').catch(e => console.error(e));
}

function bindSidebar(){
  document.querySelectorAll('#sidebar .nav-btn').forEach(b=>{
    b.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      const path = b.dataset.view;
      try {
        await loadView(path);
      } catch(e){
        console.error('Erro ao carregar view via sidebar:', e);
      }
      const sb = document.getElementById('sidebar');
      if (sb && window.matchMedia('(max-width:880px)').matches) sb.classList.remove('open');
    });
  });

  const logout = document.getElementById('logoutBtn');
  if (logout) logout.addEventListener('click', (ev)=> {
    ev.stopPropagation();
    const sb = document.getElementById('sidebar'); sb && sb.remove();
    hideTopbarAndResetContent();
    // limpa DB e volta para login (opcional)
    window.DB = defaultData();
    loadView('views/login.html').catch(e => console.error(e));
  });
}

/* Topbar helpers */
function showTopbarAndShiftContent(){
  const topbar = document.getElementById('topbar');
  if (topbar) topbar.classList.remove('hidden');
  const contentRoot = document.getElementById('content');
  if (contentRoot) contentRoot.classList.add('content-with-sidebar');
  bindTopbarToggle();
}
function hideTopbarAndResetContent(){
  const topbar = document.getElementById('topbar');
  if (topbar) topbar.classList.add('hidden');
  const contentRoot = document.getElementById('content');
  if (contentRoot) {
    contentRoot.classList.remove('content-with-sidebar');
    contentRoot.classList.remove('collapsed');
  }
}
function isDescendant(root, node){
  if (!root || !node) return false;
  return root === node || root.contains(node);
}
function bindTopbarToggle(){
  const tb = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  if (!tb || !sidebar) return;

  const newTb = tb.cloneNode(true);
  tb.parentNode.replaceChild(newTb, tb);

  newTb.addEventListener('click', (ev)=>{
    ev.stopPropagation();
    if (window.matchMedia('(max-width:880px)').matches) {
      sidebar.classList.toggle('open');
      return;
    }
    sidebar.classList.toggle('collapsed');
    const contentRoot = document.getElementById('content');
    if (contentRoot) {
      if (sidebar.classList.contains('collapsed')) contentRoot.classList.add('collapsed');
      else contentRoot.classList.remove('collapsed');
    }
  });

  if (!window.__sidebarOutsideClickBound) {
    document.addEventListener('click', (ev) => {
      if (window.matchMedia('(max-width:880px)').matches) return;
      const sb = document.getElementById('sidebar');
      if (!sb) return;
      if (sb.classList.contains('collapsed')) return;

      const topbar = document.getElementById('topbar');
      const modal = document.getElementById('modal');

      if (isDescendant(sb, ev.target)) return;
      if (isDescendant(topbar, ev.target)) return;
      if (isDescendant(modal, ev.target)) return;

      sb.classList.add('collapsed');
      const contentRoot = document.getElementById('content');
      if (contentRoot) contentRoot.classList.add('collapsed');
    }, { capture: true });
    window.__sidebarOutsideClickBound = true;
  }

  window.addEventListener('resize', () => {
    const sb = document.getElementById('sidebar');
    const contentRoot = document.getElementById('content');
    if (!sb) return;
    if (window.matchMedia('(max-width:880px)').matches) {
      sb.classList.remove('collapsed');
      if (contentRoot) contentRoot.classList.remove('collapsed');
    } else {
      if (sb.classList.contains('collapsed')) {
        if (contentRoot) contentRoot.classList.add('collapsed');
      } else {
        if (contentRoot) contentRoot.classList.remove('collapsed');
      }
    }
  });
}

/* Modal */
function openModal(content){
  const modal = document.getElementById('modal');
  const panel = document.getElementById('modalContent');
  if (!modal || !panel) return;
  panel.innerHTML = '';
  if (content instanceof Node) {
    panel.appendChild(content);
  } else {
    panel.innerHTML = String(content);
  }
  modal.classList.remove('hidden');
}
function closeModal(){
  const modal = document.getElementById('modal');
  if (!modal) return;
  modal.classList.add('hidden');
  const panel = document.getElementById('modalContent');
  if (panel) panel.innerHTML = '';
}
document.getElementById('modalClose')?.addEventListener('click', closeModal);
document.getElementById('modal')?.addEventListener('click', (e) => {
  if (e.target === document.getElementById('modal')) closeModal();
});

/* Função a ser chamada após login bem-sucedido
   - carrega js/mock-data.js a partir de APP_BASE
   - inicializa window.DB
   - injeta sidebar e carrega a view inicial
*/
window.app = window.app || {};
window.app.afterLogin = async function afterLogin(){
  try {
    // carrega mock-data apenas agora
    if (!window.MockData) {
      const mockUrl = new URL('js/mock-data.js', window.APP_BASE).toString();
      try {
        await loadScriptAbsolute(mockUrl);
      } catch(e){
        console.warn('Falha ao carregar mock-data em', mockUrl, e);
      }
    }

    // inicializa DB agora que mock-data foi tentado
    window.DB = loadState();

    // injeta sidebar e abre view inicial
    injectSidebar();
  } catch(e){
    console.error('Erro em afterLogin:', e);
  }
};

/* start: carrega somente a view de login (não carrega mock-data automaticamente) */
(async function start(){
  try {
    await loadView('views/login.html');
  } catch(e){
    console.error('Falha ao carregar view inicial:', e);
  }
})();
