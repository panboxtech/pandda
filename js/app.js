/* js/app.js - atualizado
   - Depois de carregar a view, tenta chamar função init<NomeView>() automaticamente
     (ex.: views/clientes.html -> initClientes())
   - Isso garante que a listagem e handlers sejam sempre inicializados, mesmo ao recarregar
     a mesma view clicando no menu lateral.
   - Mantém loader de scripts/css, injeção do sidebar e API window.app.
*/

const CONTENT = document.getElementById('content');
const STORAGE_KEY = 'pandda_simple_v2';

/* -------------------------
   Mock data helpers
   ------------------------- */
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

/* -------------------------
   Asset loader utils
   ------------------------- */
function normalizeUrl(base, relative){ try { return new URL(relative, base).toString(); } catch(e){ return relative; } }
function loadScriptAbsolute(src){
  return new Promise((resolve,reject)=>{
    // Avoid loading same script multiple times: if already present, resolve immediately
    const existing = Array.from(document.scripts).find(s => s.src === src);
    if (existing) return resolve(src);

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
    // Avoid duplicate links
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

/* -------------------------
   loadView(path)
   - carrega HTML, injeta no CONTENT
   - carrega CSS e scripts referenciados na view (resolvidos em relação à view)
   - ao final tenta chamar init<NomeView>() automaticamente
     ex.: views/clientes.html -> initClientes()
*/
async function loadView(path){
  if (!CONTENT) throw new Error('#content não encontrado');
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error('HTTP '+res.status+' ao buscar '+path);
    const html = await res.text();

    // parse em container temporário
    const temp = document.createElement('div');
    temp.innerHTML = html;

    const baseUrl = new URL(path, window.location.href).toString();

    // processar links CSS dentro da view
    const links = Array.from(temp.querySelectorAll('link[rel="stylesheet"]'));
    const cssPromises = links.map(l=> {
      const href = l.getAttribute('href');
      const abs = normalizeUrl(baseUrl, href);
      l.remove();
      return loadCssAbsolute(abs);
    });

    // coletar scripts com src da view
    const scripts = Array.from(temp.querySelectorAll('script[src]'));
    const scriptSrcs = scripts.map(s=> {
      const src = s.getAttribute('src');
      const abs = normalizeUrl(baseUrl, src);
      s.remove();
      return abs;
    });

    // injetar HTML sem as tags processadas
    CONTENT.innerHTML = temp.innerHTML;

    // esperar CSS
    await Promise.all(cssPromises);

    // carregar scripts sequencialmente (mantém ordem)
    for (const s of scriptSrcs){
      await loadScriptAbsolute(s);
    }

    // após tudo carregado, chamar init automático baseado no nome da view
    // extrair nome do arquivo: views/clientes.html -> clientes
    try {
      const viewName = path.split('/').pop().split('.').shift(); // 'clientes'
      const fnName = 'init' + viewName.charAt(0).toUpperCase() + viewName.slice(1); // 'initClientes'
      if (typeof window[fnName] === 'function') {
        // chamar em microtask para garantir que event handlers adicionados no script já estejam prontos
        Promise.resolve().then(()=> window[fnName]());
      } else {
        // opcional: se a view fornece init via window.viewInit (flexível), chamar também
        if (typeof window.viewInit === 'function') {
          Promise.resolve().then(()=> window.viewInit());
        }
      }
    } catch(e){
      // não bloquear se init falhar; registrar no console
      console.warn('Aviso ao chamar init da view:', e);
    }

    return;
  } catch(err){
    CONTENT.innerHTML = `<div style="padding:20px;color:#500;background:#fff7f7;border-radius:8px">Erro ao carregar a view: ${err.message || err}</div>`;
    throw err;
  }
}

/* -------------------------
   Sidebar injection / binding
   ------------------------- */
function injectSidebar(){
  if (document.getElementById('sidebar')) return;
  const aside = document.createElement('aside');
  aside.id = 'sidebar';
  const isMobile = window.matchMedia('(max-width:880px)').matches;
  // mobile: inject closed; desktop: visible
  aside.className = '';
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

  // UI adjustments
  showTopbarAndShiftContent();
  const sb = document.getElementById('sidebar');
  if (sb) {
    if (isMobile) { sb.classList.remove('open'); sb.classList.remove('collapsed'); }
    else { sb.classList.remove('collapsed'); sb.classList.remove('open'); }
  }
}

function bindSidebar(){
  document.querySelectorAll('#sidebar .nav-btn').forEach(b=>{
    b.addEventListener('click', async () => {
      const viewPath = b.dataset.view;
      try {
        // sempre chamar loadView mesmo se já estivermos na view — assim o init será chamado de novo
        await loadView(viewPath);
      } catch(e){
        console.error('Erro ao carregar view via sidebar:', e);
      }
      // se mobile, fechar overlay após clique
      const sb = document.getElementById('sidebar');
      if (sb && window.matchMedia('(max-width:880px)').matches) sb.classList.remove('open');
    });
  });

  const logout = document.getElementById('logoutBtn');
  if (logout) logout.addEventListener('click', ()=> {
    const sb = document.getElementById('sidebar'); sb && sb.remove();
    hideTopbarAndResetContent();
    loadView('views/login.html').catch(e=>console.error(e));
  });
}

/* -------------------------
   Topbar & content helpers
   ------------------------- */
function showTopbarAndShiftContent(){
  const topbar = document.getElementById('topbar');
  if (topbar) topbar.classList.remove('hidden');
  const contentRoot = document.getElementById('content');
  if (contentRoot) {
    contentRoot.classList.add('content-with-sidebar');
    const sb = document.getElementById('sidebar');
    if (sb && sb.classList.contains('collapsed')) contentRoot.classList.add('collapsed'); else contentRoot.classList.remove('collapsed');
  }
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

/* Topbar toggle binding */
function bindTopbarToggle(){
  const tbToggle = document.getElementById('sidebarToggle');
  if (!tbToggle) return;
  // replace to remove old handlers
  const newToggle = tbToggle.cloneNode(true);
  tbToggle.parentNode.replaceChild(newToggle, tbToggle);
  newToggle.addEventListener('click', ()=> {
    const sb = document.getElementById('sidebar');
    if (!sb) return;
    if (window.matchMedia('(max-width:880px)').matches) {
      sb.classList.toggle('open');
    } else {
      sb.classList.toggle('collapsed');
      const contentRoot = document.getElementById('content');
      if (contentRoot) {
        if (sb.classList.contains('collapsed')) contentRoot.classList.add('collapsed');
        else contentRoot.classList.remove('collapsed');
      }
    }
  });
}

/* Modal helpers */
function openModal(contentNode){
  const modal = document.getElementById('modal'), panel = document.getElementById('modalContent');
  if (!modal || !panel) return;
  panel.innerHTML = ''; if (contentNode instanceof Node) panel.appendChild(contentNode); else panel.innerHTML = String(contentNode);
  modal.classList.remove('hidden');
}
function closeModal(){ const modal=document.getElementById('modal'); if(!modal) return; modal.classList.add('hidden'); const panel=document.getElementById('modalContent'); if(panel) panel.innerHTML=''; }
document.getElementById('modalClose')?.addEventListener('click', closeModal);
document.getElementById('modal')?.addEventListener('click', (e)=> { if (e.target === document.getElementById('modal')) closeModal(); });

/* -------------------------
   Init: carregar login view inicialmente
   - view padrão clientes será carregada após o login (login.js já chama injectSidebar/showShell/loadView)
*/
(async function start(){
  try { await loadView('views/login.html'); } catch(e){ console.error('Falha ao carregar view inicial:', e); }
})();

/* API exposta */
window.app = {
  injectSidebar,
  loadView,
  openModal,
  closeModal,
  saveState: ()=> saveState(window.DB),
  getDB: ()=> window.DB,
  showShell: showTopbarAndShiftContent,
  hideShell: hideTopbarAndResetContent
};
