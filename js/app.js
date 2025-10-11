/* app.js - shell
   - Carrega views simples (fetch)
   - Mantém mock DB em localStorage (acessível via window.DB)
   - Injeta sidebar após login (simples)
*/
const CONTENT = document.getElementById('content');
const STORAGE_KEY = 'pandda_simple_v2';

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

// simple loader
async function loadView(path){
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error('Falha ao carregar view');
    const html = await res.text();
    CONTENT.innerHTML = html;
    // run any inline scripts that are referenced as <script src="../js/..."> inside the view:
    const scripts = Array.from(CONTENT.querySelectorAll('script[src]'));
    for (const s of scripts){
      await loadScript(s.src);
    }
    // remove script tags already executed to avoid duplication
    scripts.forEach(s => s.remove());
  } catch(e){
    CONTENT.innerHTML = `<div style="padding:20px;">Erro ao carregar: ${e.message}</div>`;
  }
}

function loadScript(src){
  return new Promise((resolve,reject)=>{
    const s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.onload = resolve;
    s.onerror = reject;
    document.body.appendChild(s);
  });
}

/* Sidebar simple injection */
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
    b.addEventListener('click', async (e)=>{
      const p = b.dataset.view;
      await loadView(p);
    });
  });
  const logout = document.getElementById('logoutBtn');
  logout && logout.addEventListener('click', ()=> {
    const sb = document.getElementById('sidebar'); sb && sb.remove();
    loadView('views/login.html');
  });
}

// topbar toggle (mobile friendly)
document.getElementById('sidebarToggle').addEventListener('click', ()=>{
  const sb = document.getElementById('sidebar');
  if (!sb) return;
  sb.classList.toggle('open');
});

// modal helpers
function openModal(contentNode){
  const modal = document.getElementById('modal');
  const panel = document.getElementById('modalContent');
  panel.innerHTML = '';
  if (contentNode instanceof Node) panel.appendChild(contentNode);
  else panel.innerHTML = contentNode;
  modal.classList.remove('hidden');
}
function closeModal(){
  document.getElementById('modal').classList.add('hidden');
  document.getElementById('modalContent').innerHTML = '';
}
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modal').addEventListener('click', (e)=> { if (e.target === document.getElementById('modal')) closeModal(); });

// initial: load login view
loadView('views/login.html');

// expose helpers to views
window.app = {
  injectSidebar,
  loadView,
  openModal,
  closeModal,
  saveState: ()=> saveState(window.DB),
  getDB: ()=> window.DB
};
