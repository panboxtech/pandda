// js/mockData.js
// Mock de dados em memória com novos campos e geração de pontosDeAcesso
// Contratos preservados para facilitar posterior substituição por Supabase.
// Ao migrar para Supabase, substitua as funções por queries que mantenham os mesmos nomes/assinaturas.

const state = {
  clients: [],
  servers: [],
  plans: [],
  apps: []
};

function seedMockData() {
  const now = new Date();

  // SERVIDORES (nome, alias)
  state.servers = [
    { id: 'srv1', nome: 'Servidor A', alias: 'A' },
    { id: 'srv2', nome: 'Servidor B', alias: 'B' },
    { id: 'srv3', nome: 'Servidor C', alias: 'C' }
  ];

  // PLANOS (nome, telas, validadeEmMeses, preco)
  state.plans = [
    { id: 'pl1', nome: 'Básico', telas: 1, validadeEmMeses: 1, preco: 19.90 },
    { id: 'pl2', nome: 'Standard', telas: 2, validadeEmMeses: 3, preco: 49.90 },
    { id: 'pl3', nome: 'Pro', telas: 4, validadeEmMeses: 12, preco: 199.00 }
  ];

  // APPS (vinculados a servidor via servidorId)
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
      urlDownloadAndroid: '',
      urlDownloadIos: '',
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

  // CLIENTS: para cada client geramos pontosDeAcesso que respeitem a regra:
  // Para cada servidor selecionado pelo cliente, soma(conexoesSimultaneas dos pontos daquele servidor) === client.telas
  const clients = [];
  for (let i = 1; i <= 40; i++) {
    const plan = state.plans[(i - 1) % state.plans.length];
    // definimos servidores: clients podem ter 1 ou 2 servidores (alternando)
    const servidores = (i % 3 === 0) ? ['srv1', 'srv2'] : ['srv1'];
    const telas = plan.telas;
    const pontosDeAcesso = generatePontosForClient(i, servidores, telas);

    const validadeDate = addMonthsFromDateUTC(now, plan.validadeEmMeses);
    clients.push({
      id: `c${i}`,
      nome: `Cliente ${i}`,
      phone: `+55 63 9${String(90000000 + i).slice(-8)}`,
      email: `cliente${i}@example.com`,
      notified: i % 4 === 0,
      blocked: false,
      servidores,            // array de ids de servidores (1 ou 2)
      planoId: plan.id,
      telas,                 // número de telas POR servidor (regra: aplicado a cada servidor)
      preco: plan.preco,
      validade: validadeDate.toISOString().slice(0,10),
      pontosDeAcesso         // array de pontos respeitando soma por servidor == telas
    });
  }

  state.clients = clients;
}

/* Helpers de seed */

// adiciona meses considerando dia; caso o dia não exista no mês alvo, gera data com dia ajustado (UI tratará fallback)
function addMonthsFromDateUTC(date, months) {
  const d = new Date(date.getTime());
  const targetMonth = d.getUTCMonth() + months;
  return new Date(Date.UTC(d.getUTCFullYear(), targetMonth, d.getUTCDate()));
}

// gerar pontos que respeitam soma por servidor == telas
function generatePontosForClient(index, servidores, telas) {
  // buscamos apps por servidor e distribuímos conexões de forma simples
  const pontos = [];
  // para cada servidor, distribuir 'telas' conexões em 1..n pontos, respeitando apps.multiplosAcessos
  servidores.forEach((srvId, sIdx) => {
    const appsForSrv = state.apps.filter(a => a.servidorId === srvId);
    // se nenhum app para o servidor, criamos um ponto placeholder sem appId (UI deverá impedir salvar real)
    if (appsForSrv.length === 0) {
      pontos.push({
        id: `p${index}-${srvId}-0`,
        appId: null,
        servidorId: srvId,
        usuario: `user${index}${sIdx}0`,
        senha: `pass${index}${sIdx}0`,
        conexoesSimultaneas: telas // atribui tudo a ponto genérico
      });
      return;
    }

    // distribuir telas entre até appsForSrv.length pontos, mas garantir que pontos com multiplosAcessos=false recebam 1
    let remaining = telas;
    // primeiro reserve pontos para apps que não aceitam multiplosAcessos (cada um 1)
    const singleAccessApps = appsForSrv.filter(a => !a.multiplosAcessos);
    singleAccessApps.forEach((a, ai) => {
      if (remaining <= 0) return;
      pontos.push({
        id: `p${index}-${srvId}-s${ai}`,
        appId: a.id,
        servidorId: srvId,
        usuario: `user${index}${sIdx}${ai}`,
        senha: `pass${index}${sIdx}${ai}`,
        conexoesSimultaneas: 1
      });
      remaining -= 1;
    });

    // se ainda restam telas, distribui entre apps que permitem multiplosAcessos ou reaplica apps
    const multiApps = appsForSrv.filter(a => a.multiplosAcessos);
    if (remaining > 0) {
      if (multiApps.length === 0) {
        // sem apps multi, just create one extra ponto (já atendeu above? caso remaining>0 então iremos criar ponto genérico)
        pontos.push({
          id: `p${index}-${srvId}-gen`,
          appId: appsForSrv[0].id,
          servidorId: srvId,
          usuario: `user${index}${sIdx}g`,
          senha: `pass${index}${sIdx}g`,
          conexoesSimultaneas: remaining
        });
        remaining = 0;
      } else {
        // distribuir restante entre multiApps de forma equilibrada
        let ai = 0;
        while (remaining > 0) {
          const a = multiApps[ai % multiApps.length];
          const assign = Math.min(remaining, 1 + Math.floor(telas / multiApps.length)); // minimo 1, tenta balancear
          pontos.push({
            id: `p${index}-${srvId}-m${ai}`,
            appId: a.id,
            servidorId: srvId,
            usuario: `user${index}${sIdx}m${ai}`,
            senha: `pass${index}${sIdx}m${ai}`,
            conexoesSimultaneas: assign
          });
          remaining -= assign;
          ai++;
        }
      }
    }
  });
  // garantir que soma por servidor foi respeitada pela geração acima
  // se por algum motivo não, corrige: agrupa por servidor e ajusta últimos pontos
  const grouped = {};
  pontos.forEach(p => { grouped[p.servidorId] = (grouped[p.servidorId] || 0) + Number(p.conexoesSimultaneas || 0); });
  servidores.forEach(srvId => {
    const sum = grouped[srvId] || 0;
    if (sum !== 0 && sum !== undefined) {
      // idealmente sum === telas; se não, ajusta o último ponto desse servidor para compensar
      if (sum !== imagensFallback(telas)) {
        // no seed preferimos forçar ajuste se necessário (imagemFallback é um wrapper trivial abaixo)
        // localizar último ponto desse servidor e ajustar
        const lastIdx = pontos.map(p => p.servidorId).lastIndexOf(srvId);
        if (lastIdx >= 0) {
          const diff = telas - sum;
          pontos[lastIdx].conexoesSimultaneas = Number(pontos[lastIdx].conexoesSimultaneas || 0) + diff;
        }
      }
    } else if (sum === 0) {
      // se não houve pontos gerados (situação rara), criar um ponto com conexoes = telas
      pontos.push({
        id: `p${Math.random().toString(36).slice(2,8)}`,
        appId: (state.apps.find(a => a.servidorId === srvId) || {}).id || null,
        servidorId: srvId,
        usuario: `user${Math.random().toString(36).slice(2,4)}`,
        senha: `pass${Math.random().toString(36).slice(2,4)}`,
        conexoesSimultaneas: telas
      });
    }
  });

  return pontos;
}

// trivial wrapper (placeholder) — mantido para legibilidade do código acima
function imagensFallback(v) { return v; }

/* ensure seeded */
async function ensureMock() {
  if (state.clients.length === 0) seedMockData();
}

/* -------------------------
   API pública (mock)
   -------------------------
   Preservamos assinaturas para facilitar troca por Supabase.
   getClients(opts) => { items, total, page, pageSize }
   createClient(payload), updateClient(id,payload), deleteClient(id)
   getServers(), getPlans(), getApps(), create/update/delete correspondentes
   ------------------------- */

/**
 * getClients - suporta paginação, busca e filtros básicos
 * opts: { page=1, pageSize=12, filter, search, sort, notNotified }
 */
export async function getClients(opts = {}) {
  await ensureMock();
  const { page = 1, pageSize = 12, filter = 'todos', search = '', sort = 'nome', notNotified = false } = opts;

  let items = state.clients.map(c => ({ ...c, pontosDeAcesso: (c.pontosDeAcesso || []).map(p=>({ ...p })) }));

  // filtro search por nome/phone/email
  const q = String(search || '').trim().toLowerCase();
  if (q) {
    items = items.filter(c => (c.nome || '').toLowerCase().includes(q) ||
                              (c.phone || '').toLowerCase().includes(q) ||
                              (c.email || '').toLowerCase().includes(q));
  }

  if (notNotified) items = items.filter(c => !c.notified);

  // status filters (vencendo/vencidos) não são críticos aqui; mantemos suporte leve se campos existirem
  if (filter && filter !== 'todos') {
    // placeholder: caso precise, implementar as mesmas regras anteriores usando dueDate
  }

  if (sort === 'nome') items.sort((a,b) => (a.nome || '').localeCompare(b.nome || ''));
  else if (sort === 'dueDate') items.sort((a,b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));

  const total = items.length;
  const validPageSize = Math.max(1, Math.min(500, Number(pageSize) || 12));
  const validPage = Math.max(1, Number(page) || 1);
  const start = (validPage - 1) * validPageSize;
  const end = start + validPageSize;
  const pageItems = items.slice(start, end);

  return { items: pageItems, total, page: validPage, pageSize: validPageSize };
}

/* CRUD clientes */
export async function createClient(payload) {
  await ensureMock();
  const id = 'c' + (state.clients.length + 1);
  const item = {
    id,
    nome: payload.nome || '',
    phone: payload.phone || '',
    email: payload.email || '',
    notified: !!payload.notified,
    blocked: !!payload.blocked,
    servidores: Array.isArray(payload.servidores) ? payload.servidores.slice(0,2) : [],
    planoId: payload.planoId || null,
    telas: typeof payload.telas === 'number' ? payload.telas : Number(payload.telas || 0),
    preco: typeof payload.preco === 'number' ? payload.preco : Number(payload.preco || 0),
    validade: payload.validade || null,
    pontosDeAcesso: Array.isArray(payload.pontosDeAcesso) ? payload.pontosDeAcesso.map(p => ({ ...p, id: p.id || `p${id}-${Math.random().toString(36).slice(2,6)}` })) : []
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

/* Servers CRUD */
export async function getServers() { await ensureMock(); return state.servers.map(s => ({ ...s })); }
export async function createServer(payload) { await ensureMock(); const id='srv'+(state.servers.length+1); const item={ id, nome: payload.nome||'', alias: payload.alias||'' }; state.servers.push(item); return {...item}; }
export async function updateServer(id,payload){ await ensureMock(); const i=state.servers.findIndex(s=>s.id===id); if(i===-1) throw new Error('Servidor não encontrado'); state.servers[i] = {...state.servers[i],...payload}; return {...state.servers[i]}; }
export async function deleteServer(id){ await ensureMock(); state.servers = state.servers.filter(s=>s.id!==id); return true; }

/* Apps CRUD */
export async function getApps(){ await ensureMock(); return state.apps.map(a => ({ ...a })); }
export async function createApp(payload){ await ensureMock(); const id='app'+(state.apps.length+1); const item={ id, nome: payload.nome||'', codigoDeAcesso: payload.codigoDeAcesso||'', urlDownloadAndroid: payload.urlDownloadAndroid||'', urlDownloadIos: payload.urlDownloadIos||'', codigoDownloadDownloader: payload.codigoDownloadDownloader||'', codigoNTDown: payload.codigoNTDown||'', multiplosAcessos: !!payload.multiplosAcessos, servidorId: payload.servidorId||null }; state.apps.push(item); return {...item}; }
export async function updateApp(id,payload){ await ensureMock(); const i=state.apps.findIndex(a=>a.id===id); if(i===-1) throw new Error('App não encontrado'); state.apps[i] = {...state.apps[i],...payload}; return {...state.apps[i]}; }
export async function deleteApp(id){ await ensureMock(); state.apps = state.apps.filter(a=>a.id!==id); return true; }

/* Plans CRUD */
export async function getPlans(){ await ensureMock(); return state.plans.map(p => ({ ...p })); }
export async function createPlan(payload){ await ensureMock(); const id='pl'+(state.plans.length+1); const item={ id, nome: payload.nome||'', telas: Number(payload.telas||0), validadeEmMeses: Number(payload.validadeEmMeses||0), preco: Number(payload.preco||0) }; state.plans.push(item); return {...item}; }
export async function updatePlan(id,payload){ await ensureMock(); const i=state.plans.findIndex(p=>p.id===id); if(i===-1) throw new Error('Plano não encontrado'); state.plans[i] = {...state.plans[i],...payload}; return {...state.plans[i]}; }
export async function deletePlan(id){ await ensureMock(); state.plans = state.plans.filter(p=>p.id!==id); return true; }

/* Small helpers exported */
export async function findPlanById(id) { await ensureMock(); return state.plans.find(p=>p.id===id) || null; }
export async function findAppById(id) { await ensureMock(); return state.apps.find(a=>a.id===id) || null; }
