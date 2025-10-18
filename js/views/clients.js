// js/views/clients.js
// View de Clientes com filtro cliente-side de fallback e logs mínimos
import {
  getClients,
  createClient,
  updateClient
} from '../mockData.js';
import { openFormModal } from '../modal.js';
import { renderClientForm } from '../forms/clientForm.js';

function el(tag, text, className) {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (className) e.className = className;
  return e;
}

export async function mountClientsView(root) {
  const container = document.createElement('section');
  container.className = 'view view-clients';

  // Header
  const header = document.createElement('div');
  header.className = 'view-header';
  header.appendChild(el('h2', 'Clientes'));

  const actions = document.createElement('div');
  actions.className = 'view-actions';
  const btnAdd = document.createElement('button');
  btnAdd.className = 'btn';
  btnAdd.textContent = 'Novo cliente';
  actions.appendChild(btnAdd);
  header.appendChild(actions);
  container.appendChild(header);

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'client-toolbar';

  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.placeholder = 'Buscar por nome, telefone ou email';
  toolbar.appendChild(searchInput);

  const sortSelect = document.createElement('select');
  sortSelect.innerHTML = `
    <option value="nome">Ordenar por nome</option>
    <option value="dueDate">Ordenar por vencimento</option>
  `;
  toolbar.appendChild(sortSelect);

  const pageSizeSelect = document.createElement('select');
  [10, 12, 25, 50, 100].forEach(n => {
    const o = document.createElement('option');
    o.value = String(n);
    o.textContent = `${n} por página`;
    pageSizeSelect.appendChild(o);
  });
  pageSizeSelect.value = '12';
  toolbar.appendChild(pageSizeSelect);

  container.appendChild(toolbar);

  // Filtros
  const filtersWrap = document.createElement('div');
  filtersWrap.className = 'filters-wrap';
  filtersWrap.style.position = 'relative';
  filtersWrap.style.zIndex = '80';
  filtersWrap.style.pointerEvents = 'auto';

  const filters = document.createElement('div');
  filters.className = 'client-filters';
  filters.style.pointerEvents = 'auto';
  filters.style.zIndex = '81';

  const filterDefs = [
    { key: 'todos', label: 'Todos' },
    { key: 'vencendo', label: 'Vencendo (≤3d)' },
    { key: 'vencidos_30_less', label: 'Vencidos <30d' },
    { key: 'vencidos_30_plus', label: 'Vencidos ≥30d' },
    { key: 'bloqueados', label: 'Bloqueados' }
  ];

  const filterButtons = [];
  filterDefs.forEach(f => {
    const b = document.createElement('button');
    b.className = 'filter-btn';
    b.type = 'button';
    b.textContent = f.label;
    b.dataset.filter = f.key;
    b.setAttribute('aria-pressed', f.key === 'todos' ? 'true' : 'false');
    if (f.key === 'todos') b.classList.add('active');
    b.style.pointerEvents = 'auto';
    b.tabIndex = 0;

    b.addEventListener('click', () => {
      filterButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      });
      b.classList.add('active');
      b.setAttribute('aria-pressed', 'true');
      currentFilter = f.key;
      currentPage = 1;
      console.log('[filters] applying filter (clicked):', currentFilter);
      loadAndRender();
    });

    filterButtons.push(b);
    filters.appendChild(b);
  });

  const notifiedToggle = document.createElement('button');
  notifiedToggle.className = 'filter-toggle';
  notifiedToggle.setAttribute('role', 'checkbox');
  notifiedToggle.setAttribute('aria-checked', 'false');
  notifiedToggle.type = 'button';
  notifiedToggle.innerHTML = '🔕 Não notificados';
  notifiedToggle.style.pointerEvents = 'auto';
  notifiedToggle.tabIndex = 0;

  filtersWrap.appendChild(filters);
  filtersWrap.appendChild(notifiedToggle);
  container.appendChild(filtersWrap);

  // Lista
  const list = document.createElement('div');
  list.className = 'list';
  container.appendChild(list);

  // Paginação
  const paginationBar = document.createElement('div');
  paginationBar.className = 'pagination-bar';

  const pageInfo = document.createElement('div');
  pageInfo.className = 'page-info muted';
  paginationBar.appendChild(pageInfo);

  const paginationControls = document.createElement('div');
  paginationControls.className = 'pagination-controls';

  const prevBtn = document.createElement('button'); prevBtn.className = 'btn small'; prevBtn.textContent = 'Anterior';
  const pageInput = document.createElement('input'); pageInput.type = 'number'; pageInput.min = '1'; pageInput.className = 'page-input'; pageInput.style.width = '60px';
  const gotoBtn = document.createElement('button'); gotoBtn.className = 'btn small'; gotoBtn.textContent = 'Ir';
  const nextBtn = document.createElement('button'); nextBtn.className = 'btn small'; nextBtn.textContent = 'Próximo';

  paginationControls.appendChild(prevBtn); paginationControls.appendChild(pageInput); paginationControls.appendChild(gotoBtn); paginationControls.appendChild(nextBtn);
  paginationBar.appendChild(paginationControls);
  container.appendChild(paginationBar);

  // Feedback
  const feedback = el('div', '', 'feedback');
  container.appendChild(feedback);

  // Estado
  let currentFilter = 'todos';
  let currentNotNotified = false;
  let currentSearch = '';
  let currentSort = 'nome';
  let currentPage = 1;
  let currentPageSize = 12;
  let totalItems = 0;
  let totalPages = 1;

  // Render da lista
  function renderList(items) {
    list.innerHTML = '';
    if (!items || items.length === 0) {
      list.appendChild(el('div', 'Nenhum cliente encontrado.'));
      return;
    }
    items.forEach(c => {
      const row = document.createElement('div');
      row.className = 'list-row';
      const left = document.createElement('div');
      left.appendChild(el('div', `${c.nome} ${c.blocked ? '(Bloqueado)' : ''}`, 'list-title'));
      left.appendChild(el('div', `Plano: ${c.planoId || '—'} • Telas: ${c.telas} • Servidores: ${(c.servidores || []).join(', ')}`, 'muted'));
      row.appendChild(left);
      const right = document.createElement('div');
      const editBtn = document.createElement('button'); editBtn.className = 'btn small'; editBtn.textContent = 'Editar';
      editBtn.addEventListener('click', () => openEdit(c.id));
      right.appendChild(editBtn);
      row.appendChild(right);
      list.appendChild(row);
    });
    // force repaint in some browsers after DOM update
    list.offsetHeight;
  }

  // fallback client-side filter implementation
  function applyClientSideFilter(items) {
    if (!items || !items.length) return items;
    if (currentFilter === 'todos') return items;
    if (currentFilter === 'bloqueados') return items.filter(i => Boolean(i.blocked));
    if (currentFilter === 'vencendo') {
      // vencendo ≤ 3 dias: assume campo validade is ISO date
      const now = new Date();
      return items.filter(i => {
        if (!i.validade) return false;
        const d = new Date(i.validade);
        const diffDays = Math.ceil((d - now) / (1000*60*60*24));
        return diffDays >= 0 && diffDays <= 3;
      });
    }
    if (currentFilter === 'vencidos_30_less') {
      const now = new Date();
      return items.filter(i => {
        if (!i.validade) return false;
        const d = new Date(i.validade);
        const diffDays = Math.ceil((now - d) / (1000*60*60*24));
        return diffDays > 0 && diffDays < 30;
      });
    }
    if (currentFilter === 'vencidos_30_plus') {
      const now = new Date();
      return items.filter(i => {
        if (!i.validade) return false;
        const d = new Date(i.validade);
        const diffDays = Math.ceil((now - d) / (1000*60*60*24));
        return diffDays >= 30;
      });
    }
    return items;
  }

  // Load and render (uses fallback filter if API response doesn't reflect filter)
  async function loadAndRender() {
    console.log('[loadAndRender] start', { currentFilter, currentNotNotified, currentSearch, currentSort, currentPage, currentPageSize });
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

      // resp.items may already be filtered server-side; if not, apply client-side fallback
      let items = Array.isArray(resp.items) ? resp.items.slice() : [];
      const beforeCount = items.length;
      const afterFilter = applyClientSideFilter(items);
      // if applying the filter changed the result set size or keys, use filtered set
      items = afterFilter;
      totalItems = resp.total || items.length;
      totalPages = Math.max(1, Math.ceil(totalItems / currentPageSize));

      renderList(items);
      feedback.textContent = `Mostrando página ${currentPage} de ${totalPages}`;
      pageInfo.textContent = `Mostrando ${items.length} de ${totalItems} clientes`;

      prevBtn.disabled = currentPage <= 1;
      nextBtn.disabled = currentPage >= totalPages;
      pageInput.value = currentPage;
      notifiedToggle.setAttribute('aria-checked', String(currentNotNotified));
      notifiedToggle.classList.toggle('active', currentNotNotified);

      console.log('[loadAndRender] done', { returned: items.length, totalItems, serverReturned: beforeCount });
    } catch (err) {
      feedback.textContent = 'Erro ao carregar clientes: ' + (err?.message || String(err));
      console.error('[loadAndRender] error', err);
    }
  }

  // Events and pagination
  function debounce(fn, wait = 200) { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); }; }
  searchInput.addEventListener('input', debounce(() => { currentSearch = searchInput.value.trim(); currentPage = 1; loadAndRender(); }, 300));
  sortSelect.addEventListener('change', () => { currentSort = sortSelect.value; currentPage = 1; loadAndRender(); });
  pageSizeSelect.addEventListener('change', () => { currentPageSize = Number(pageSizeSelect.value) || 12; currentPage = 1; loadAndRender(); });

  notifiedToggle.addEventListener('click', () => {
    currentNotNotified = !currentNotNotified;
    notifiedToggle.setAttribute('aria-checked', String(currentNotNotified));
    notifiedToggle.classList.toggle('active', currentNotNotified);
    currentPage = 1;
    console.log('[notifiedToggle] toggled, currentNotNotified=', currentNotNotified);
    loadAndRender();
  });

  prevBtn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; loadAndRender(); } });
  nextBtn.addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; loadAndRender(); } });
  gotoBtn.addEventListener('click', () => { const v = Math.max(1, Math.min(totalPages, Number(pageInput.value) || 1)); if (v !== currentPage) { currentPage = v; loadAndRender(); } });

  // CRUD
  btnAdd.addEventListener('click', () => {
    openFormModal({
      title: 'Novo cliente',
      renderForm: (container, ctx) => renderClientForm(container, ctx, null),
      onConfirm: async (data) => {
        await createClient(data);
        await loadAndRender();
      }
    }).catch(() => {});
  });

  async function openEdit(id) {
    const resp = await getClients({ page: 1, pageSize: 1000 });
    const item = resp.items.find(x => x.id === id);
    if (!item) return;
    openFormModal({
      title: 'Editar cliente',
      renderForm: (container, ctx) => renderClientForm(container, ctx, item),
      onConfirm: async (data) => {
        await updateClient(id, data);
        await loadAndRender();
      }
    }).catch(() => {});
  }

  // Inicial
  console.log('[mountClientsView] initializing view');
  await loadAndRender();
  root.appendChild(container);
}
