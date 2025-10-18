// js/mockData.js
// Mock atualizado com novos campos para Servidores, Apps, Planos e clientes
// Suporta getClients paginado (como antes), create/update/delete compatíveis.
// Notas: quando integrar ao Supabase, preserve as mesmas chaves/nomes de campos.

const state = {
  clients: [],
  servers: [],
  plans: [],
  apps: []
};

function seedMockData() {
  const now = new Date();
  // Servidores: nome, alias
  state.servers = [
    { id: 'srv1', nome: 'Servidor A', alias: 'A' },
    { id: 'srv2', nome: 'Servidor B', alias: 'B' },
    { id: 'srv3', nome: 'Servidor C', alias: 'C' }
  ];

  // Planos: nome, telas, validadeEmMeses, preco
  state.plans = [
    { id: 'pl1', nome: 'Básico', telas: 1, validadeEmMeses: 1, preco: 19.90 },
    { id: 'pl2', nome: 'Standard', telas: 2, validadeEmMeses: 3, preco: 49.90 },
    { id: 'pl3', nome: 'Pro', telas: 5, validadeEmMeses: 12, preco: 199.00 }
  ];

  // Apps: nome, codigoDeAcesso, urlDownloadAndroid, urlDownloadIos, codigoDownloadDownloader, codigoNTDown, multiplosAcessos(Boolean), servidorId
  state.apps = [
    {
      id: 'app1',
      nome: 'MyApp',
      codigoDeAcesso: 'AC-001',
      urlDownloadAndroid: 'https://downloads.example.com/myapp-android.apk',
      urlDownloadIos: 'https://downloads.example.com/myapp-ios.ipa',
      codigoDownloadDownloader: 'DL-001',
      codigoNTDown: 'NT-001',
      multiplosAcessos: false,
      servidorId: 'srv1'
    },
    {
      id: 'app2',
      nome: 'MyApp',
      codigoDeAcesso: 'AC-002',
      urlDownloadAndroid: 'https://downloads.example.com/myapp-android-v2.apk',
      urlDownloadIos: 'https://downloads.example.com/myapp-ios-v2.ipa',
      codigoDownloadDownloader: 'DL-002',
      codigoNTDown: 'NT-002',
      multiplosAcessos: true,
      servidorId: 'srv2'
    },
    {
      id: 'app3',
      nome: 'OtherApp',
      codigoDeAcesso: 'AC-003',
      urlDownloadAndroid: '',
      urlDownloadIos: '',
      codigoDownloadDownloader: '',
      codigoNTDown: '',
      multiplosAcessos: true,
      servidorId: 'srv1'
    }
  ];

  // Clients: adicionamos campos: servers (array até 2 ids), planoId, telas, preco (pode divergir), validade (ISO string),
  // pontosDeAcesso: array de objects { id, appId, servidorId, usuario, senha, conexoesSimultaneas }
  const clients = [];
  for (let i = 1; i <= 40; i++) {
    const daysOffset = (i % 30) - 15;
    const due = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000);
    const plan = state.plans[(i - 1) % state.plans.length];
    // default tela/preco/validade taken from plan
    const validadeDate = addMonthsFromDate(now, plan.validadeEmMeses);
    clients.push({
      id: `c${i}`,
      nome: `Cliente ${i}`,
      phone: `+55 63 9${String(90000000 + i).slice(-8)}`,
      email: `cliente${i}@example.com`,
      dueDate: due.toISOString().slice(0,10),
      notified: i % 4 === 0,
      blocked: false,
      // new fields:
      servidores: i % 3 === 0 ? ['srv1', 'srv2'] : ['srv1'], // up to 2 servers
      planoId: plan.id,
      telas: plan.telas,
      preco: plan.preco,
      validade: validadeDate.toISOString().slice(0,10),
      // pontosDeAcesso: sample: create 1 or 2 per client with apps referencing server
      pontosDeAcesso: generateSamplePontos(i, plan.telas)
    });
  }

  state.clients = clients;

  function addMonthsFromDate(date, months) {
    // naive helper that shifts month and adjusts day overflow to last valid day
    const d = new Date(date.getTime());
    const targetMonth = d.getMonth() + months;
    const target = new Date(d.getFullYear(), targetMonth, d.getDate());
    // if month overflowed and day changed, keep target as-is (consistency handled in UI later)
    return target;
  }

  function generateSamplePontos(index, telas) {
    // generate 1-2 pontos with connections summing to telas (distributed across servers)
    const pontos = [];
    const srv = index % 3 === 0 ? ['srv1','srv2'] : ['srv1'];
    let remaining = telas;
    for (let s = 0; s < srv.length; s++) {
      const serverId = srv[s];
      const availableApps = state.apps.filter(a => a.servidorId === serverId);
      const app = availableApps[0] || state.apps[0];
      const conexoes = s === srv.length -1 ? remaining : Math.max(1, Math.floor(telas / srv.length));
      remaining -= conexoes;
      pontos.push({
        id: `p${index}-${s}`,
        appId: app.id,
        servidorId: serverId,
        usuario: `user${index}${s}`,
        senha: `pass${index}${s}`,
        conexoesSimultaneas: conexoes
      });
    }
    return pontos;
  }
}

// ensure seeded
async function ensureMock() {
  if (state.clients.length === 0) seedMockData();
}

/**
 * getClients - returns page object
 * accepts opts: { page, pageSize, filter, search, sort, notNotified }
 * Same behavior as previous mock with additional fields preserved.
 */
export async function getClients(opts = {}) {
  await ensureMock();
  const { page = 1, pageSize = 12, filter = 'todos', search = '', sort = 'dueDate', notNotified = false } = opts;

  let items = state.clients.map(c => ({ ...c, pontosDeAcesso: (c.pontosDeAcesso || []).map(p=>({ ...p })) }));

  // apply status filter (same as before)
  if (filter && filter !== 'todos') {
    const today = new Date();
    const daysUntil = (dateStr) => {
      const d = new Date(dateStr);
      return Math.floor((d - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / (1000*60*60*24));
    };
    if (filter === 'vencendo') {
      items = items.filter(c => { const du = daysUntil(c.dueDate); return du <= 3 && du >= 0; });
    } else if (filter === 'vencidos_30_less') {
      items = items.filter(c => { const du = daysUntil(c.dueDate); return du < 0 && du >= -30; });
    } else if (filter === 'vencidos_30_plus') {
      items = items.filter(c => { const du = daysUntil(c.dueDate); return du < -30; });
    } else if (filter === 'notificados') {
      items = items.filter(c => !!c.notified);
    } else if (filter === 'bloqueados') {
      items = items.filter(c => !!c.blocked);
    }
  }

  if (notNotified) {
    items = items.filter(c => !c.notified);
  }

  const q = String(search || '').trim().toLowerCase();
  if (q) {
    items = items.filter(c => {
      return (c.nome && c.nome.toLowerCase().includes(q)) ||
             (c.phone && c.phone.toLowerCase().includes(q)) ||
             (c.email && c.email.toLowerCase().includes(q));
    });
  }

  if (sort === 'name') items.sort((a,b) => a.nome.localeCompare(b.nome));
  else if (sort === 'dueDate') items.sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate));

  const total = items.length;
  const validPageSize = Math.max(1, Math.min(200, Number(pageSize) || 12));
  const validPage = Math.max(1, Number(page) || 1);
  const start = (validPage - 1) * validPageSize;
  const end = start + validPageSize;
  const pageItems = items.slice(start, end);

  return { items: pageItems, total, page: validPage, pageSize: validPageSize };
}

// CRUD: clients
export async function createClient(payload) {
  await ensureMock();
  const id = 'c' + (state.clients.length + 1);
  const item = {
    id,
    nome: payload.nome || '',
    phone: payload.phone || '',
    email: payload.email || '',
    dueDate: payload.dueDate || null,
    notified: !!payload.notified,
    blocked: !!payload.blocked,
    servidores: payload.servidores || [],
    planoId: payload.planoId || null,
    telas: typeof payload.telas === 'number' ? payload.telas : (payload.telas ? Number(payload.telas) : 0),
    preco: typeof payload.preco === 'number' ? payload.preco : (payload.preco ? Number(payload.preco) : 0),
    validade: payload.validade || null,
    pontosDeAcesso: payload.pontosDeAcesso ? payload.pontosDeAcesso.map(p => ({ ...p, id: p.id || `p${id}-${Math.random().toString(36).slice(2,6)}` })) : []
  };
  state.clients.push(item);
  return { ...item };
}

export async function updateClient(id, payload) {
  await ensureMock();
  const idx = state.clients.findIndex(c => c.id === id);
  if (idx === -1) throw new Error('Cliente não encontrado');
  state.clients[idx] = { ...state.clients[idx], ...payload };
  return { ...state.clients[idx] };
}

export async function deleteClient(id) {
  await ensureMock();
  state.clients = state.clients.filter(c => c.id !== id);
  return true;
}

// Servers CRUD
export async function getServers() { await ensureMock(); return state.servers.map(s => ({ ...s })); }
export async function createServer(payload) { await ensureMock(); const id = 'srv' + (state.servers.length + 1); const item = { id, nome: payload.nome || '', alias: payload.alias || '' }; state.servers.push(item); return { ...item }; }
export async function updateServer(id,payload){ await ensureMock(); const i=state.servers.findIndex(s=>s.id===id); if(i===-1) throw new Error('Servidor não encontrado'); state.servers[i] = {...state.servers[i],...payload}; return {...state.servers[i]}; }
export async function deleteServer(id){ await ensureMock(); state.servers = state.servers.filter(s=>s.id!==id); return true; }

// Apps CRUD
export async function getApps(){ await ensureMock(); return state.apps.map(a=>({...a})); }
export async function createApp(payload){ await ensureMock(); const id='app'+(state.apps.length+1); const item={ id, nome: payload.nome||'', codigoDeAcesso: payload.codigoDeAcesso||'', urlDownloadAndroid: payload.urlDownloadAndroid||'', urlDownloadIos: payload.urlDownloadIos||'', codigoDownloadDownloader: payload.codigoDownloadDownloader||'', codigoNTDown: payload.codigoNTDown||'', multiplosAcessos: !!payload.multiplosAcessos, servidorId: payload.servidorId||null }; state.apps.push(item); return {...item}; }
export async function updateApp(id,payload){ await ensureMock(); const i=state.apps.findIndex(a=>a.id===id); if(i===-1) throw new Error('App não encontrado'); state.apps[i] = {...state.apps[i],...payload}; return {...state.apps[i]}; }
export async function deleteApp(id){ await ensureMock(); state.apps = state.apps.filter(a=>a.id!==id); return true; }

// Plans CRUD
export async function getPlans(){ await ensureMock(); return state.plans.map(p=>({...p})); }
export async function createPlan(payload){ await ensureMock(); const id='pl'+(state.plans.length+1); const item={ id, nome: payload.nome||'', telas: Number(payload.telas||0), validadeEmMeses: Number(payload.validadeEmMeses||0), preco: Number(payload.preco||0) }; state.plans.push(item); return {...item}; }
export async function updatePlan(id,payload){ await ensureMock(); const i=state.plans.findIndex(p=>p.id===id); if(i===-1) throw new Error('Plano não encontrado'); state.plans[i] = {...state.plans[i],...payload}; return {...state.plans[i]}; }
export async function deletePlan(id){ await ensureMock(); state.plans = state.plans.filter(p=>p.id!==id); return true; }

// Apps/Plans/Servers helpers exported for UI convenience
export async function findPlanById(id) { await ensureMock(); return state.plans.find(p=>p.id===id) || null; }
export async function findAppById(id) { await ensureMock(); return state.apps.find(a=>a.id===id) || null; }
