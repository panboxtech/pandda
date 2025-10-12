/* js/app.js - shell (ajustes para ocultar topbar antes do login e garantir toggle após login)
   - Topbar permanece oculta até window.app.showShell() ser chamado (após login)
   - Sidebar é injetada apenas após login (window.app.injectSidebar)
   - sidebarToggle só tenta abrir se sidebar existir
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
function loadScriptAbsolute(src){ return new Promise((resolve,reject)=>{ const s=document.createElement('script'); s.src=src; s.async=false; s.onload=()=>resolve(src); s.onerror=()=>reject(new Error('Falha ao carregar script: '+src)); document.body.appendChild(s); }); }
function loadCssAbsolute(href){ return new Promise((resolve)=>{ const l=document.createElement('link'); l.rel='stylesheet'; l.href=href; l.onload=()=>resolve(href); l.onerror=()=>{ console.warn('Falha ao carregar CSS:',href); resolve(href); }; document.head.appendChild(l); }); }

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
    const cssPromises = links.map(l=> { const href = l.getAttribute('href'); const abs = normalizeUrl(baseUrl, href); l.remove(); return loadCssAbsolute(abs); });
    const scripts = Array.from(temp.querySelectorAll('script[src]'));
    const scriptSrcs = scripts.map(s=> { const src = s.getAttribute('src'); const abs = normalizeUrl(baseUrl, src); s.remove(); return abs; });
    CONTENT.innerHTML = temp.innerHTML;
    await Promise.all(cssPromises);
    for (const s of scriptSrcs) { await loadScriptAbsolute(s); }
    return;
  } catch(err){
    CONTENT.innerHTML = `<div style="padding:20px;color:#500;background:#fff7f7;border-radius:8px">Erro ao carregar a view: ${err.message || err}</div>`;
    throw err;
  }
}

/* Sidebar injection (somente após login) */
function injectSidebar(){
  if (document.getElementById('sidebar')) return;
  const aside = document.createElement('aside');
  aside.id = 'sidebar';
  aside.className = 'open'; // injetada aberta por padrão no mobile, collapsed=false
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
  // show topbar and mark content area to shift on desktop
  showTopbarAndShiftContent();
}

function bindSidebar(){
  document.querySelectorAll('#sidebar .nav-btn').forEach(b=>{
    b.addEventListener('click', async ()=> {
      const viewPath = b.dataset.view;
      try { await loadView(viewPath); } catch(e){ console.error(e); }
      // close mobile overlay after click
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

/* Topbar show/hide helpers */
function showTopbarAndShiftContent(){
  const topbar = document.getElementById('topbar');
  if (topbar) topbar.classList.remove('hidden');
  const contentRoot = document.getElementById('content');
  if (contentRoot) {
    contentRoot.classList.add('content-with-sidebar');
    // adjust for collapsed state if needed
    const sb = document.getElementById('sidebar');
    if (sb && sb.classList.contains('collapsed')) contentRoot.classList.add('collapsed');
    else contentRoot.classList.remove('collapsed');
  }
  // bind toggle now that topbar exists/visible
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

/* Topbar toggle: só opera se sidebar existir (sidebar é injetada após login) */
function bindTopbarToggle(){
  const tbToggle = document.getElementById('sidebarToggle');
  if (!tbToggle) return;
  // remove previous handlers to avoid duplication
  tbToggle.replaceWith(tbToggle.cloneNode(true));
  const newToggle = document.getElementById('sidebarToggle');
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

/* Start: carregar login view inicialmente */
(async function start(){
  try { await loadView('views/login.html'); } catch(e){ console.error('Falha ao carregar view inicial:', e); }
})();

/* API exposta para views */
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
