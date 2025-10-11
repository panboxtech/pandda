/* app.js — Pandda v2
   - Sidebar está em template e será injetada apenas após login (evita exposição na tela de login)
   - Topbar permanece fixa e botão do menu disponível sempre
   - Login centralizado e responsivo
   - Layout adaptado para que lista e formulários respeitem largura da tela
*/

/* Utilitários */
const qs = (s, ctx=document) => ctx.querySelector(s);
const qsa = (s, ctx=document) => Array.from(ctx.querySelectorAll(s));
const fmtDate = d => { if (!d) return ''; const dt = new Date(d); if (isNaN(dt)) return d; return dt.toISOString().slice(0,10); };
const addDays = (d, days) => { const dt = new Date(d); dt.setDate(dt.getDate()+days); return fmtDate(dt); };
const addMonths = (d, months) => { const dt = new Date(d); dt.setMonth(dt.getMonth()+months); return fmtDate(dt); };
const uid = () => Math.random().toString(36).slice(2,9);

/* Storage / Mock */
const STORAGE_KEY = 'pandda_mock_v2';
function defaultData(){
  const planos = [
    { id: 'p1', nome: 'Básico', pontos: 10, valor: 29.90, validade: 1, linkCartao: '', chavePIX: 'pix-basico' },
    { id: 'p2', nome: 'Pro', pontos: 30, valor: 69.90, validade: 3, linkCartao: '', chavePIX: 'pix-pro' },
    { id: 'p3', nome: 'Anual', pontos: 120, valor: 199.90, validade: 12, linkCartao: '', chavePIX: 'pix-anual' },
  ];
  const servidores = [
    { id: 's1', nome: 'Servidor Alpha', url1:'https://alpha.example', url2:'', app1:'app-alpha', app2:'' },
    { id: 's2', nome: 'Servidor Beta', url1:'https://beta.example', url2:'', app1:'app-beta', app2:'' },
    { id: 's3', nome: 'Servidor Gamma', url1:'https://gamma.example', url2:'', app1:'', app2:'' },
  ];
  const baseDate = new Date();
  const clientes = [
    { id:'c1', nome:'Ana Silva', whatsapp:'+5591988887777', email:'ana@example.com', dataCriacao: fmtDate(addDays(baseDate,-120)), dataVencimento: fmtDate(addMonths(baseDate,1)), planoId:'p1', servidor1:'s1', servidor2:'', usuario1:'ana1', senha1:'pass', usuario2:'', senha2:'', statusNotificacao:true, observacoes:'Cliente VIP', codigoIndicacao:'X1', numeroRenovacoes:0, bloqueado:false },
    { id:'c2', nome:'Bruno Costa', whatsapp:'+5591999991111', email:'bruno@example.com', dataCriacao: fmtDate(addDays(baseDate,-60)), dataVencimento: fmtDate(addDays(baseDate,3)), planoId:'p2', servidor1:'s2', servidor2:'s3', usuario1:'bruno', senha1:'pwd', usuario2:'', senha2:'', statusNotificacao:false, observacoes:'Pendente', codigoIndicacao:'', numeroRenovacoes:1, bloqueado:false },
    { id:'c3', nome:'Carla Nunes', whatsapp:'+5591983332222', email:'carla@example.com', dataCriacao: fmtDate(addDays(baseDate,-400)), dataVencimento: fmtDate(addDays(baseDate,-2)), planoId:'p1', servidor1:'s3', servidor2:'', usuario1:'carla', senha1:'123', usuario2:'', senha2:'', statusNotificacao:false, observacoes:'Aguardando', codigoIndicacao:'Y2', numeroRenovacoes:2, bloqueado:false },
    { id:'c4', nome:'Diego Lima', whatsapp:'+5591977776666', email:'diego@example.com', dataCriacao: fmtDate(addDays(baseDate,-30)), dataVencimento: fmtDate(addDays(baseDate,-45)), planoId:'p3', servidor1:'s1', servidor2:'', usuario1:'diego', senha1:'xxx', usuario2:'', senha2:'', statusNotificacao:true, observacoes:'Vencido >30', codigoIndicacao:'', numeroRenovacoes:0, bloqueado:false },
    { id:'c5', nome:'Elisa Rocha', whatsapp:'+5591966665555', email:'elisa@example.com', dataCriacao: fmtDate(addDays(baseDate,-10)), dataVencimento: fmtDate(addDays(baseDate,9)), planoId:'p1', servidor1:'s2', servidor2:'', usuario1:'elisa', senha1:'abc', usuario2:'', senha2:'', statusNotificacao:false, observacoes:'', codigoIndicacao:'Z3', numeroRenovacoes:0, bloqueado:false },
    { id:'c6', nome:'Fábio Souza', whatsapp:'+5591955554444', email:'fabio@example.com', dataCriacao: fmtDate(addDays(baseDate,-200)), dataVencimento: fmtDate(addDays(baseDate,-10)), planoId:'p2', servidor1:'s1', servidor2:'s3', usuario1:'fabio', senha1:'pw', usuario2:'fabio2', senha2:'pw2', statusNotificacao:true, observacoes:'', codigoIndicacao:'', numeroRenovacoes:3, bloqueado:false },
    { id:'c7', nome:'Gisele Martins', whatsapp:'+5591944443333', email:'gisele@example.com', dataCriacao: fmtDate(addDays(baseDate,-5)), dataVencimento: fmtDate(addDays(baseDate,0)), planoId:'p3', servidor1:'s3', servidor2:'', usuario1:'gisele', senha1:'p', usuario2:'', senha2:'', statusNotificacao:false, observacoes:'Vence hoje', codigoIndicacao:'', numeroRenovacoes:0, bloqueado:false },
    { id:'c8', nome:'Hugo Pereira', whatsapp:'+5591933332221', email:'hugo@example.com', dataCriacao: fmtDate(addDays(baseDate,-15)), dataVencimento: fmtDate(addDays(baseDate,35)), planoId:'p2', servidor1:'s2', servidor2:'', usuario1:'hugo', senha1:'h1', usuario2:'', senha2:'', statusNotificacao:true, observacoes:'', codigoIndicacao:'', numeroRenovacoes:0, bloqueado:false },
    { id:'c9', nome:'Isabela Moura', whatsapp:'+5591922221111', email:'isabela@example.com', dataCriacao: fmtDate(addDays(baseDate,-365)), dataVencimento: fmtDate(addDays(baseDate,-20)), planoId:'p1', servidor1:'s1', servidor2:'', usuario1:'isabela', senha1:'pw', usuario2:'', senha2:'', statusNotificacao:false, observacoes:'Vencido <30', codigoIndicacao:'A9', numeroRenovacoes:1, bloqueado:false },
    { id:'c10', nome:'João Pedro', whatsapp:'+5591911110000', email:'joao@example.com', dataCriacao: fmtDate(addDays(baseDate,-2)), dataVencimento: fmtDate(addMonths(baseDate,6)), planoId:'p3', servidor1:'s2', servidor2:'s1', usuario1:'joao', senha1:'jo', usuario2:'', senha2:'', statusNotificacao:true, observacoes:'Novo', codigoIndicacao:'B1', numeroRenovacoes:0, bloqueado:false },
  ];
  return { planos, servidores, clientes };
}
function loadState(){ const raw = localStorage.getItem(STORAGE_KEY); if (!raw) { const d = defaultData(); saveState(d); return d; } try { return JSON.parse(raw); } catch(e) { const d = defaultData(); saveState(d); return d; } }
function saveState(s){ localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
let DB = loadState();

/* State e init */
const state = { filter: { text:'', onlyNotified:false, dateRange:null } };
function init(){
  bindTopbar();
  bindAuth();
  bindGlobalUI();
  renderAll();
}

/* Topbar + sidebar injection/toggle */
function bindTopbar(){
  const toggle = qs('#sidebarToggle');
  toggle.addEventListener('click', () => {
    const sidebar = qs('#sidebar');
    if (!sidebar) return;
    if (window.matchMedia('(max-width:880px)').matches) sidebar.classList.toggle('open');
    else sidebar.classList.toggle('collapsed');
  });

  // click outside closes mobile sidebar if open
  document.addEventListener('click', (e) => {
    if (!window.matchMedia('(max-width:880px)').matches) return;
    const sidebar = qs('#sidebar');
    const toggleBtn = qs('#sidebarToggle');
    if (!sidebar) return;
    const clickedInside = sidebar.contains(e.target) || toggleBtn.contains(e.target);
    if (!clickedInside && sidebar.classList.contains('open')) sidebar.classList.remove('open');
  });
}

/* Auth: injecta sidebar apenas quando entrar no app, remove na saída */
function bindAuth(){
  const btnLogin = qs('#btnLogin');
  const toggleEye = qs('#toggleEye');
  const loginView = qs('#loginView');
  const appView = qs('#app');

  toggleEye && toggleEye.addEventListener('click', ()=> {
    const p = qs('#loginPass'); if (!p) return; p.type = p.type === 'password' ? 'text' : 'password';
  });

  btnLogin && btnLogin.addEventListener('click', ()=> {
    // injetar sidebar antes de mostrar app
    injectSidebar();
    // mostrar app
    loginView.classList.remove('active'); loginView.setAttribute('aria-hidden','true');
    appView.classList.add('active'); appView.setAttribute('aria-hidden','false');
    showView('clientesView');
  });
}

/* Injeta sidebar a partir do template (somente uma vez) */
function injectSidebar(){
  if (qs('#sidebar')) return; // já injetado
  const tpl = qs('#sidebarTpl');
  if (!tpl) return;
  const clone = tpl.content.cloneNode(true);
  document.body.insertBefore(clone, qs('#app'));
  // após inserção, bind dos botões do sidebar
  bindNav();
  const logout = qs('#logoutBtn');
  logout && logout.addEventListener('click', ()=> {
    // remover sidebar do DOM e voltar ao login
    const sb = qs('#sidebar'); sb && sb.remove();
    qs('#app').classList.remove('active'); qs('#app').setAttribute('aria-hidden','true');
    qs('#loginView').classList.add('active'); qs('#loginView').setAttribute('aria-hidden','false');
    qsa('.panel').forEach(p => p.classList.remove('active'));
  });
}

/* Navegação (assume que sidebar foi injetada) */
function bindNav(){
  qsa('.nav-btn').forEach(btn => {
    btn.addEventListener('click', ()=> {
      qsa('.nav-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.dataset.view; showView(view);
      if (window.matchMedia('(max-width:880px)').matches) qs('#sidebar') && qs('#sidebar').classList.remove('open');
    });
  });
}

function showView(id){
  qsa('.panel').forEach(p => p.classList.remove('active'));
  const target = qs('#' + id); if (target) target.classList.add('active');
  qsa('.nav-btn').forEach(b => { if (b.dataset.view === id) b.classList.add('active'); else b.classList.remove('active'); });
  renderAll();
}

/* Rendering */
function renderAll(){
  renderSummaryCards(); renderClientsList(); renderPlansList(); renderServersList();
}

/* Summary cards */
function computeClientBuckets(){
  const today = new Date();
  const daysDiff = (d)=> Math.floor((new Date(d)-today)/(1000*60*60*24));
  const cs = DB.clientes;
  return {
    total: cs.length,
    ativos: cs.filter(c => new Date(c.dataVencimento) >= new Date()).length,
    vencendo: cs.filter(c => { const d = daysDiff(c.dataVencimento); return d>=0 && d<=7; }).length,
    vencidosMenos30: cs.filter(c => { const d = daysDiff(c.dataVencimento); return d<0 && d>=-30; }).length,
    vencidosMais30: cs.filter(c => { const d = daysDiff(c.dataVencimento); return d< -30; }).length
  };
}
function renderSummaryCards(){
  const container = qs('#summaryCards'); if (!container) return; container.innerHTML='';
  const b = computeClientBuckets();
  const items = [
    {id:'card-ativos', title:'Clientes ativos', value:b.ativos, filter:{type:'ativos'}},
    {id:'card-vencendo', title:'Vencendo (7 dias)', value:b.vencendo, filter:{type:'vencendo'}},
    {id:'card-vencidos-menor', title:'Vencidos < 30 dias', value:b.vencidosMenos30, filter:{type:'vencidosMenos30'}},
    {id:'card-vencidos-maior', title:'Vencidos > 30 dias', value:b.vencidosMais30, filter:{type:'vencidosMais30'}},
    {id:'card-total', title:'Total', value:b.total, filter:{type:'total'}}
  ];
  items.forEach(it => {
    const el = document.createElement('div'); el.className='card'; el.id=it.id;
    el.innerHTML = `<h3>${it.title}</h3><p>${it.value}</p>`;
    el.addEventListener('click', ()=> { state.filter.dateRange = it.filter; renderClientsList(); });
    container.appendChild(el);
  });
}

/* Clients list */
function matchesSearch(c, t){ if (!t) return true; t = t.toLowerCase(); return (c.nome||'').toLowerCase().includes(t) || (c.usuario1||'').toLowerCase().includes(t) || (c.whatsapp||'').toLowerCase().includes(t); }
function matchesSummaryFilter(c, f){ if (!f) return true; const diff = Math.floor((new Date(c.dataVencimento)-new Date())/(1000*60*60*24)); switch(f.type){ case 'ativos': return diff>=0; case 'vencendo': return diff>=0 && diff<=7; case 'vencidosMenos30': return diff<0 && diff>=-30; case 'vencidosMais30': return diff< -30; case 'total': return true; default: return true; } }

function renderClientsList(){
  const list = qs('#clientsList'); if (!list) return; list.innerHTML='';
  const text = qs('#searchInput') ? qs('#searchInput').value.trim() : '';
  const onlyNotified = qs('#onlyNotifiedToggle') ? qs('#onlyNotifiedToggle').checked : false;
  const dateFilter = state.filter.dateRange;
  const out = DB.clientes
    .filter(c => matchesSearch(c,text))
    .filter(c => onlyNotified ? c.statusNotificacao === false : true)
    .filter(c => matchesSummaryFilter(c,dateFilter))
    .sort((a,b)=> new Date(a.dataVencimento) - new Date(b.dataVencimento));
  out.forEach(c => list.appendChild(clientRow(c)));
}

function clientRow(client){
  const row = document.createElement('div'); row.className='client-row'; row.dataset.id=client.id;
  if (client.bloqueado) row.style.opacity='0.5';
  const left = document.createElement('div'); left.className='client-left';
  const name = document.createElement('div'); name.className='client-name'; name.textContent = client.nome;
  const wa = document.createElement('div'); wa.className='whatsapp'; wa.innerHTML = `${client.whatsapp || ''} <button title="Copiar" class="small-btn copy-btn">📋</button>`;
  left.appendChild(name); left.appendChild(wa);
  const right = document.createElement('div'); right.className='actions';
  const dt = document.createElement('div'); dt.className='muted'; dt.textContent = 'Vence: ' + fmtDate(client.dataVencimento);
  const notifyBtn = document.createElement('button'); notifyBtn.className='small-btn notify-btn'; notifyBtn.textContent='💬 Notificar'; notifyBtn.addEventListener('click', ()=> notifyClient(client.id));
  const renewBtn = document.createElement('button'); renewBtn.className='small-btn renew-btn'; renewBtn.textContent='🔁 Renovar'; renewBtn.addEventListener('click', ()=> openRenewModal(client.id));
  const editBtn = document.createElement('button'); editBtn.className='small-btn'; editBtn.textContent='✏️ Editar'; editBtn.addEventListener('click', ()=> openEditClient(client.id, row));
  right.appendChild(dt); right.appendChild(notifyBtn); right.appendChild(renewBtn); right.appendChild(editBtn);
  const summary = document.createElement('div'); summary.className='client-summary'; summary.appendChild(left); summary.appendChild(right);

  const expandToggle = document.createElement('button'); expandToggle.className='expand-toggle';
  expandToggle.innerHTML = `<span>Mostrar mais informações</span><span class="arrow">▼</span>`;
  expandToggle.addEventListener('click', ()=> row.classList.toggle('expanded'));

  const details = document.createElement('div'); details.className='client-details'; details.innerHTML = clientDetailsHtml(client);

  // copy WA
  wa.querySelector('.copy-btn').addEventListener('click', (e)=> { navigator.clipboard?.writeText(client.whatsapp||'')?.then(()=> { e.target.textContent='✔'; setTimeout(()=> e.target.textContent='📋',900); }); });

  // block inside details
  const blockBtn = details.querySelector('.block-client');
  blockBtn && blockBtn.addEventListener('click', ()=> { if (!confirm(`Bloquear cliente ${client.nome}?`)) return; client.bloqueado = true; saveState(DB); renderAll(); });

  row.appendChild(summary); row.appendChild(expandToggle); row.appendChild(details);
  return row;
}
function clientDetailsHtml(client){
  const plano = DB.planos.find(p=>p.id===client.planoId);
  const s1 = DB.servidores.find(s=>s.id===client.servidor1);
  const s2 = DB.servidores.find(s=>s.id===client.servidor2);
  return `
    <div>
      <div><strong>Plano:</strong> ${plano ? plano.nome : '—'}</div>
      <div><strong>Servidor 1:</strong> ${s1 ? s1.nome : '—'}</div>
      <div><strong>Servidor 2:</strong> ${s2 ? s2.nome : '—'}</div>
      <div><strong>Usuário 1:</strong> ${client.usuario1}</div>
      <div><strong>Senha 1:</strong> ${client.senha1}</div>
      <div><strong>Usuário 2:</strong> ${client.usuario2}</div>
      <div><strong>Senha 2:</strong> ${client.senha2}</div>
      <div><strong>Status Notificação:</strong> ${client.statusNotificacao ? 'Notificado' : 'Não notificado'}</div>
      <div><strong>Observações:</strong> ${client.observacoes}</div>
      <div class="muted">Código indicação: ${client.codigoIndicacao} • Nº renovações: ${client.numeroRenovacoes}</div>
      <div style="margin-top:8px;"><button class="secondary block-client">Bloquear cliente</button></div>
    </div>
  `;
}

/* Notify (simulado) */
function notifyClient(id){ const c = DB.clientes.find(x=>x.id===id); if (!c) return; c.statusNotificacao = true; saveState(DB); renderClientsList(); alert(`Notificação simulada para ${c.nome} (${c.whatsapp}).`); }

/* Renovação */
function openRenewModal(clientId){ const client = DB.clientes.find(c=>c.id===clientId); if (!client) return; openModal(buildRenewForm(client)); }
function buildRenewForm(client){
  const div = document.createElement('div'); const title = document.createElement('h2'); title.textContent = `Renovar ${client.nome}`; div.appendChild(title);
  const form = document.createElement('form'); form.innerHTML = `
    <label class="field"><span>Plano</span><select name="planoId"></select></label>
    <label class="field"><span>Nova data de vencimento</span><input name="dataVencimento" type="date"></label>
    <div class="form-actions"><button type="button" id="cancelRenew" class="secondary">Cancelar</button><button type="submit" class="primary">Renovar</button></div>
  `;
  const sel = form.querySelector('select[name=planoId]'); DB.planos.forEach(p=> { const o=document.createElement('option'); o.value=p.id; o.textContent=`${p.nome} — ${p.validade} mês(es)`; if(p.id===client.planoId) o.selected=true; sel.appendChild(o); });
  const dateIn = form.querySelector('input[name=dataVencimento]'); const selectedPlan = DB.planos.find(p=>p.id===sel.value);
  dateIn.value = addMonths(client.dataVencimento || fmtDate(new Date()), selectedPlan ? selectedPlan.validade : 1);
  sel.addEventListener('change', ()=> { const p = DB.planos.find(x=>x.id===sel.value); dateIn.value = p ? addMonths(client.dataVencimento || fmtDate(new Date()), p.validade) : dateIn.value; });
  form.querySelector('#cancelRenew').addEventListener('click', closeModal);
  form.addEventListener('submit', (e)=> { e.preventDefault(); client.planoId = sel.value; client.dataVencimento = dateIn.value; client.numeroRenovacoes = (client.numeroRenovacoes || 0) + 1; saveState(DB); closeModal(); renderAll(); alert(`Cliente ${client.nome} renovado até ${client.dataVencimento}.`); });
  div.appendChild(form); return div;
}

/* Edit / New client (modal responsivo) */
function openEditClient(clientId, rowNode){
  const client = DB.clientes.find(c=>c.id===clientId); if (!client) return;
  const tpl = buildClientFormTemplate(client);
  openModal(tpl);
}
function buildClientFormTemplate(client){
  const frag = document.createDocumentFragment();
  const form = document.createElement('form'); form.className='form';
  form.innerHTML = `
    <h2>${client ? 'Editar' : 'Novo'} Cliente</h2>
    <div class="two-col">
      <label class="field"><span>Nome</span><input name="nome" required></label>
      <label class="field"><span>WhatsApp</span><input name="whatsapp"></label>
    </div>
    <div class="two-col">
      <label class="field"><span>E‑mail</span><input name="email" type="email"></label>
      <label class="field"><span>Data de criação</span><input name="dataCriacao" type="date"></label>
    </div>
    <div class="two-col">
      <label class="field"><span>Data de vencimento</span><input name="dataVencimento" type="date"></label>
      <label class="field"><span>Plano</span><select name="planoId"></select></label>
    </div>
    <div class="two-col">
      <label class="field"><span>Servidor 1</span><select name="servidor1"></select></label>
      <label class="field"><span>Servidor 2</span><select name="servidor2"></select></label>
    </div>
    <div class="two-col">
      <label class="field"><span>Usuário 1</span><input name="usuario1"></label>
      <label class="field"><span>Senha 1</span><input name="senha1"></label>
    </div>
    <div class="two-col">
      <label class="field"><span>Usuário 2</span><input name="usuario2"></label>
      <label class="field"><span>Senha 2</span><input name="senha2"></label>
    </div>
    <label class="field"><span>Observações</span><textarea name="observacoes"></textarea></label>
    <div class="two-col">
      <label class="field"><span>Código Indicação</span><input name="codigoIndicacao"></label>
      <label class="field"><span>Nº Renovações</span><input name="numeroRenovacoes" type="number" min="0"></label>
    </div>
    <div class="form-actions">
      <button type="button" id="cancelClient" class="secondary">Cancelar</button>
      <button type="submit" class="primary">Salvar</button>
    </div>
  `;
  // preencher selects
  const planoSel = form.querySelector('select[name=planoId]');
  DB.planos.forEach(p => { const o=document.createElement('option'); o.value=p.id; o.textContent=p.nome; planoSel.appendChild(o); });
  const srv1 = form.querySelector('select[name=servidor1]'); const srv2 = form.querySelector('select[name=servidor2]');
  const emptyOpt = document.createElement('option'); emptyOpt.value=''; emptyOpt.textContent='—';
  srv1.appendChild(emptyOpt.cloneNode(true)); srv2.appendChild(emptyOpt.cloneNode(true));
  DB.servidores.forEach(s => { const o=document.createElement('option'); o.value=s.id; o.textContent=s.nome; srv1.appendChild(o); srv2.appendChild(o.cloneNode(true)); });

  // preencher valores se editar
  if (client){
    const f = form.elements;
    f.namedItem('nome').value = client.nome || '';
    f.namedItem('whatsapp').value = client.whatsapp || '';
    f.namedItem('email').value = client.email || '';
    f.namedItem('dataCriacao').value = client.dataCriacao || '';
    f.namedItem('dataVencimento').value = client.dataVencimento || '';
    f.namedItem('planoId').value = client.planoId || '';
    f.namedItem('servidor1').value = client.servidor1 || '';
    f.namedItem('servidor2').value = client.servidor2 || '';
    f.namedItem('usuario1').value = client.usuario1 || '';
    f.namedItem('senha1').value = client.senha1 || '';
    f.namedItem('usuario2').value = client.usuario2 || '';
    f.namedItem('senha2').value = client.senha2 || '';
    f.namedItem('observacoes').value = client.observacoes || '';
    f.namedItem('codigoIndicacao').value = client.codigoIndicacao || '';
    f.namedItem('numeroRenovacoes').value = client.numeroRenovacoes || 0;
  }

  form.querySelector('#cancelClient').addEventListener('click', closeModal);
  form.addEventListener('submit', (e)=> {
    e.preventDefault();
    if (!confirm('Salvar alterações do cliente?')) return;
    const f = form.elements;
    if (client){
      client.nome = f.namedItem('nome').value;
      client.whatsapp = f.namedItem('whatsapp').value;
      client.email = f.namedItem('email').value;
      client.dataCriacao = f.namedItem('dataCriacao').value;
      client.dataVencimento = f.namedItem('dataVencimento').value;
      client.planoId = f.namedItem('planoId').value;
      client.servidor1 = f.namedItem('servidor1').value;
      client.servidor2 = f.namedItem('servidor2').value;
      client.usuario1 = f.namedItem('usuario1').value;
      client.senha1 = f.namedItem('senha1').value;
      client.usuario2 = f.namedItem('usuario2').value;
      client.senha2 = f.namedItem('senha2').value;
      client.observacoes = f.namedItem('observacoes').value;
      client.codigoIndicacao = f.namedItem('codigoIndicacao').value;
      client.numeroRenovacoes = parseInt(f.namedItem('numeroRenovacoes').value || 0);
    } else {
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
        bloqueado: false
      };
      DB.clientes.push(newClient);
    }
    saveState(DB); closeModal(); renderAll();
  });

  frag.appendChild(form); return frag;
}

/* New client button */
qs('#btnNewClient') && qs('#btnNewClient').addEventListener('click', ()=> openModal(buildClientFormTemplate(null)));

/* Plans rendering and create/edit */
function renderPlansList(){ const c = qs('#plansList'); if (!c) return; c.innerHTML=''; DB.planos.forEach(p=> { const row=document.createElement('div'); row.className='item-row'; const col=document.createElement('div'); col.className='item-col'; col.innerHTML=`<strong>${p.nome}</strong><span class="muted">Pontos: ${p.pontos} • Valor: R$ ${p.valor.toFixed(2)} • Validade: ${p.validade} meses</span>`; const actions=document.createElement('div'); const edit=document.createElement('button'); edit.className='small-btn'; edit.textContent='✏️ Editar'; edit.addEventListener('click', ()=> openEditPlan(p.id)); actions.appendChild(edit); row.appendChild(col); row.appendChild(actions); c.appendChild(row); }); }
qs('#btnNewPlan') && qs('#btnNewPlan').addEventListener('click', ()=> {
  const tpl = document.createElement('div');
  tpl.innerHTML = `
    <form class="form">
      <h2>Novo Plano</h2>
      <label class="field"><span>Nome</span><input name="nome" required></label>
      <div class="two-col">
        <label class="field"><span>Pontos</span><input name="pontos" type="number" min="0"></label>
        <label class="field"><span>Valor</span><input name="valor" type="number" step="0.01"></label>
      </div>
      <div class="two-col">
        <label class="field"><span>Validade (meses)</span><input name="validade" type="number" min="1" required></label>
        <label class="field"><span>Link Cartão</span><input name="linkCartao"></label>
      </div>
      <label class="field"><span>Chave PIX</span><input name="chavePIX"></label>
      <div class="form-actions"><button type="button" id="cancelPlan" class="secondary">Cancelar</button><button type="submit" class="primary">Salvar</button></div>
    </form>
  `;
  const form = tpl.querySelector('form');
  form.querySelector('#cancelPlan').addEventListener('click', closeModal);
  form.addEventListener('submit', (e)=> { e.preventDefault(); const f = form.elements; const newP = { id:'p'+uid(), nome:f.namedItem('nome').value, pontos:parseInt(f.namedItem('pontos').value||0), valor:parseFloat(f.namedItem('valor').value||0), validade:parseInt(f.namedItem('validade').value||1), linkCartao:f.namedItem('linkCartao').value||'', chavePIX:f.namedItem('chavePIX').value||'' }; DB.planos.push(newP); saveState(DB); closeModal(); renderPlansList(); renderClientsList(); });
  openModal(tpl);
});
function openEditPlan(id){ const p = DB.planos.find(x=>x.id===id); if (!p) return; const tpl = document.createElement('div'); tpl.innerHTML = `
  <form class="form"><h2>Editar Plano</h2>
  <label class="field"><span>Nome</span><input name="nome" required></label>
  <div class="two-col">
    <label class="field"><span>Pontos</span><input name="pontos" type="number" min="0"></label>
    <label class="field"><span>Valor</span><input name="valor" type="number" step="0.01"></label>
  </div>
  <div class="two-col">
    <label class="field"><span>Validade (meses)</span><input name="validade" type="number" min="1" required></label>
    <label class="field"><span>Link Cartão</span><input name="linkCartao"></label>
  </div>
  <label class="field"><span>Chave PIX</span><input name="chavePIX"></label>
  <div class="form-actions"><button type="button" id="cancelPlan" class="secondary">Cancelar</button><button type="submit" class="primary">Salvar</button></div></form>`; const form = tpl.querySelector('form'); const f=form.elements; f.namedItem('nome').value=p.nome; f.namedItem('pontos').value=p.pontos; f.namedItem('valor').value=p.valor; f.namedItem('validade').value=p.validade; f.namedItem('linkCartao').value=p.linkCartao; f.namedItem('chavePIX').value=p.chavePIX; form.querySelector('#cancelPlan').addEventListener('click', closeModal); form.addEventListener('submit', (e)=>{ e.preventDefault(); if(!confirm('Salvar alterações do plano?')) return; p.nome=f.namedItem('nome').value; p.pontos=parseInt(f.namedItem('pontos').value||0); p.valor=parseFloat(f.namedItem('valor').value||0); p.validade=parseInt(f.namedItem('validade').value||1); p.linkCartao=f.namedItem('linkCartao').value||''; p.chavePIX=f.namedItem('chavePIX').value||''; saveState(DB); closeModal(); renderPlansList(); renderClientsList(); }); openModal(tpl); }

/* Servers render/create/edit */
function renderServersList(){ const c = qs('#serversList'); if (!c) return; c.innerHTML=''; DB.servidores.forEach(s=> { const row=document.createElement('div'); row.className='item-row'; const col=document.createElement('div'); col.className='item-col'; col.innerHTML=`<strong>${s.nome}</strong><span class="muted">URL1: ${s.url1||'—'} • URL2: ${s.url2||'—'} • App1: ${s.app1||'—'} • App2: ${s.app2||'—'}</span>`; const actions=document.createElement('div'); const edit=document.createElement('button'); edit.className='small-btn'; edit.textContent='✏️ Editar'; edit.addEventListener('click', ()=> openEditServer(s.id)); actions.appendChild(edit); row.appendChild(col); row.appendChild(actions); c.appendChild(row); }); }
qs('#btnNewServer') && qs('#btnNewServer').addEventListener('click', ()=> {
  const tpl = document.createElement('div'); tpl.innerHTML = `
    <form class="form">
      <h2>Novo Servidor</h2>
      <label class="field"><span>Nome</span><input name="nome" required></label>
      <div class="two-col">
        <label class="field"><span>URL1</span><input name="url1"></label>
        <label class="field"><span>URL2</span><input name="url2"></label>
      </div>
      <div class="two-col">
        <label class="field"><span>App1</span><input name="app1"></label>
        <label class="field"><span>App2</span><input name="app2"></label>
      </div>
      <div class="form-actions"><button type="button" id="cancelServer" class="secondary">Cancelar</button><button type="submit" class="primary">Salvar</button></div>
    </form>`; const form = tpl.querySelector('form'); form.querySelector('#cancelServer').addEventListener('click', closeModal); form.addEventListener('submit', (e)=>{ e.preventDefault(); const f=form.elements; const newS={ id:'s'+uid(), nome:f.namedItem('nome').value, url1:f.namedItem('url1').value||'', url2:f.namedItem('url2').value||'', app1:f.namedItem('app1').value||'', app2:f.namedItem('app2').value||'' }; DB.servidores.push(newS); saveState(DB); closeModal(); renderServersList(); renderClientsList(); }); openModal(tpl);
});
function openEditServer(id){ const s = DB.servidores.find(x=>x.id===id); if(!s) return; const tpl=document.createElement('div'); tpl.innerHTML = `
 <form class="form"><h2>Editar Servidor</h2><label class="field"><span>Nome</span><input name="nome" required></label>
 <div class="two-col"><label class="field"><span>URL1</span><input name="url1"></label><label class="field"><span>URL2</span><input name="url2"></label></div>
 <div class="two-col"><label class="field"><span>App1</span><input name="app1"></label><label class="field"><span>App2</span><input name="app2"></label></div>
 <div class="form-actions"><button type="button" id="cancelServer" class="secondary">Cancelar</button><button type="submit" class="primary">Salvar</button></div></form>`; const form=tpl.querySelector('form'); const f=form.elements; f.namedItem('nome').value=s.nome; f.namedItem('url1').value=s.url1; f.namedItem('url2').value=s.url2; f.namedItem('app1').value=s.app1; f.namedItem('app2').value=s.app2; form.querySelector('#cancelServer').addEventListener('click', closeModal); form.addEventListener('submit', (e)=>{ e.preventDefault(); if(!confirm('Salvar alterações do servidor?')) return; s.nome=f.namedItem('nome').value; s.url1=f.namedItem('url1').value; s.url2=f.namedItem('url2').value; s.app1=f.namedItem('app1').value; s.app2=f.namedItem('app2').value; saveState(DB); closeModal(); renderServersList(); renderClientsList(); }); openModal(tpl); }

/* Modal util */
function openModal(content){ const modal = qs('#modal'); const panel = qs('#modalContent'); panel.innerHTML=''; if (content instanceof DocumentFragment || content instanceof Node) panel.appendChild(content); else panel.appendChild(content); modal.classList.remove('hidden'); modal.setAttribute('aria-hidden','false'); }
function closeModal(){ const modal = qs('#modal'); modal.classList.add('hidden'); modal.setAttribute('aria-hidden','true'); qs('#modalContent').innerHTML=''; }
qs('#modalClose') && qs('#modalClose').addEventListener('click', closeModal);
qs('#modal') && qs('#modal').addEventListener('click', (e)=> { if (e.target === qs('#modal')) closeModal(); });

/* Global UI binds */
function bindGlobalUI(){
  const search = qs('#searchInput'); if (search) search.addEventListener('input', ()=> { state.filter.text = search.value; renderClientsList(); });
  const toggle = qs('#onlyNotifiedToggle'); if (toggle) toggle.addEventListener('change', ()=> { state.filter.onlyNotified = toggle.checked; renderClientsList(); });
  document.addEventListener('keydown', (e)=> { if (e.key === 'Escape') { closeModal(); const s = qs('#sidebar'); s && s.classList.remove('open'); } });
}

/* Start */
init();
