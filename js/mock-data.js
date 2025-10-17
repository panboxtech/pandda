// js/mockData.js
// Mock de dados em memória com API CRUD assinada para substituir por Supabase.
// Substituir as funções exportadas por adaptadores que chamem supabase.from(...)

const state = {
  clients: [],
  servers: [],
  plans: [],
  apps: []
};

function seedMockData() {
  const now = new Date();
  const clients = [];
  for (let i = 1; i <= 24; i++) {
    const daysOffset = (i % 12) - 6;
    const due = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000);
    clients.push({
      id: `c${i}`,
      name: `Cliente ${i}`,
      phone: `+55 63 9${String(90000000 + i).slice(-8)}`,
      email: `cliente${i}@example.com`,
      dueDate: due.toISOString().slice(0,10),
      notified: i % 4 === 0
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

// Clients
export async function getClients() { await ensureMock(); return state.clients.map(c=>({...c})); }
export async function createClient(payload) { await ensureMock(); const id='c'+(state.clients.length+1); const item={id,...payload}; state.clients.push(item); return {...item}; }
export async function updateClient(id,payload) { await ensureMock(); const i=state.clients.findIndex(c=>c.id===id); if(i===-1) throw new Error('Cliente não encontrado'); state.clients[i]={...state.clients[i],...payload}; return {...state.clients[i]}; }
export async function deleteClient(id) { await ensureMock(); state.clients = state.clients.filter(c=>c.id!==id); return true; }

// Servers
export async function getServers(){ await ensureMock(); return state.servers.map(s=>({...s})); }
export async function createServer(payload){ await ensureMock(); const id='s'+(state.servers.length+1); const item={id,...payload}; state.servers.push(item); return {...item}; }
export async function updateServer(id,payload){ await ensureMock(); const i=state.servers.findIndex(s=>s.id===id); if(i===-1) throw new Error('Servidor não encontrado'); state.servers[i] = {...state.servers[i],...payload}; return {...state.servers[i]}; }
export async function deleteServer(id){ await ensureMock(); state.servers = state.servers.filter(s=>s.id!==id); return true; }

// Plans
export async function getPlans(){ await ensureMock(); return state.plans.map(p=>({...p})); }
export async function createPlan(payload){ await ensureMock(); const id='p'+(state.plans.length+1); const item={id,...payload}; state.plans.push(item); return {...item}; }
export async function updatePlan(id,payload){ await ensureMock(); const i=state.plans.findIndex(p=>p.id===id); if(i===-1) throw new Error('Plano não encontrado'); state.plans[i] = {...state.plans[i],...payload}; return {...state.plans[i]}; }
export async function deletePlan(id){ await ensureMock(); state.plans = state.plans.filter(p=>p.id!==id); return true; }

// Apps
export async function getApps(){ await ensureMock(); return state.apps.map(a=>({...a})); }
export async function createApp(payload){ await ensureMock(); const id='a'+(state.apps.length+1); const item={id,...payload}; state.apps.push(item); return {...item}; }
export async function updateApp(id,payload){ await ensureMock(); const i=state.apps.findIndex(a=>a.id===id); if(i===-1) throw new Error('App não encontrado'); state.apps[i] = {...state.apps[i],...payload}; return {...state.apps[i]}; }
export async function deleteApp(id){ await ensureMock(); state.apps = state.apps.filter(a=>a.id!==id); return true; }
