// js/views/clients.js
// View completa de Clientes:
// - toolbar: busca, ordenação, pageSize
// - filtros de status (mutuamente exclusivos) e toggle "Não notificados"
// - listagem e paginação
// - formulário de criação/edição integrado com validação por servidor (telas por servidor = telas)
// - mensagens inline, cleanup de observers/intervals delegado ao modal via ctx._registerCleanup
//
// Observações para Supabase: preserve nomes de campo (servidores, planoId, telas, preco, validade, pontosDeAcesso).
import {
  getClients,
  getPlans,
  getServers,
  getApps,
  createClient,
  updateClient
} from '../mockData.js';
import { openFormModal } from '../modal.js';

function el(tag, text, className) { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (className) e.className = className; return e; }

function formatDateIso(d) {
  if (!d) return '';
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth()+1).padStart(2,'0');
  const day = String(dt.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function addMonthsFromDateUTC(date, months) {
  const d = new Date(date.getTime());
  const targetMonth = d.getUTCMonth() + months;
  return new Date(Date.UTC(d.getUTCFullYear(), targetMonth, d.getUTCDate()));
}

// Validador reutilizável: verifica soma por servidor == telas
function validateConnectionsPerServer({ servidores = [], pontosDeAcesso = [], telas = 0 }) {
  const map = {};
  servidores.forEach(s => map[s] = 0);
  pontosDeAcesso.forEach(p => {
    if (!p.servidorId) return;
    map[p.servidorId] = (map[p.servidorId] || 0) + Number(p.conexoesSimultaneas || 0);
  });
  const details = [];
  for (const srv of servidores) {
    const sum = map[srv] || 0;
    details.push({ servidorId: srv, sum, expected: Number(telas) });
  }
  const ok = details.every(d => d.sum === d.expected);
  return { ok, details };
}

export async function mountClientsView(root, { session } = {}) {
  const container = document.createElement('section');
  container.className = 'view view-clients';

  // Header
  const header = document.createElement('div');
  header.className = 'view-header';
  header.appendChild(el('h2', 'Clientes'));

  // Actions area
  const actions = document.createElement('div');
  actions.className = 'view-actions';
  const btnAdd = document.createElement('button');
  btnAdd.className = 'btn';
  btnAdd.textContent = 'Novo cliente';
  actions.appendChild(btnAdd);
  header.appendChild(actions);
  container.appendChild(header);

  // Toolbar: search + sort + pageSize
  const toolbar = document.createElement('div');
  toolbar.className = 'client-toolbar';
  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.placeholder = 'Buscar por nome, telefone ou email';
  toolbar.appendChild(searchInput);

  const sortSelect = document.createElement('select');
  const optNome = document.createElement('option'); optNome.value = 'nome'; optNome.textContent = 'Ordenar por nome';
  const optDue = document.createElement('option'); optDue.value = 'dueDate'; optDue.textContent = 'Ordenar por vencimento';
  sortSelect.appendChild(optNome); sortSelect.appendChild(optDue);
  toolbar.appendChild(sortSelect);

  const pageSizeSelect = document.createElement('select');
  [10, 25, 50, 100].forEach(n => {
    const o = document.createElement('option'); o.value = String(n); o.textContent = `${n} por página`; pageSizeSelect.appendChild(o);
  });
  pageSizeSelect.value = '12';
  toolbar.appendChild(pageSizeSelect);

  container.appendChild(toolbar);

  // Filters row: status buttons + "Não notificados" toggle
  const filtersWrap = document.createElement('div');
  filtersWrap.className = 'filters-wrap';
  const filters = document.createElement('div');
  filters.className = 'client-filters';

  const filterDefs = [
    { key: 'todos', label: 'Todos' },
    { key: 'vencendo', label: 'Vencendo (≤3d)' },
    { key: 'vencidos_30_less', label: 'Vencidos <30d' },
    { key: 'vencidos_30_plus', label: 'Vencidos ≥30d' },
    { key: 'bloqueados', label: 'Bloqueados' }
  ];
  filterDefs.forEach(f => {
    const b = document.createElement('button');
    b.className = 'filter-btn';
    b.textContent = f.label;
    b.dataset.filter = f.key;
    if (f.key === 'todos') b.classList.add('active');
    filters.appendChild(b);
  });

  const notifiedToggle = document.createElement('button');
  notifiedToggle.className = 'filter-toggle';
  notifiedToggle.setAttribute('role', 'checkbox');
  notifiedToggle.setAttribute('aria-checked', 'false');
  notifiedToggle.type = 'button';
  notifiedToggle.title = 'Mostrar apenas clientes não notificados';
  notifiedToggle.innerHTML = '🔕 Não notificados';

  filtersWrap.appendChild(filters);
  filtersWrap.appendChild(notifiedToggle);
  container.appendChild(filtersWrap);

  // List
  const list = document.createElement('div');
  list.className = 'list';
  container.appendChild(list);

  // Pagination bar
  const paginationBar = document.createElement('div');
  paginationBar.className = 'pagination-bar';
  const pageInfo = document.createElement('div');
  pageInfo.className = 'page-info muted';
  paginationBar.appendChild(pageInfo);

  const paginationControls = document.createElement('div');
  paginationControls.className = 'pagination-controls';
  const prevBtn = document.createElement('button'); prevBtn.className = 'btn small'; prevBtn.textContent = 'Anterior';
  const nextBtn = document.createElement('button'); nextBtn.className = 'btn small'; nextBtn.textContent = 'Próximo';
  const pageInput = document.createElement('input'); pageInput.type = 'number'; pageInput.min = '1'; pageInput.className = 'page-input'; pageInput.style.width = '60px';
  const gotoBtn = document.createElement('button'); gotoBtn.className = 'btn small'; gotoBtn.textContent = 'Ir';
  paginationControls.appendChild(prevBtn); paginationControls.appendChild(pageInput); paginationControls.appendChild(gotoBtn); paginationControls.appendChild(nextBtn);
  paginationBar.appendChild(paginationControls);
  container.appendChild(paginationBar);

  // Feedback
  const feedback = el('div', '', 'feedback');
  container.appendChild(feedback);

  // State
  let currentFilter = 'todos';
  let currentNotNotified = false;
  let currentSearch = '';
  let currentSort = 'nome';
  let currentPage = 1;
  let currentPageSize = 12;
  let totalItems = 0;
  let totalPages = 1;

  // Render list
  function renderList(items) {
    list.innerHTML = '';
    if (!items || items.length === 0) {
      list.appendChild(el('div','Nenhum cliente encontrado.'));
      return;
    }
    items.forEach(c => {
      const row = document.createElement('div'); row.className = 'list-row';
      const left = document.createElement('div');
      left.appendChild(el('div', `${c.nome} ${c.blocked ? '(Bloqueado)' : ''}`, 'list-title'));
      left.appendChild(el('div', `Plano: ${c.planoId || '—'} • Telas: ${c.telas} • Servidores: ${(c.servidores||[]).join(', ')}`, 'muted'));
      row.appendChild(left);

      const right = document.createElement('div');
      const editBtn = document.createElement('button'); editBtn.className = 'btn small'; editBtn.textContent = 'Editar';
      editBtn.addEventListener('click', () => openEdit(c.id));
      right.appendChild(editBtn);

      const delBtn = document.createElement('button'); delBtn.className = 'btn small ghost'; delBtn.textContent = 'Duplicar';
      delBtn.addEventListener('click', () => duplicateClient(c));
      right.appendChild(delBtn);

      row.appendChild(right);

      list.appendChild(row);
    });
  }

  // Load
  async function loadAndRender() {
    feedback.textContent = 'Carregando...';
    try {
      const resp = await getClients({
        page: currentPage,
        pageSize: currentPageSize,
        filter: currentFilter,
        search: currentSearch,
        sort: currentSort,
        notNotified: currentNotNotified
      });
      totalItems = resp.total || 0;
      totalPages = Math.max(1, Math.ceil(totalItems / currentPageSize));
      renderList(resp.items);
      feedback.textContent = `Mostrando página ${currentPage} de ${totalPages}`;
      pageInfo.textContent = `Mostrando ${resp.items.length} de ${totalItems} clientes`;
      prevBtn.disabled = currentPage <= 1;
      nextBtn.disabled = currentPage >= totalPages;
      pageInput.value = currentPage;
      // keep toggle visual in sync
      notifiedToggle.setAttribute('aria-checked', String(currentNotNotified));
      notifiedToggle.classList.toggle('active', currentNotNotified);
    } catch (err) {
      feedback.textContent = 'Erro ao carregar clientes: ' + (err && err.message ? err.message : String(err));
    }
  }

  // Events: search, sort, pageSize
  function debounce(fn, wait=200) { let t; return (...args) => { clearTimeout(t); t = setTimeout(()=>fn(...args), wait); }; }
  searchInput.addEventListener('input', debounce(() => {
    currentSearch = searchInput.value.trim();
    currentPage = 1;
    loadAndRender();
  }, 300));
  sortSelect.addEventListener('change', () => { currentSort = sortSelect.value; currentPage = 1; loadAndRender(); });
  pageSizeSelect.addEventListener('change', () => { currentPageSize = Number(pageSizeSelect.value)||12; currentPage = 1; loadAndRender(); });

  // Filter buttons (mutually exclusive)
  filters.addEventListener('click', (e) => {
    if (!(e.target instanceof HTMLElement)) return;
    const f = e.target.dataset.filter;
    if (!f) return;
    filters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    currentFilter = f;
    currentPage = 1;
    loadAndRender();
  });

  // Toggle not notified
  notifiedToggle.addEventListener('click', () => {
    currentNotNotified = !currentNotNotified;
    notifiedToggle.setAttribute('aria-checked', String(currentNotNotified));
    notifiedToggle.classList.toggle('active', currentNotNotified);
    currentPage = 1;
    loadAndRender();
  });

  // Pagination handlers
  prevBtn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; loadAndRender(); } });
  nextBtn.addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; loadAndRender(); } });
  gotoBtn.addEventListener('click', () => {
    const v = Math.max(1, Math.min(totalPages, Number(pageInput.value) || 1));
    if (v !== currentPage) { currentPage = v; loadAndRender(); }
  });

  // CRUD: add / edit
  btnAdd.addEventListener('click', () => {
    openFormModal({
      title: 'Novo cliente',
      renderForm: (container, ctx) => renderClientForm(container, ctx, null),
      onConfirm: async (data) => {
        // validate per-server sums inside form but double-check here
        const v = validateConnectionsPerServer({ servidores: data.servidores, pontosDeAcesso: data.pontosDeAcesso, telas: data.telas });
        if (!v.ok) {
          const bad = v.details.filter(d => d.sum !== d.expected).map(d => `${d.servidorId}: ${d.sum}/${d.expected}`).join('; ');
          throw new Error('Validação falhou por servidor: ' + bad);
        }
        await createClient(data);
      }
    }).catch(()=>{});
  });

  async function openEdit(id) {
    const resp = await getClients({ page:1, pageSize:1000 });
    const item = resp.items.find(x => x.id === id);
    if (!item) return;
    openFormModal({
      title: 'Editar cliente',
      renderForm: (container, ctx) => renderClientForm(container, ctx, item),
      onConfirm: async (data) => {
        const v = validateConnectionsPerServer({ servidores: data.servidores, pontosDeAcesso: data.pontosDeAcesso, telas: data.telas });
        if (!v.ok) {
          const bad = v.details.filter(d => d.sum !== d.expected).map(d => `${d.servidorId}: ${d.sum}/${d.expected}`).join('; ');
          throw new Error('Validação falhou por servidor: ' + bad);
        }
        await updateClient(id, data);
      }
    }).catch(()=>{});
  }

  function duplicateClient(client) {
    const copy = {
      ...client,
      id: undefined,
      nome: client.nome + ' (cópia)'
    };
    openFormModal({
      title: 'Duplicar cliente',
      renderForm: (container, ctx) => renderClientForm(container, ctx, copy),
      onConfirm: async (data) => {
        const v = validateConnectionsPerServer({ servidores: data.servidores, pontosDeAcesso: data.pontosDeAcesso, telas: data.telas });
        if (!v.ok) throw new Error('Validação por servidor falhou');
        await createClient(data);
      }
    }).catch(()=>{});
  }

  // ----------------------------
  // Formulário de criação/edição
  // ----------------------------
  async function renderClientForm(container, ctx, values = null) {
    container.innerHTML = '';
    const form = document.createElement('div'); form.className = 'entity-form';

    // area de mensagens inline
    const messageBox = document.createElement('div'); messageBox.className = 'form-message'; messageBox.style.marginBottom = '8px';
    form.appendChild(messageBox);

    // Campos básicos
    form.appendChild(el('label','Nome')); const nomeInput = document.createElement('input'); nomeInput.type='text'; nomeInput.value = values ? values.nome || '' : ''; form.appendChild(nomeInput);
    form.appendChild(el('label','Telefone')); const phoneInput = document.createElement('input'); phoneInput.type='text'; phoneInput.value = values ? values.phone || '' : ''; form.appendChild(phoneInput);
    form.appendChild(el('label','Email')); const emailInput = document.createElement('input'); emailInput.type='email'; emailInput.value = values ? values.email || '' : ''; form.appendChild(emailInput);

    // Seleção de servidores (até 2) - checkboxes
    form.appendChild(el('label','Servidores (máx 2)'));
    const serversList = document.createElement('div'); serversList.className = 'servers-list';
    const servers = await getServers();
    servers.forEach(srv => {
      const wrap = document.createElement('label');
      wrap.style.display = 'inline-flex'; wrap.style.alignItems='center'; wrap.style.gap='6px'; wrap.style.marginRight='12px';
      const ch = document.createElement('input'); ch.type='checkbox'; ch.value = srv.id;
      if (values && Array.isArray(values.servidores) && values.servidores.includes(srv.id)) ch.checked = true;
      wrap.appendChild(ch);
      wrap.appendChild(document.createTextNode(srv.nome));
      serversList.appendChild(wrap);
    });
    form.appendChild(serversList);

    // Plano select
    form.appendChild(el('label','Plano'));
    const planSelect = document.createElement('select'); planSelect.appendChild(Object.assign(document.createElement('option'),{ value:'', textContent:'Selecione plano' }));
    const plans = await getPlans();
    plans.forEach(p => {
      const o = document.createElement('option'); o.value = p.id; o.textContent = `${p.nome} — ${p.telas} telas — R$${p.preco}`;
      if (values && values.planoId === p.id) o.selected = true;
      planSelect.appendChild(o);
    });
    form.appendChild(planSelect);

    // Telas (número POR servidor), Preço (padrão do plano, editável) e Validade (calculada)
    form.appendChild(el('label','Telas (por servidor)'));
    const telasInput = document.createElement('input'); telasInput.type='number'; telasInput.min='1'; telasInput.value = values ? (values.telas || 1) : 1;
    form.appendChild(telasInput);

    form.appendChild(el('label','Preço (R$)'));
    const precoInput = document.createElement('input'); precoInput.type='number'; precoInput.step='0.01'; precoInput.value = values ? (values.preco || 0) : 0;
    form.appendChild(precoInput);

    form.appendChild(el('label','Validade'));
    const validadeInput = document.createElement('input'); validadeInput.type='date'; validadeInput.value = values ? (values.validade || '') : '';
    form.appendChild(validadeInput);

    // Indicadores por servidor (mostram soma atual / telas)
    const serversIndicators = document.createElement('div'); serversIndicators.className = 'servers-indicators'; serversIndicators.style.margin = '8px 0';
    form.appendChild(serversIndicators);

    // Pontos de Acesso (dinâmico)
    form.appendChild(el('label','Pontos de Acesso'));
    const pontosContainer = document.createElement('div'); pontosContainer.className = 'pontos-container';
    form.appendChild(pontosContainer);
    const addPontoBtn = document.createElement('button'); addPontoBtn.className = 'btn small'; addPontoBtn.type = 'button'; addPontoBtn.textContent = 'Adicionar Ponto';
    form.appendChild(addPontoBtn);

    // populate existing pontos if editing
    const initialPontos = values && Array.isArray(values.pontosDeAcesso) ? values.pontosDeAcesso.map(p => ({ ...p })) : [];
    await renderPontos(initialPontos);
    updateIndicatorsAndValidation();

    // when plan selected, fill telas/preco/validade defaults
    planSelect.addEventListener('change', () => {
      const sel = plans.find(p => p.id === planSelect.value);
      if (!sel) return;
      telasInput.value = sel.telas;
      precoInput.value = sel.preco;
      const now = new Date();
      const calc = addMonthsFromDateUTC(now, sel.validadeEmMeses);
      if (calc.getUTCDate() !== now.getUTCDate()) {
        const fallback = new Date(Date.UTC(calc.getUTCFullYear(), calc.getUTCMonth() + 1, 1));
        validadeInput.value = formatDateIso(fallback);
        messageBox.innerHTML = `<div class="warn">Validade ajustada para ${formatDateIso(fallback)} (ajuste de dia inválido no mês alvo).</div>`;
      } else {
        validadeInput.value = formatDateIso(calc);
        messageBox.innerHTML = '';
      }
      updateIndicatorsAndValidation();
    });

    // when servers selection changes, ensure max 2 and update indicators
    serversList.addEventListener('change', () => {
      const selected = getSelectedServers();
      if (selected.length > 2) {
        messageBox.innerHTML = `<div class="error">Selecione no máximo 2 servidores</div>`;
        // deselect extras (quick strategy)
        const inputs = Array.from(serversList.querySelectorAll('input[type=checkbox]'));
        while (getSelectedServers().length > 2) {
          const last = inputs.reverse().find(i => i.checked);
          if (!last) break;
          last.checked = false;
        }
      } else {
        messageBox.innerHTML = '';
      }
      updateIndicatorsAndValidation();
    });

    telasInput.addEventListener('input', () => updateIndicatorsAndValidation());

    addPontoBtn.addEventListener('click', async () => {
      const cur = readPontosFromUI();
      cur.push({ appId: '', servidorId: '', usuario: '', senha: '', conexoesSimultaneas: 1 });
      await renderPontos(cur);
      updateIndicatorsAndValidation();
    });

    // ---------- helpers inside form ----------

    function getSelectedServers() {
      return Array.from(serversList.querySelectorAll('input[type=checkbox]:checked')).map(i => i.value);
    }

    async function renderPontos(pontos = []) {
      const allApps = await getApps();
      pontosContainer.innerHTML = '';
      pontos.forEach((p, idx) => {
        const card = document.createElement('div'); card.className = 'ponto-card'; card.style.padding='8px'; card.style.border='1px solid rgba(0,0,0,0.06)'; card.style.marginBottom='8px'; card.style.borderRadius='6px';

        const appLabel = el('label','App'); const appSelect = document.createElement('select');
        appSelect.appendChild(Object.assign(document.createElement('option'),{value:'',textContent:'Selecione app'}));
        allApps.forEach(a => {
          const o = document.createElement('option'); o.value = a.id; o.textContent = `${a.nome} — ${a.codigoDeAcesso} — srv:${a.servidorId}`;
          if (p.appId === a.id) o.selected = true;
          appSelect.appendChild(o);
        });

        const srvInfo = el('div', p.servidorId ? `Servidor: ${p.servidorId}` : '', 'muted');
        const userLabel = el('label','Usuário'); const userInput = document.createElement('input'); userInput.type='text'; userInput.value = p.usuario || '';
        const passLabel = el('label','Senha'); const passInput = document.createElement('input'); passInput.type='text'; passInput.value = p.senha || '';
        const conexLabel = el('label','Conexões Simultâneas'); const conexInput = document.createElement('input'); conexInput.type='number'; conexInput.min='1'; conexInput.value = p.conexoesSimultaneas || 1;

        const removeBtn = document.createElement('button'); removeBtn.className = 'btn ghost small'; removeBtn.type='button'; removeBtn.textContent = 'Remover';
        removeBtn.addEventListener('click', async () => {
          const cur = readPontosFromUI();
          cur.splice(idx,1);
          await renderPontos(cur);
          updateIndicatorsAndValidation();
        });

        appSelect.addEventListener('change', async () => {
          const selApp = allApps.find(a => a.id === appSelect.value);
          if (selApp) {
            srvInfo.textContent = `Servidor: ${selApp.servidorId}`;
            if (!selApp.multiplosAcessos) {
              conexInput.value = 1;
              conexInput.disabled = true;
            } else {
              conexInput.disabled = false;
              conexInput.removeAttribute('max');
            }
          } else {
            srvInfo.textContent = '';
            conexInput.disabled = false;
          }
          updateIndicatorsAndValidation();
        });

        // initial enforcement
        (async () => {
          const appObj = allApps.find(a => a.id === p.appId);
          if (appObj) {
            srvInfo.textContent = `Servidor: ${appObj.servidorId}`;
            if (!appObj.multiplosAcessos) { conexInput.value = 1; conexInput.disabled = true; }
          }
        })();

        card.appendChild(appLabel); card.appendChild(appSelect);
        card.appendChild(srvInfo);
        card.appendChild(userLabel); card.appendChild(userInput);
        card.appendChild(passLabel); card.appendChild(passInput);
        card.appendChild(conexLabel); card.appendChild(conexInput);
        card.appendChild(removeBtn);
        pontosContainer.appendChild(card);
      });
    }

    function readPontosFromUI() {
      const cards = Array.from(pontosContainer.children);
      const dados = [];
      cards.forEach(card => {
        const sel = card.querySelector('select');
        const appId = sel ? sel.value : '';
        const inputsText = card.querySelectorAll('input[type="text"]');
        const usuario = inputsText && inputsText[0] ? inputsText[0].value : '';
        const senha = inputsText && inputsText[1] ? inputsText[1].value : '';
        const conex = card.querySelector('input[type="number"]') ? Number(card.querySelector('input[type="number"]').value || 0) : 0;
        dados.push({ appId, servidorId: null, usuario, senha, conexoesSimultaneas: conex });
      });
      return dados;
    }

    async function resolvePontosWithServerIds(rawPontos) {
      const allApps = await getApps();
      return rawPontos.map(p => {
        const appObj = allApps.find(a => a.id === p.appId);
        return { ...p, servidorId: appObj ? appObj.servidorId : null };
      });
    }

    // update indicators per server and perform inline validation messages
    async function updateIndicatorsAndValidation() {
      const selectedServers = getSelectedServers();
      serversIndicators.innerHTML = '';
      const rawPontos = readPontosFromUI();
      const pontos = await resolvePontosWithServerIds(rawPontos);

      const sums = {};
      selectedServers.forEach(s => sums[s] = 0);
      pontos.forEach(p => {
        if (!p.servidorId) return;
        if (!sums.hasOwnProperty(p.servidorId)) sums[p.servidorId] = 0;
        sums[p.servidorId] += Number(p.conexoesSimultaneas || 0);
      });

      const telasVal = Number(telasInput.value || 0);

      selectedServers.forEach(srvId => {
        const sum = sums[srvId] || 0;
        const row = document.createElement('div'); row.style.display='flex'; row.style.justifyContent='space-between'; row.style.alignItems='center'; row.style.gap='8px';
        const left = document.createElement('div'); left.textContent = `Servidor ${srvId}`;
        const right = document.createElement('div');
        if (sum === telasVal) right.innerHTML = `<span class="ok">Conexões: ${sum}/${telasVal} — ok</span>`;
        else if (sum < telasVal) right.innerHTML = `<span class="warn">Conexões: ${sum}/${telasVal} — faltam ${telasVal - sum}</span>`;
        else right.innerHTML = `<span class="error">Conexões: ${sum}/${telasVal} — excede ${sum - telasVal}</span>`;
        row.appendChild(left); row.appendChild(right);
        serversIndicators.appendChild(row);
      });

      if (!selectedServers.length && pontos.length) {
        messageBox.innerHTML = `<div class="error">Selecione pelo menos um servidor antes de adicionar pontos de acesso.</div>`;
      } else {
        const validation = validateConnectionsPerServer({ servidores: selectedServers, pontosDeAcesso: pontos, telas: telasVal });
        if (!validation.ok) {
          const bad = validation.details.filter(d => d.sum !== d.expected);
          const msgs = bad.map(d => `${d.servidorId}: ${d.sum}/${d.expected}`).join('; ');
          messageBox.innerHTML = `<div class="error">Validação por servidor falhou: ${msgs}</div>`;
        } else {
          messageBox.innerHTML = `<div class="success">Validação por servidor OK</div>`;
        }
      }
    }

    // save handler
    const saveBtn = document.createElement('button'); saveBtn.className = 'btn'; saveBtn.type='button'; saveBtn.textContent = 'Salvar';
    saveBtn.addEventListener('click', async () => {
      if (!nomeInput.value.trim()) { messageBox.innerHTML = `<div class="error">Nome obrigatório</div>`; return; }
      const selectedServers = getSelectedServers();
      if (selectedServers.length === 0) { messageBox.innerHTML = `<div class="error">Selecione ao menos 1 servidor</div>`; return; }
      const planId = planSelect.value || null;
      const telasVal = Number(telasInput.value || 0);
      const precoVal = Number(precoInput.value || 0);
      const validadeVal = validadeInput.value || null;

      const rawPontos = readPontosFromUI();
      const pontos = await resolvePontosWithServerIds(rawPontos);

      const appsMap = (await getApps()).reduce((acc,a) => { acc[a.id] = a; return acc; }, {});
      for (const p of pontos) {
        const app = appsMap[p.appId];
        if (!app) { messageBox.innerHTML = `<div class="error">Selecione um app válido em todos os pontos</div>`; return; }
        if (!selectedServers.includes(app.servidorId)) { messageBox.innerHTML = `<div class="error">App ${app.nome} pertence ao servidor ${app.servidorId} não selecionado</div>`; return; }
        if (!app.multiplosAcessos && Number(p.conexoesSimultaneas) !== 1) { messageBox.innerHTML = `<div class="error">App ${app.nome} não permite múltiplos acessos; conexões deve ser 1</div>`; return; }
        if (app.multiplosAcessos) {
          if (Number(p.conexoesSimultaneas) < 1 || Number(p.conexoesSimultaneas) > telasVal) { messageBox.innerHTML = `<div class="error">Conexões para ${app.nome} deve estar entre 1 e ${telasVal}</div>`; return; }
        }
      }

      const finalV = validateConnectionsPerServer({ servidores: selectedServers, pontosDeAcesso: pontos, telas: telasVal });
      if (!finalV.ok) {
        const bad = finalV.details.filter(d => d.sum !== d.expected);
        const msgs = bad.map(d => `${d.servidorId}: ${d.sum}/${d.expected}`).join('; ');
        messageBox.innerHTML = `<div class="error">Validação por servidor falhou: ${msgs}</div>`; return;
      }

      const payload = {
        nome: nomeInput.value.trim(),
        phone: phoneInput.value.trim(),
        email: emailInput.value.trim(),
        servidores: selectedServers,
        planoId: planId,
        telas: telasVal,
        preco: precoVal,
        validade: validadeVal,
        pontosDeAcesso: pontos
      };

      if (planId) {
        const plan = plans.find(p => p.id === planId);
        if (plan) {
          if (Number(plan.preco) !== precoVal) messageBox.innerHTML = `<div class="warn">Preço salvo difere do preço do plano (${plan.preco})</div>`;
          if (Number(plan.telas) !== telasVal) messageBox.innerHTML = `<div class="warn">Telas salvas difere do plano (${plan.telas})</div>`;
        }
      }

      ctx.resolve(payload);
    });

    const cancelBtn = document.createElement('button'); cancelBtn.className = 'btn ghost'; cancelBtn.type='button'; cancelBtn.textContent = 'Cancelar';
    cancelBtn.addEventListener('click', () => ctx.cancel());

    form.appendChild(saveBtn); form.appendChild(cancelBtn);
    container.appendChild(form);

    // observe changes in pontosContainer to update indicators in realtime
    const mo = new MutationObserver(() => updateIndicatorsAndValidation());
    mo.observe(pontosContainer, { childList: true, subtree: true });
    // register cleanup via ctx
    if (ctx && typeof ctx._registerCleanup === 'function') {
      ctx._registerCleanup(() => mo.disconnect());
      const intervalId = setInterval(updateIndicatorsAndValidation, 500);
      ctx._registerCleanup(() => clearInterval(intervalId));
    }
  }

  // initial load
  await loadAndRender();
  root.appendChild(container);
}
