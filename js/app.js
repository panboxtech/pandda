/* js/app.js - loader e shell (corrigido)
   - Garante que, após injetar HTML de uma view, a função de inicialização específica seja chamada
   - Mesmo que o script da view já esteja presente no documento, chamamos init<View>()
   - Corrige resolução de assets: paths que começam com js/ são tratados como relativos à raiz do site
*/

const CONTENT = document.getElementById('content');
const STORAGE_KEY = 'pandda_simple_v2';

function defaultData(){
  const planos = [
    { id:'p1', nome:'Básico', pontos:10, valor:29.9, validade:1 },
    { id:'p2', nome:'Pro', pontos:30, valor:69.9, validade:3 },
    { id:'p3', nome:'Anual', pontos:120, valor:199.9, validade:12 },
  ];
  const servidores = [
    { id:'s1', nome:'Servidor Alpha', url1:'https://alpha.example' },
    { id:'s2', nome:'Servidor Beta', url1:'https://beta.example' },
    { id:'s3', nome:'Servidor Gamma', url1:'https://gamma.example' },
  ];
  const base = new Date();
  const clients = [
    { id:'c1', nome:'Ana Silva', whatsapp:'+5591988887777', dataCriacao:'', dataVencimento:new Date(base.getFullYear(), base.getMonth()+1, base.getDate()).toISOString().slice(0,10), planoId:'p1', servidor1:'s1', statusNotificacao:true, observacoes:'VIP', bloqueado:false},
    { id:'c2', nome:'Bruno Costa', whatsapp:'+5591999991111', dataCriacao:'', dataVencimento:new Date(base.getTime()+1000*60*60*24*3).toISOString().slice(0,10), planoId:'p2', servidor1:'s2', statusNotificacao:false, observacoes:'', bloqueado:false},
    { id:'c3', nome:'Carla Nunes', whatsapp:'+5591983332222', dataCriacao:'', dataVencimento:new Date(base.getTime()-1000*60*60*24*2).toISOString().slice(0,10), planoId:'p1', servidor1:'s3', statusNotificacao:false, observacoes:'', bloqueado:false},
  ];
  return { planos, servidores, clientes: clients };
}
function loadState(){ const raw = localStorage.getItem(STORAGE_KEY); if (!raw) { const d = defaultData(); saveState(d); return d; } try { return JSON.parse(raw); } catch(e){ const d=defaultData(); saveState(d); return d; } }
function saveState(s){ localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }

window.DB = loadState();

function normalizeUrl(base, relative){ try { return new URL(relative, base).toString(); } catch(e){ return relative; } }
function loadScriptAbsolute(src){
  return new Promise((resolve,reject)=>{
    // if script already present, resolve immediately (we will still call init)
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

/* Extract simple view name from path: views/clientes.html -> clientes */
function viewNameFromPath(path){
  try {
    return path.split('/').pop().split('.').shift();
  } catch(e){
    return null;
  }
}

/* Call the init function for a view:
   priority:
   - global function named init<CapitalizedView>() e.g. initClientes
   - window.viewInit (fallback, view can set this)
*/
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
    // no init found — fine
  } catch(e){
    console.error('Erro ao executar init da view', fn, e);
  }
}

/* Resolve asset URL with special-case rules:
   - absolute urls (http(s):// or //) returned as-is
   - root-relative (/...) resolved from site origin
   - paths starting with js/ or ./js/ or ../js/ are treated as site-root relative (/js/...)
   - otherwise resolved relative to the view's baseUrl
*/
function resolveAssetUrl(baseUrl, assetPath){
  if (!assetPath) return assetPath;
  // absolute URL (http/https or protocol-relative)
  if (/^(https?:)?\/\//i.test(assetPath)) return assetPath;
  // root-relative path (starts with '/')
  if (assetPath.startsWith('/')) return normalizeUrl(window.location.origin + '/', assetPath);
  // treat js/ (and ./js/ ../js/) as root-relative to site (avoid prefixing with views/)
  if (/^(\.\/|\.\.\/)?js\//.test(assetPath)) {
    const clean = assetPath.replace(/^\.\//, '').replace(/^\.\.\//, '').replace(/^\/+/, '');
    return normalizeUrl(window.location.origin + '/', clean);
  }
  // otherwise resolve relative to the view's base URL
  return normalizeUrl(baseUrl, assetPath);
}

/* loadView: load html, css, scripts; inject and then call init function */
async function loadView(path){
  if (!CONTENT) throw new Error('#content não encontrado');
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error('HTTP '+res.status+' ao buscar '+path);
    const html = await res.text();

    const temp = document.createElement('div');
    temp.innerHTML = html;

    const baseUrl = new URL(path, window.location.href).toString();

    // links and scripts inside view
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

    // inject HTML
    CONTENT.innerHTML = temp.innerHTML;

    // wait CSS
    await Promise.all(cssPromises);

    // load scripts sequentially (if not loaded), but even if loaded we will call init after
    for (const s of scriptSrcs){
      await loadScriptAbsolute(s).catch(err => {
        console.warn('Falha ao carregar script da view:', s, err);
      });
    }

    // ensure init is always called (fixes "click same menu and handlers missing")
    const view = viewNameFromPath(path);
    // small delay to ensure any inline script executed
    setTimeout(()=> callViewInit(view), 0);

    return;
  } catch(err){
    CONTENT.innerHTML = `<div style="padding:20px;color:#500;background:#fff7f7;border-radius:8px">Erro ao carregar a view: ${err.message || err}</div>`;
    throw err;
  }
}

/* Sidebar injection and bindings (same behavior: injected only after login) */
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
  // ensure default view (clientes) loaded after injection
  loadView('views/clientes.html').catch(e => console.error(e));
}

function bindSidebar(){
  document.querySelectorAll('#sidebar .nav-btn').forEach(b=>{
    b.addEventListener('click', async () => {
      const path = b.dataset.view;
      try {
        await loadView(path);
      } catch(e){
        console.error('Erro ao carregar view via sidebar:', e);
      }
      // mobile: close overlay
      const sb = document.getElementById('sidebar');
      if (sb && window.matchMedia('(max-width:880px)').matches) sb.classList.remove('open');
    });
  });

  const logout = document.getElementById('logoutBtn');
  if (logout) logout.addEventListener('click', ()=> {
    const sb = document.getElementById('sidebar'); sb && sb.remove();
    hideTopbarAndResetContent();
    loadView('views/login.html').catch(e => console.error(e));
  });
}

/* Topbar and content helpers */
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
function bindTopbarToggle(){
  const tb = document.getElementById('sidebarToggle');
  if (!tb) return;
  const newTb = tb.cloneNode(true);
  tb.parentNode.replaceChild(newTb, tb);
  newTb.addEventListener('click', ()=>{
    const sb = document.getElementById('sidebar'); if (!sb) return;
    if (window.matchMedia('(max-width:880px)').matches) sb.classList.toggle('open');
    else {
      sb.classList.toggle('collapsed');
      const contentRoot = document.getElementById('content');
      if (contentRoot) {
        if (sb.classList.contains('collapsed')) contentRoot.classList.add('collapsed'); else contentRoot.classList.remove('collapsed');
      }
    }
  });
}

/* modal */
function openModal(content){ const modal = document.getElementById('modal'), panel = document.getElementById('modalContent'); if(!modal||!panel) return; panel.innerHTML=''; if(content instanceof Node) panel.appendChild(content); else panel.innerHTML = String(content); modal.classList.remove('hidden'); }
function closeModal(){ const modal=document.getElementById('modal'); if(!modal) return; modal.classList.add('hidden'); document.getElementById('modalContent').innerHTML=''; }
document.getElementById('modalClose')?.addEventListener('click', closeModal);
document.getElementById('modal')?.addEventListener('click',(e)=> { if(e.target === document.getElementById('modal')) closeModal(); });

/* start: load login */
(async function start(){
  try { await loadView('views/login.html'); } catch(e){ console.error('Falha ao carregar view inicial:', e); }
})();

/* expose API */
window.app = {
  injectSidebar,
  loadView,
  openModal,
  closeModal,
  saveState: ()=> saveState(window.DB),
  getDB: ()=> window.DB
};
