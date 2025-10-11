/* app.js
   Protótipo Pandda - atualizações:
   - topbar fixo; sidebar toggle sempre acessível no topo
   - listagem e formulários adaptativos e scrolláveis em mobile
   - expand-toggle full-width para detalhes do cliente
*/

/* UTILITÁRIOS */
const qs = (sel, ctx=document) => ctx.querySelector(sel);
const qsa = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
const fmtDate = d => {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toISOString().slice(0,10);
};
const addDays = (dateStr, days) => { const d = new Date(dateStr); d.setDate(d.getDate() + days); return fmtDate(d); };
const addMonths = (dateStr, months) => { const d = new Date(dateStr); d.setMonth(d.getMonth() + months); return fmtDate(d); };
const uid = () => Math.random().toString(36).slice(2,9);

/* STORAGE / MOCK DATA */
const STORAGE_KEY = 'pandda_mock_v1';
function defaultData(){
  const planos = [
    { id: 'p1', nome: 'Básico', pontos: 10, valor: 29.90, validade: 1, linkCartao: 'https://pagto.example/basico', chavePIX: 'pix-basico' },
    { id: 'p2', nome: 'Pro', pontos: 30, valor: 69.90, validade: 3, linkCartao: 'https://pagto.example/pro', chavePIX: 'pix-pro' },
    { id: 'p3', nome: 'Anual', pontos: 120, valor: 199.90, validade: 12, linkCartao: 'https://pagto.example/anual', chavePIX: 'pix-anual' },
  ];
  const servidores = [
    { id: 's1', nome: 'Servidor Alpha', url1: 'https://alpha.example', url2: '', app1: 'app-alpha-1', app2: '' },
    { id: 's2', nome: 'Servidor Beta', url1: 'https://beta.example', url2: '', app1: 'app-beta-1', app2: 'app-beta-2' },
    { id: 's3', nome: 'Servidor Gamma', url1: 'https://gamma.example', url2: 'https://gamma2.example', app1: '', app2: '' },
  ];
  const baseDate = new Date();
  const clients = [
    { id:'c1', nome:'Ana Silva', whatsapp:'+5591988887777', email:'ana@example.com', dataCriacao: fmtDate(addDays(fmtDate(baseDate), -120)), dataVencimento: fmtDate(addMonths(fmtDate(baseDate), 1)), planoId:'p1', servidor1:'s1', servidor2:'', usuario1:'ana1', senha1:'pass', usuario2:'', senha2:'', statusNotificacao:true, observacoes:'Cliente VIP', codigoIndicacao:'X1', numeroRenovacoes:0, bloqueado:false },
    { id:'c2', nome:'Bruno Costa', whatsapp:'+5591999991111', email:'bruno@example.com', dataCriacao: fmtDate(addDays(fmtDate(baseDate), -60)), dataVencimento: fmtDate(addDays(fmtDate(baseDate), 3)), planoId:'p2', servidor1:'s2', servidor2:'s3', usuario1:'bruno', senha1:'pwd', usuario2:'', senha2:'', statusNotificacao:false, observacoes:'Pendente confirmação', codigoIndicacao:'', numeroRenovacoes:1, bloqueado:false },
    { id:'c3', nome:'Carla Nunes', whatsapp:'+5591983332222', email:'carla@example.com', dataCriacao: fmtDate(addDays(fmtDate(baseDate), -400)), dataVencimento: fmtDate(addDays(fmtDate(baseDate), -2)), planoId:'p1', servidor1:'s3', servidor2:'', usuario1:'carla', senha1:'123', usuario2:'', senha2:'', statusNotificacao:false, observacoes:'Aguardando pagamento', codigoIndicacao:'Y2', numeroRenovacoes:2, bloqueado:false },
    { id:'c4', nome:'Diego Lima', whatsapp:'+5591977776666', email:'diego@example.com', dataCriacao: fmtDate(addDays(fmtDate(baseDate), -30)), dataVencimento: fmtDate(addDays(fmtDate(baseDate), -45)), planoId:'p3', servidor1:'s1', servidor2:'', usuario1:'diego', senha1:'xxx', usuario2:'', senha2:'', statusNotificacao:true, observacoes:'Vencido há mais de 30', codigoIndicacao:'', numeroRenovacoes:0, bloqueado:false },
    { id:'c5', nome:'Elisa Rocha', whatsapp:'+5591966665555', email:'elisa@example.com', dataCriacao: fmtDate(addDays(fmtDate(baseDate), -10)), dataVencimento: fmtDate(addDays(fmtDate(baseDate), 9)), planoId:'p1', servidor1:'s2', servidor2:'', usuario1:'elisa', senha1:'abc', usuario2:'', senha2:'', statusNotificacao:false, observacoes:'Outros', codigoIndicacao:'Z3', numeroRenovacoes:0, bloqueado:false },
    { id:'c6', nome:'Fábio Souza', whatsapp:'+5591955554444', email:'fabio@example.com', dataCriacao: fmtDate(addDays(fmtDate(baseDate), -200)), dataVencimento: fmtDate(addDays(fmtDate(baseDate), -10)), planoId:'p2', servidor1:'s1', servidor2:'s3', usuario1:'fabio', senha1:'pw', usuario2:'fabio2', senha2:'pw2', statusNotificacao:true, observacoes:'', codigoIndicacao:'', numeroRenovacoes:3, bloqueado:false },
    { id:'c7', nome:'Gisele Martins', whatsapp:'+5591944443333', email:'gisele@example.com', dataCriacao: fmtDate(addDays(fmtDate(baseDate), -5)), dataVencimento: fmtDate(addDays(fmtDate(baseDate), 0)), planoId:'p3', servidor1:'s3', servidor2:'', usuario1:'gisele', senha1:'p', usuario2:'', senha2:'', statusNotificacao:false, observacoes:'Vence hoje', codigoIndicacao:'', numeroRenovacoes:0, bloqueado:false },
    { id:'c8', nome:'Hugo Pereira', whatsapp:'+5591933332221', email:'hugo@example.com', dataCriacao: fmtDate(addDays(fmtDate(baseDate), -15)), dataVencimento: fmtDate(addDays(fmtDate(baseDate), 35)), planoId:'p2', servidor1:'s2', servidor2:'', usuario1:'hugo', senha1:'h1', usuario2:'', senha2:'', statusNotificacao:true, observacoes:'', codigoIndicacao:'', numeroRenovacoes:0, bloqueado:false },
    { id:'c9', nome:'Isabela Moura', whatsapp:'+5591922221111', email:'isabela@example.com', dataCriacao: fmtDate(addDays(fmtDate(baseDate), -365)), dataVencimento: fmtDate(addDays(fmtDate(baseDate), -20)), planoId:'p1', servidor1:'s1', servidor2:'', usuario1:'isabela', senha1:'pw', usuario2:'', senha2:'', statusNotificacao:false, observacoes:'Vencido menos de 30', codigoIndicacao:'A9', numeroRenovacoes:1, bloqueado:false },
    { id:'c10', nome:'João Pedro', whatsapp:'+5591911110000', email:'joao@example.com', dataCriacao: fmtDate(addDays(fmtDate(baseDate), -2)), dataVencimento: fmtDate(addMonths(fmtDate(baseDate), 6)), planoId:'p3', servidor1:'s2', servidor2:'s1', usuario1:'joao', senha1:'jo', usuario2:'', senha2:'', statusNotificacao:true, observacoes:'Novo cliente', codigoIndicacao:'B1', numeroRenovacoes:0, bloqueado:false },
  ];
  return { planos, servidores, clientes: clients };
}
function loadState(){ const raw = localStorage.getItem(STORAGE_KEY); if (!raw) { const d = defaultData(); saveState(d); return d; } try { return JSON.parse(raw); } catch(e) { const d = defaultData(); saveState(d); return d; } }
function saveState(state){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
let DB = loadState();

/* APP STATE */
const state = { filter: { text: '', onlyNotified:false, dateRange: null } };

/* INIT */
function init(){
  bindTopbar();
  bindAuth();
  bindNav();
  renderAll();
  bindGlobalUI();
}

/* TOPBAR & SIDEBAR TOGGLE */
function bindTopbar(){
  const toggle = qs('#sidebarToggle');
  const sidebar = qs('#sidebar');

  toggle.addEventListener('click', () => {
    if (window.matchMedia('(max-width:880px)').matches) {
      sidebar.classList.toggle('open'); // mobile slide-in
    } else {
      sidebar.classList.toggle('collapsed'); // desktop collapse
    }
  });

  // close mobile sidebar when touching outside
  document.addEventListener('click', (e) => {
    if (window.matchMedia('(max-width:880px)').matches) {
      if (!qs('#sidebar')) return;
      const sidebarEl = qs('#sidebar');
      const toggleBtn = qs('#sidebarToggle');
      const clickedInside = sidebarEl.contains(e.target) || toggleBtn.contains(e.target);
      if (!clickedInside && sidebarEl.classList.contains('open')) {
        sidebarEl.classList.remove('open');
      }
    }
  });

  // ensure toggle button stays visible and fixed (topbar is fixed)
}

/* AUTH */
function bindAuth(){
  const loginView = qs('#loginView');
  const appView = qs('#app');
  const btnLogin = qs('#btnLogin');
  const toggleEye = qs('#toggleEye');

  // initial visibility
  if (loginView) { loginView.classList.add('active'); appView.classList.remove('active'); qs('#app') && qs('#app').classList.remove('active'); }

  toggleEye.addEventListener('click', () => {
    const p = qs('#loginPass'); if (!p) return;
    p.type = p.type === 'password' ? 'text' : 'password';
  });

  btnLogin.addEventListener('click', () => {
    // show app and default to clientes
    loginView.classList.remove('active');
    appView.classList.add('active');
    qs('#app').classList.add('active');
    showView('clientesView');
  });

  qs('#logoutBtn').addEventListener('click', () => {
    qs('#app').classList.remove('active');
    qs('#loginView').classList.add('active');
    qsa('.panel').forEach(p => p.classList.remove('active'));
  });
}

/* NAV */
function bindNav(){
  qsa('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      qsa('.nav-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.dataset.view;
      showView(view);
      // close mobile sidebar after selection
      if (window.matchMedia('(max-width:880px)').matches) qs('#sidebar') && qs('#sidebar').classList.remove('open');
    });
  });
}

function showView(id){
  qsa('.panel').forEach(p => p.classList.remove('active'));
  const target = qs(`#${id}`);
  if (target) target.classList.add('active');
  qsa('.nav-btn').forEach(b => { if (b.dataset.view === id) b.classList.add('active'); else b.classList.remove('active'); });
  target && target.scrollIntoView({behavior:'smooth'});
  renderAll();
}

/* RENDER ALL */
function renderAll(){
  renderSummaryCards();
  renderClientsList();
  renderPlansList();
  renderServersList();
}

/* SUMMARY CARDS */
function computeClientBuckets(){
  const today = new Date();
  function daysDiff(dateStr){ const d = new Date(dateStr); return Math.floor((d - today)/(1000*60*60*24)); }
  const clients = DB.clientes;
  const total = clients.length;
  const ativos = clients.filter(c => new Date(c.dataVencimento) >= new Date()).length;
  const vencendo = clients.filter(c => { const d = daysDiff(c.dataVencimento); return d >=0 && d <= 7; }).length;
  const vencidosMenos30 = clients.filter(c => { const d = daysDiff(c.dataVencimento); return d < 0 && d >= -30; }).length;
  const vencidosMais30 = clients.filter(c=> { const d = daysDiff(c.dataVencimento); return d < -30; }).length;
  return { total, ativos, vencendo, vencidosMenos30, vencidosMais30 };
}

function renderSummaryCards(){
  const container = qs('#summaryCards'); if (!container) return;
  container.innerHTML = '';
  const b = computeClientBuckets();
  const cards = [
    { id:'card-ativos', title:'Clientes ativos', value: b.ativos, filter: {type:'ativos'} },
    { id:'card-vencendo', title:'Vencendo (7 dias)', value: b.vencendo, filter: {type:'vencendo'} },
    { id:'card-vencidos-menor', title:'Vencidos < 30 dias', value: b.vencidosMenos30, filter: {type:'vencidosMenos30'} },
    { id:'card-vencidos-maior', title:'Vencidos > 30 dias', value: b.vencidosMais30, filter: {type:'vencidosMais30'} },
    { id:'card-total', title:'Total', value: b.total, filter: {type:'total'} },
  ];
  cards.forEach(c => {
    const el = document.createElement('div');
    el.className = 'card';
    el.id = c.id;
    el.innerHTML = `<h3>${c.title}</h3><p>${c.value}</p>`;
    el.addEventListener('click', () => { applySummaryFilter(c.filter); });
    container.appendChild(el);
  });
}
function applySummaryFilter(f){ state.filter.dateRange = f; renderClientsList(); }

/* CLIENTS: filtering, rendering */
function matchesSearch(client, text){
  if (!text) return true;
  const t = text.toLowerCase();
  return (client.nome||'').toLowerCase().includes(t) || (client.usuario1||'').toLowerCase().includes(t) || (client.whatsapp||'').toLowerCase().includes(t);
}
function matchesSummaryFilter(client, filter){
  if (!filter) return true;
  const diff = Math.floor((new Date(client.dataVencimento) - new Date())/(1000*60*60*24));
  switch(filter.type){
    case 'ativos': return diff >= 0;
    case 'vencendo': return diff >=0 && diff <=7;
    case 'vencidosMenos30': return diff < 0 && diff >= -30;
    case 'vencidosMais30': return diff < -30;
    case 'total': return true;
    default: return true;
  }
}

function renderClientsList(){
  const list = qs('#clientsList'); if (!list) return;
  list.innerHTML = '';

  const text = qs('#searchInput') ? qs('#searchInput').value.trim() : '';
  const onlyNotified = qs('#onlyNotifiedToggle') ? qs('#onlyNotifiedToggle').checked : false;
  const dateFilter = state.filter.dateRange;

  const out = DB.clientes
    .filter(c => matchesSearch(c, text))
    .filter(c => onlyNotified ? c.statusNotificacao === false : true)
    .filter(c => matchesSummaryFilter(c, dateFilter))
    .sort((a,b) => new Date(a.dataVencimento) - new Date(b.dataVencimento));

  out.forEach(c => list.appendChild(clientRow(c)));
}

/* clientRow: summary + expand-toggle + details */
function clientRow(client){
  const row = document.createElement('div'); row.className = 'client-row'; row.dataset.id = client.id;
  if (client.bloqueado) row.style.opacity = '0.5';

  // summary
  const left = document.createElement('div'); left.className = 'client-left';
  const name = document.createElement('div'); name.className = 'client-name'; name.textContent = client.nome;
  const wa = document.createElement('div'); wa.className = 'whatsapp'; wa.innerHTML = `${client.whatsapp || ''} <button title="Copiar" class="small-btn copy-btn">📋</button>`;
  left.appendChild(name); left.appendChild(wa);

  const right = document.createElement('div'); right.className = 'actions';
  const dt = document.createElement('div'); dt.className='muted'; dt.textContent = 'Vence: ' + fmtDate(client.dataVencimento);

  const notifyBtn = document.createElement('button'); notifyBtn.className='small-btn notify-btn'; notifyBtn.innerHTML='💬 Notificar';
  notifyBtn.addEventListener('click', () => notifyClient(client.id));
  const renewBtn = document.createElement('button'); renewBtn.className='small-btn renew-btn'; renewBtn.innerHTML='🔁 Renovar';
  renewBtn.addEventListener('click', () => openRenewModal(client.id));
  const editBtn = document.createElement('button'); editBtn.className='small-btn'; editBtn.textContent='✏️ Editar';
  editBtn.addEventListener('click', ()=> openEditClient(client.id, row));

  right.appendChild(dt); right.appendChild(notifyBtn); right.appendChild(renewBtn); right.appendChild(editBtn);

  const summary = document.createElement('div'); summary.className='client-summary';
  summary.appendChild(left); summary.appendChild(right);

  // expand toggle full width below summary
  const expandToggle = document.createElement('button'); expandToggle.className='expand-toggle';
  expandToggle.innerHTML = `<span>Mostrar mais informações</span><span class="arrow">▼</span>`;
  expandToggle.addEventListener('click', () => {
    row.classList.toggle('expanded');
  });

  // details
  const details = document.createElement('div'); details.className='client-details';
  details.innerHTML = clientDetailsHtml(client);

  // copy whatsapp
  wa.querySelector('.copy-btn').addEventListener('click', (e) => {
    navigator.clipboard?.writeText(client.whatsapp || '')?.then(()=> {
      e.target.textContent = '✔';
      setTimeout(()=> e.target.textContent='📋',900);
    });
  });

  // block button inside details
  const blockBtn = details.querySelector('.block-client');
  blockBtn.addEventListener('click', ()=> {
    if (!confirm(`Bloquear cliente ${client.nome}? Isso define bloqueado = true.`)) return;
    client.bloqueado = true;
    saveState(DB);
    renderAll();
  });

  row.appendChild(summary);
  row.appendChild(expandToggle);
  row.appendChild(details);
  return row;
}

function clientDetailsHtml(client){
  const plano = DB.planos.find(p=>p.id===client.planoId);
  const servidor1 = DB.servidores.find(s=>s.id===client.servidor1);
  const servidor2 = DB.servidores.find(s=>s.id===client.servidor2);
  return `
    <div>
      <div><strong>Plano:</strong> ${plano ? plano.nome : '—'}</div>
      <div><strong>Servidor 1:</strong> ${servidor1 ? servidor1.nome : '—'}</div>
      <div><strong>Servidor 2:</strong> ${servidor2 ? servidor2.nome : '—'}</div>
      <div><strong>Usuário 1:</strong> ${client.usuario1}</div>
      <div><strong>Senha 1:</strong> ${client.senha1}</div>
      <div><strong>Usuário 2:</strong> ${client.usuario2}</div>
      <div><strong>Senha 2:</strong> ${client.senha2}</div>
      <div><strong>Status Notificação:</strong> ${client.statusNotificacao ? 'Notificado' : 'Não notificado'}</div>
      <div><strong>Observações:</strong> ${client.observacoes}</div>
      <div class="muted">Código indicação: ${client.codigoIndicacao} • Nº renovações: ${client.numeroRenovacoes}</div>
      <div style="margin-top:8px;">
        <button class="secondary block-client">Bloquear cliente</button>
      </div>
    </div>
  `;
}

/* NOTIFY (simulado) */
function notifyClient(clientId){
  const c = DB.clientes.find(x=>x.id===clientId);
  if (!c) return;
  c.statusNotificacao = true;
  saveState(DB);
  renderClientsList();
  alert(`Notificação simulada para ${c.nome} (${c.whatsapp}).`);
}

/* RENOVAR */
function openRenewModal(clientId){
  const client = DB.clientes.find(c=>c.id===clientId);
  if (!client) return; openModal(buildRenewForm(client));
}
function buildRenewForm(client){
  const div = document.createElement('div');
  const title = document.createElement('h2'); title.textContent = `Renovar ${client.nome}`; div.appendChild(title);
  const form = document.createElement('form');
  form.innerHTML = `
    <label class="field"><span>Plano</span><select name="planoId"></select></label>
    <label class="field"><span>Nova data de vencimento</span><input name="dataVencimento" type="date"></label>
    <div class="form-actions">
      <button type="button" id="cancelRenew" class="secondary">Cancelar</button>
      <button type="submit" class="primary">Renovar</button>
    </div>
  `;
  const sel = form.querySelector('select[name=planoId]');
  DB.planos.forEach(p => { const o = document.createElement('option'); o.value = p.id; o.textContent = `${p.nome} — ${p.validade} mês(es)`; if (p.id===client.planoId) o.selected=true; sel.appendChild(o); });
  const dateIn = form.querySelector('input[name=dataVencimento]');
  const selectedPlan = DB.planos.find(p=>p.id===sel.value);
  dateIn.value = addMonths(client.dataVencimento || fmtDate(new Date()), selectedPlan ? selectedPlan.validade : 1);
  sel.addEventListener('change', ()=> { const p = DB.planos.find(x=>x.id===sel.value); dateIn.value = p ? addMonths(client.dataVencimento || fmtDate(new Date()), p.validade) : dateIn.value; });
  form.querySelector('#cancelRenew').addEventListener('click', closeModal);
  form.addEventListener('submit', (e)=>{ e.preventDefault(); client.planoId = sel.value; client.dataVencimento = dateIn.value; client.numeroRenovacoes = (client.numeroRenovacoes||0)+1; saveState(DB); closeModal(); renderAll(); alert(`Cliente ${client.nome} renovado até ${client.dataVencimento}.`); });
  div.appendChild(form);
  return div;
}

/* EDIT CLIENT - usa modal com formulário responsivo */
function openEditClient(clientId, rowNode){
  const client = DB.clientes.find(c=>c.id===clientId); if (!client) return;
  const tpl = qs('#clientFormTpl').content.cloneNode(true);
  const form = tpl.querySelector('form');
  tpl.querySelector('#clientFormTitle').textContent = `Editar ${client.nome}`;

  const planoSel = form.querySelector('select[name=planoId]');
  DB.planos.forEach(p => { const o = document.createElement('option'); o.value = p.id; o.textContent = p.nome; if (p.id===client.planoId) o.selected=true; planoSel.appendChild(o); });

  const srv1 = form.querySelector('select[name=servidor1]'); const srv2 = form.querySelector('select[name=servidor2]');
  const emptyOpt = document.createElement('option'); emptyOpt.value=''; emptyOpt.textContent='—';
  srv1.appendChild(emptyOpt.cloneNode(true)); srv2.appendChild(emptyOpt.cloneNode(true));
  DB.servidores.forEach(s => { const o1=document.createElement('option'); o1.value=s.id; o1.textContent=s.nome; if (s.id===client.servidor1) o1.selected=true; srv1.appendChild(o1); const o2=o1.cloneNode(true); if (s.id===client.servidor2) o2.selected=true; srv2.appendChild(o2); });

  const fields = form.elements;
  fields.namedItem('nome').value = client.nome || '';
  fields.namedItem('whatsapp').value = client.whatsapp || '';
  fields.namedItem('email').value = client.email || '';
  fields.namedItem('dataCriacao').value = client.dataCriacao || '';
  fields.namedItem('dataVencimento').value = client.dataVencimento || '';
  fields.namedItem('usuario1').value = client.usuario1 || '';
  fields.namedItem('senha1').value = client.senha1 || '';
  fields.namedItem('usuario2').value = client.usuario2 || '';
  fields.namedItem('senha2').value = client.senha2 || '';
  fields.namedItem('observacoes').value = client.observacoes || '';
  fields.namedItem('codigoIndicacao').value = client.codigoIndicacao || '';
  fields.namedItem('numeroRenovacoes').value = client.numeroRenovacoes || 0;

  form.querySelector('#cancelClient').addEventListener('click', closeModal);
  form.addEventListener('submit', (e)=>{ e.preventDefault(); if (!confirm('Salvar alterações do cliente?')) return;
    client.nome = fields.namedItem('nome').value;
    client.whatsapp = fields.namedItem('whatsapp').value;
    client.email = fields.namedItem('email').value;
    client.dataCriacao = fields.namedItem('dataCriacao').value;
    client.dataVencimento = fields.namedItem('dataVencimento').value;
    client.planoId = fields.namedItem('planoId').value;
    client.servidor1 = fields.namedItem('servidor1').value;
    client.servidor2 = fields.namedItem('servidor2').value;
    client.usuario1 = fields.namedItem('usuario1').value;
    client.senha1 = fields.namedItem('senha1').value;
    client.usuario2 = fields.namedItem('usuario2').value;
    client.senha2 = fields.namedItem('senha2').value;
    client.observacoes = fields.namedItem('observacoes').value;
    client.codigoIndicacao = fields.namedItem('codigoIndicacao').value;
    client.numeroRenovacoes = parseInt(fields.namedItem('numeroRenovacoes').value || 0);
    saveState(DB); closeModal(); renderAll();
  });

  openModal(tpl);
}

/* NEW CLIENT */
qs('#btnNewClient').addEventListener('click', ()=> {
  const tpl = qs('#clientFormTpl').content.cloneNode(true);
  const form = tpl.querySelector('form');
  tpl.querySelector('#clientFormTitle').textContent = 'Novo Cliente';
  const planoSel = form.querySelector('select[name=planoId]');
  DB.planos.forEach(p => { const o=document.createElement('option'); o.value=p.id; o.textContent=p.nome; planoSel.appendChild(o); });
  const srv1 = form.querySelector('select[name=servidor1]'); const srv2 = form.querySelector('select[name=servidor2]');
  const emptyOpt = document.createElement('option'); emptyOpt.value=''; emptyOpt.textContent='—';
  srv1.appendChild(emptyOpt.cloneNode(true)); srv2.appendChild(emptyOpt.cloneNode(true));
  DB.servidores.forEach(s => { const o=document.createElement('option'); o.value=s.id; o.textContent=s.nome; srv1.appendChild(o); srv2.appendChild(o.cloneNode(true)); });

  form.querySelector('#cancelClient').addEventListener('click', closeModal);
  form.addEventListener('submit', (e)=>{ e.preventDefault();
    const f = form.elements;
    const newClient = {
      id: 'c' + uid(),
      nome: f.namedItem('nome').value,
      whatsapp: f.namedItem('whatsapp').value,
      email: f.namedItem('email').value,
      dataCriacao: f.namedItem('dataCriacao').value || fmtDate(new Date()),
      dataVencimento: f.namedItem('dataVencimento').value || fmtDate(new Date()),
      planoId: f.namedItem('planoId').value || '',
      servidor1: f.namedItem('servidor1').value || '',
      servidor2: f.namedItem('servidor2').value || '',
      usuario1: f.namedItem('usuario1').value || '',
      senha1: f.namedItem('senha1').value || '',
      usuario2: f.namedItem('usuario2').value || '',
      senha2: f.namedItem('senha2').value || '',
      statusNotificacao: false,
      observacoes: f.namedItem('observacoes').value || '',
      codigoIndicacao: f.namedItem('codigoIndicacao').value || '',
      numeroRenovacoes: parseInt(f.namedItem('numeroRenovacoes').value || 0),
      bloqueado: false,
    };
    DB.clientes.push(newClient); saveState(DB); closeModal(); renderAll();
  });

  openModal(tpl);
});

/* PLANOS */
function renderPlansList(){
  const container = qs('#plansList'); if (!container) return;
  container.innerHTML = '';
  DB.planos.forEach(p => {
    const row = document.createElement('div'); row.className='item-row';
    const col = document.createElement('div'); col.className='item-col';
    col.innerHTML = `<strong>${p.nome}</strong><span class="muted">Pontos: ${p.pontos} • Valor: R$ ${p.valor.toFixed(2)} • Validade: ${p.validade} meses</span>`;
    const actions = document.createElement('div');
    const editBtn = document.createElement('button'); editBtn.className='small-btn'; editBtn.textContent='✏️ Editar';
    editBtn.addEventListener('click', ()=> openEditPlan(p.id));
    actions.appendChild(editBtn);
    row.appendChild(col); row.appendChild(actions);
    container.appendChild(row);
  });
}

qs('#btnNewPlan').addEventListener('click', ()=> {
  const tpl = qs('#planFormTpl').content.cloneNode(true);
  const form = tpl.querySelector('form'); form.querySelector('#cancelPlan').addEventListener('click', closeModal);
  form.addEventListener('submit', (e)=>{ e.preventDefault();
    const f = form.elements; const newP = { id: 'p' + uid(), nome: f.namedItem('nome').value, pontos: parseInt(f.namedItem('pontos').value||0), valor: parseFloat(f.namedItem('valor').value||0), validade: parseInt(f.namedItem('validade').value||1), linkCartao: f.namedItem('linkCartao').value||'', chavePIX: f.namedItem('chavePIX').value||'' };
    DB.planos.push(newP); saveState(DB); closeModal(); renderPlansList(); renderClientsList();
  });
});

function openEditPlan(planId){
  const plan = DB.planos.find(p=>p.id===planId); if (!plan) return;
  const tpl = qs('#planFormTpl').content.cloneNode(true); const form = tpl.querySelector('form');
  const f = form.elements; f.namedItem('nome').value = plan.nome; f.namedItem('pontos').value = plan.pontos; f.namedItem('valor').value = plan.valor; f.namedItem('validade').value = plan.validade; f.namedItem('linkCartao').value = plan.linkCartao; f.namedItem('chavePIX').value = plan.chavePIX;
  form.querySelector('#cancelPlan').addEventListener('click', closeModal);
  form.addEventListener('submit', (e)=>{ e.preventDefault(); if (!confirm('Salvar alterações do plano?')) return; plan.nome = f.namedItem('nome').value; plan.pontos = parseInt(f.namedItem('pontos').value||0); plan.valor = parseFloat(f.namedItem('valor').value||0); plan.validade = parseInt(f.namedItem('validade').value||1); plan.linkCartao = f.namedItem('linkCartao').value||''; plan.chavePIX = f.namedItem('chavePIX').value||''; saveState(DB); closeModal(); renderPlansList(); renderClientsList(); });
  openModal(tpl);
}

/* SERVIDORES */
function renderServersList(){
  const container = qs('#serversList'); if (!container) return; container.innerHTML = '';
  DB.servidores.forEach(s => {
    const row = document.createElement('div'); row.className='item-row';
    const col = document.createElement('div'); col.className='item-col';
    col.innerHTML = `<strong>${s.nome}</strong><span class="muted">URL1: ${s.url1 || '—'} • URL2: ${s.url2 || '—'} • App1: ${s.app1 || '—'} • App2: ${s.app2 || '—'}</span>`;
    const actions = document.createElement('div');
    const editBtn = document.createElement('button'); editBtn.className='small-btn'; editBtn.textContent='✏️ Editar';
    editBtn.addEventListener('click', ()=> openEditServer(s.id));
    actions.appendChild(editBtn);
    row.appendChild(col); row.appendChild(actions);
    container.appendChild(row);
  });
}

qs('#btnNewServer').addEventListener('click', ()=> {
  const tpl = qs('#serverFormTpl').content.cloneNode(true);
  const form = tpl.querySelector('form'); form.querySelector('#cancelServer').addEventListener('click', closeModal);
  form.addEventListener('submit', (e)=>{ e.preventDefault(); const f = form.elements; const newS = { id: 's' + uid(), nome: f.namedItem('nome').value, url1: f.namedItem('url1').value||'', url2: f.namedItem('url2').value||'', app1: f.namedItem('app1').value||'', app2: f.namedItem('app2').value||'' }; DB.servidores.push(newS); saveState(DB); closeModal(); renderServersList(); renderClientsList(); });
  openModal(tpl);
});

function openEditServer(serverId){
  const s = DB.servidores.find(x=>x.id===serverId); if (!s) return; const tpl = qs('#serverFormTpl').content.cloneNode(true); const form = tpl.querySelector('form'); const f = form.elements; f.namedItem('nome').value = s.nome; f.namedItem('url1').value = s.url1; f.namedItem('url2').value = s.url2; f.namedItem('app1').value = s.app1; f.namedItem('app2').value = s.app2; form.querySelector('#cancelServer').addEventListener('click', closeModal); form.addEventListener('submit', (e)=>{ e.preventDefault(); if (!confirm('Salvar alterações do servidor?')) return; s.nome = f.namedItem('nome').value; s.url1 = f.namedItem('url1').value; s.url2 = f.namedItem('url2').value; s.app1 = f.namedItem('app1').value; s.app2 = f.namedItem('app2').value; saveState(DB); closeModal(); renderServersList(); renderClientsList(); }); openModal(tpl);
}

/* MODAL UTIL */
function openModal(content){
  const modal = qs('#modal'); const panel = qs('#modalContent'); panel.innerHTML = '';
  if (content instanceof DocumentFragment || content instanceof Node) panel.appendChild(content); else panel.innerHTML = content;
  modal.classList.remove('hidden'); modal.setAttribute('aria-hidden','false');
}
function closeModal(){ const modal = qs('#modal'); modal.classList.add('hidden'); modal.setAttribute('aria-hidden','true'); qs('#modalContent').innerHTML = ''; }
qs('#modalClose').addEventListener('click', closeModal);
qs('#modal').addEventListener('click', (e)=> { if (e.target === qs('#modal')) closeModal(); });

/* UI: search / toggle */
function bindGlobalUI(){
  const search = qs('#searchInput'); if (search) search.addEventListener('input', ()=> { state.filter.text = qs('#searchInput').value; renderClientsList(); });
  const toggle = qs('#onlyNotifiedToggle'); if (toggle) toggle.addEventListener('change', ()=> { state.filter.onlyNotified = qs('#onlyNotifiedToggle').checked; renderClientsList(); });
  document.addEventListener('keydown', (e)=> { if (e.key === 'Escape') closeModal(); });
}

/* START */
init();
