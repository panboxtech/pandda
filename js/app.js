/* app.js - shell (v2)
   - Sidebar is injected only after login (no automatic injection on sidebarToggle)
   - sidebarToggle now only toggles the sidebar if it exists
   - loader de views e mock DB permanecem
*/

const CONTENT = document.getElementById('content');
const STORAGE_KEY = 'pandda_simple_v2';

/* -------------------------
   Mock data helpers
   ------------------------- */
function defaultData(){
  const planos = [
    { id:'p1', nome:'Básico', pontos:10, valor:29.9, validade:1, linkCartao:'', chavePIX:'' },
    { id:'p2', nome:'Pro', pontos:30, valor:69.9, validade:3, linkCartao:'', chavePIX:'' },
    { id:'p3', nome:'Anual', pontos:120, valor:199.9, validade:12, linkCartao:'', chavePIX:'' },
  ];
  const servidores = [
    { id:'s1', nome:'Servidor Alpha', url1:'https://alpha.example', url2:'', app1:'', app2:'' },
    { id:'s2', nome:'Servidor Beta', url1:'https://beta.example', url2:'', app1:'', app2:'' },
    { id:'s3', nome:'Servidor Gamma', url1:'https://gamma.example', url2:'', app1:'', app2:'' },
  ];
  const base = new Date();
  const clients = [
    { id:'c1', nome:'Ana Silva', whatsapp:'+5591988887777', email:'ana@example.com', dataCriacao: new Date(base.getTime()-1000*60*60*24*120).toISOString().slice(0,10), dataVencimento: new Date(base.getFullYear(), base.getMonth()+1, base.getDate()).toISOString().slice(0,10), planoId:'p1', servidor1:'s1', servidor2:'', usuario1:'ana1', senha1:'pass', statusNotificacao:true, observacoes:'VIP', codigoIndicacao:'X1', numeroRenovacoes:0, bloqueado:false},
    { id:'c2', nome:'Bruno Costa', whatsapp:'+5591999991111', email:'bruno@example.com', dataCriacao: new Date(base.getTime()-1000*60*60*24*60).toISOString().slice(0,10), dataVencimento: new Date(base.getTime()+1000*60*60*24*3).toISOString().slice(0,10), planoId:'p2', servidor1:'s2', servidor2:'s3', usuario1:'bruno', senha1:'pwd', statusNotificacao:false, observacoes:'Pendente', codigoIndicacao:'', numeroRenovacoes:1, bloqueado:false},
    { id:'c3', nome:'Carla Nunes', whatsapp:'+5591983332222', email:'carla@example.com', dataCriacao: new Date(base.getTime()-1000*60*60*24*400).toISOString().slice(0,10), dataVencimento: new Date(base.getTime()-1000*60*60*24*2).toISOString().slice(0,10), planoId:'p1', servidor1:'s3', servidor2:'', usuario1:'carla', senha1:'123', statusNotificacao:false, observacoes:'Aguardando', codigoIndicacao:'Y2', numeroRenovacoes:2, bloqueado:false},
  ];
  return { planos, servidores, clientes: clients };
}
function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) { const d = defaultData(); saveState(d); return d; }
  try { return JSON.parse(raw); } catch(e) { const d = defaultData(); saveState(d); return d; }
}
function saveState(s){ localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }

window.DB = loadState(); // expõe DB para views

/* -------------------------
   Utilitários para carregar assets (HTML, CSS, JS)
   ------------------------- */
function normalizeUrl(base, relative){
  try { return new URL(relative, base).toString(); } catch(e){ return relative; }
}
function loadScriptAbsolute(src){
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.onload = () => resolve(src);
    s.onerror = () => reject(new Error(`Falha ao carregar script: ${src}`));
    document.body.appendChild(s);
  });
}
function loadCssAbsolute(href){
  return new Promise((resolve) => {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    l.onload = () => resolve(href);
    l.onerror = () => { console.warn('Falha ao carregar CSS:', href); resolve(href); };
    document.head.appendChild(l);
  });
}

async function loadView(path){
  if (!CONTENT) throw new Error('Elemento #content não encontrado no DOM');
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar ${path}`);
    const html = await res.text();
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const baseUrl = new URL(path, window.location.href).toString();
    const links = Array.from(temp.querySelectorAll('link[rel="stylesheet"]'));
    const cssPromises = links.map(link => {
      const href = link.getAttribute('href');
      const abs = normalizeUrl(baseUrl, href);
      link.remove();
      return loadCssAbsolute(abs);
    });
    const scripts = Array.from(temp.querySelectorAll('script[src]'));
    const scriptSrcs = scripts.map(s => {
      const src = s.getAttribute('src');
      const abs = normalizeUrl(baseUrl, src);
      s.remove();
      return abs;
    });
    CONTENT.innerHTML = temp.innerHTML;
    await Promise.all(cssPromises);
    for (const s of scriptSrcs){
      await loadScriptAbsolute(s);
    }
    return;
  } catch(err){
    const msg = err && err.message ? err.message : String(err);
    CONTENT.innerHTML = `<div style="padding:20px;color:#500;background:#fff7f7;border-radius:8px">Erro ao carregar a view: ${msg}</div>`;
    throw new Error(msg);
  }
}

/* -------------------------
   Sidebar injection / binding
   ------------------------- */
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
}

function bindSidebar(){
  document.querySelectorAll('#sidebar .nav-btn').forEach(b=>{
    b.addEventListener('click', async () => {
      const viewPath = b.dataset.view;
      try { await loadView(viewPath); } catch(err){ console.error('Erro ao carregar view via sidebar:', err.message || err); }
    });
  });
  const logout = document.getElementById('logoutBtn');
  if (logout) logout.addEventListener('click', ()=> {
    const sb = document.getElementById('sidebar'); sb && sb.remove();
    loadView('views/login.html').catch(e => console.error(e));
  });
}

/* -------------------------
   Topbar toggle (agora somente toggles se sidebar existir)
   - Não injeta sidebar automaticamente; sidebar deve ser injetada apenas após login
*/
const tbToggle = document.getElementById('sidebarToggle');
if (tbToggle){
  tbToggle.addEventListener('click', () => {
    const sb = document.getElementById('sidebar');
    if (!sb) {
      // NÃO injetar automaticamente: o menu só está disponível após login
      console.warn('Sidebar não disponível. Faça login para acessar o menu lateral.');
      return;
    }
    if (window.matchMedia('(max-width:880px)').matches) {
      sb.classList.toggle('open'); // mobile slide in/out
    } else {
      sb.classList.toggle('collapsed'); // desktop collapse/expand
    }
  });
}

/* -------------------------
   Modal helpers (expostos)
   ------------------------- */
function openModal(contentNode){
  const modal = document.getElementById('modal');
  const panel = document.getElementById('modalContent');
  if (!modal || !panel) return;
  panel.innerHTML = '';
  if (contentNode instanceof Node) panel.appendChild(contentNode);
  else panel.innerHTML = String(contentNode);
  modal.classList.remove('hidden');
}
function closeModal(){
  const modal = document.getElementById('modal');
  if (!modal) return;
  modal.classList.add('hidden');
  const panel = document.getElementById('modalContent');
  if (panel) panel.innerHTML = '';
}
const modalCloseBtn = document.getElementById('modalClose');
if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
const modalBox = document.getElementById('modal');
if (modalBox) modalBox.addEventListener('click', (e)=> { if (e.target === modalBox) closeModal(); });

/* -------------------------
   Start: carregar login e expor API para views
   ------------------------- */
(async function start(){
  try {
    await loadView('views/login.html');
  } catch(e){
    console.error('Start: falha ao carregar view inicial:', e.message || e);
  }
})();

window.app = {
  injectSidebar,
  loadView,
  openModal,
  closeModal,
  saveState: ()=> saveState(window.DB),
  getDB: ()=> window.DB
};
