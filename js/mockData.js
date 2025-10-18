// js/mockData.js
// Mock de dados em memória com API CRUD e suporte a paginação/search/filter/sort.
// Assinatura principal:
//   getClients({ page = 1, pageSize = 12, filter, search, sort, notNotified } = {}) =>
//     { items: Client[], total: number, page, pageSize }
//
// Comentário para Supabase:
// Substitua a implementação de getClients por uma query supabase usando .select(..., { count: 'exact' })
// e .range((page-1)*pageSize, page*pageSize-1). Aplique filtros no servidor (ilike, eq, lt, gt).
// Mantenha a assinatura de retorno { items, total, page, pageSize }.

const state = {
  clients: [],
  servers: [],
  plans: [],
  apps: []
};

function seedMockData() {
  const now = new Date();
  const clients = [];
  for (let i = 1; i <= 240; i++) { // gerar mais clientes para testar paginação
    const daysOffset = (i % 60) - 30; // datas no passado e futuro
    const due = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000);
    clients.push({
      id: `c${i}`,
      name: `Cliente ${i}`,
      phone: `+55 63 9${String(90000000 + i).slice(-8)}`,
      email: `cliente${i}@example.com`,
      dueDate: due.toISOString().slice(0,10),
      notified: i % 4 === 0,
      blocked: false
    });
  }

  const servers = [
    { id: 's1', name: 'Servidor A', url: 'https://srv-a.example.com' },
    { id: 's2', name: 'Servidor B', url: 'https://srv-b.example.com' }
  ];
  const plans = [
    { id: 'p1', name: 'Básico' },
    { id: 'p2', name: 'Pro' }
  ];
  const apps = [
    { id: 'a1', name: 'App Mobile', urlDownload: 'https://example.com/app.apk' },
    { id: 'a2', name: 'App Web', urlDownload: 'https://example.com/web' }
  ];

  state.clients = clients;
  state.servers = servers;
  state.plans = plans;
  state.apps = apps;
}

async function ensureMock() {
  if (state.clients.length === 0) seedMockData();
}

/**
 * getClients - retorna página com items + metadados
 * opts: { page = 1, pageSize = 12, filter, search, sort, notNotified }
 * filter: 'todos'|'vencendo'|'vencidos_30_less'|'vencidos_30_plus'|'notificados'|'bloqueados'
 * notNotified: boolean (quando true filtra items where notified === false)
 * search: string (busca por name, phone, email)
 * sort: 'dueDate'|'name'
 */
export async function getClients(opts = {}) {
  await ensureMock();
  const {
    page = 1,
    pageSize = 12,
    filter = 'todos',
    search = '',
    sort = 'dueDate',
    notNotified = false
  } = opts;

  // clone array para não mutar o estado
  let items = state.clients.map(c => ({ ...c }));

  // aplicar filtro por status (mutuamente exclusivo)
  if (filter && filter !== 'todos') {
    const today = new Date();
    const daysUntil = (dateStr) => {
      const d = new Date(dateStr);
      return Math.floor((d - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / (1000*60*60*24));
    };

    if (filter === 'vencendo') {
      items = items.filter(c => {
        const du = daysUntil(c.dueDate);
        return du <= 3 && du >= 0;
      });
    } else if (filter === 'vencidos_30_less') {
      items = items.filter(c => {
        const du = daysUntil(c.dueDate);
        return du < 0 && du >= -30;
      });
    } else if (filter === 'vencidos_30_plus') {
      items = items.filter(c => {
        const du = daysUntil(c.dueDate);
        return du < -30;
      });
    } else if (filter === 'notificados') {
      items = items.filter(c => !!c.notified);
    } else if (filter === 'bloqueados') {
      items = items.filter(c => !!c.blocked);
    }
  }

  // filtro global complementar: notNotified (aplica em conjunto com status)
  if (notNotified) {
    items = items.filter(c => !c.notified);
  }

  // busca (por nome, telefone, email)
  const q = String(search || '').trim().toLowerCase();
  if (q) {
    items = items.filter(c => {
      return (c.name && c.name.toLowerCase().includes(q)) ||
             (c.phone && c.phone.toLowerCase().includes(q)) ||
             (c.email && c.email.toLowerCase().includes(q));
    });
  }

  // ordenação
  if (sort === 'name') {
    items.sort((a,b) => a.name.localeCompare(b.name));
  } else if (sort === 'dueDate') {
    items.sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  const total = items.length;

  // paginação
  const validPageSize = Math.max(1, Math.min(200, Number(pageSize) || 12));
  const validPage = Math.max(1, Number(page) || 1);
  const start = (validPage - 1) * validPageSize;
  const end = start + validPageSize;
  const pageItems = items.slice(start, end);

  return {
    items: pageItems,
    total,
    page: validPage,
    pageSize: validPageSize
  };
}

// CRUD básico (compatível para Supabase substitution later)
export async function createClient(payload) {
  await ensureMock();
  const id = 'c' + (state.clients.length + 1);
  const item = { id, ...payload, blocked: false };
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

// Servidores, planos, apps mantidos compatíveis
export async function getServers(){ await ensureMock(); return state.servers.map(s=>({...s})); }
export async function createServer(payload){ await ensureMock(); const id='s'+(state.servers.length+1); const item={id,...payload}; state.servers.push(item); return {...item}; }
export async function updateServer(id,payload){ await ensureMock(); const i = state.servers.findIndex(s=>s.id===id); if(i===-1) throw new Error('Servidor não encontrado'); state.servers[i] = {...state.servers[i],...payload}; return {...state.servers[i]}; }
export async function deleteServer(id){ await ensureMock(); state.servers = state.servers.filter(s=>s.id!==id); return true; }

export async function getPlans(){ await ensureMock(); return state.plans.map(p=>({...p})); }
export async function createPlan(payload){ await ensureMock(); const id='p'+(state.plans.length+1); const item={id,...payload}; state.plans.push(item); return {...item}; }
export async function updatePlan(id,payload){ await ensureMock(); const i=state.plans.findIndex(p=>p.id===id); if(i===-1) throw new Error('Plano não encontrado'); state.plans[i] = {...state.plans[i],...payload}; return {...state.plans[i]}; }
export async function deletePlan(id){ await ensureMock(); state.plans = state.plans.filter(p=>p.id!==id); return true; }

export async function getApps(){ await ensureMock(); return state.apps.map(a=>({...a})); }
export async function createApp(payload){ await ensureMock(); const id='a'+(state.apps.length+1); const item={id,...payload}; state.apps.push(item); return {...item}; }
export async function updateApp(id,payload){ await ensureMock(); const i=state.apps.findIndex(a=>a.id===id); if(i===-1) throw new Error('App não encontrado'); state.apps[i] = {...state.apps[i],...payload}; return {...state.apps[i]}; }
export async function deleteApp(id){ await ensureMock(); state.apps = state.apps.filter(a=>a.id!==id); return true; }
