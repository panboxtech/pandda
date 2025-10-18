// js/views/clients.js
// View de Clientes com logs temporários para depuração dos filtros
// - Mantive integração com clientForm
// - Logs adicionados nos handlers de filtro, toggle "Não notificados" e no ciclo de load/render
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

  const filters = document.createElement('div');
  filters.className = 'client-filters';

  const filterDefs = [
    { key: 'todos', label: 'Todos' },
    { key: 'vencendo', label: 'Vencendo (≤3d)' },
    { key: 'vencidos_30_less', label: 'Vencidos <30d' },
    { key: 'vencidos_30_plus', label: 'Vencidos ≥30d' },
    { key: 'bloqueados', label: 'Bloqueados' }
  ];

  // criar botões e guardar referência
  const filterButtons = [];
  filterDefs.forEach(f => {
    const b = document.createElement('button');
    b.className = 'filter-btn';
    b.type = 'button';
    b.textContent = f.label;
    b.dataset.filter = f.key;
    b.setAttribute('aria-pressed', f.key === 'todos' ? 'true' : 'false');
    if (f.key === 'todos') b.classList.add('active');
    // listener individual (mesma lógica do toggle) com logs
    b.addEventListener('click', (ev) => {
      console.log('[filters] click event:', { filterKey: f.key, text: f.label, eventTarget: ev.target, currentTarget: ev.currentTarget });
      // desativar todas
      filterButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      });
      // ativar esta
      b.classList.add('active');
      b.setAttribute('aria-pressed', 'true');
      // atualizar estado e recarregar
      currentFilter = f.key;
      currentPage = 1;
      console.log('[filters] applying filter:', currentFilter);
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

  const prevBtn = document.createElement('button');
  prevBtn.className = 'btn small';
  prevBtn.textContent = 'Anterior';

  const pageInput = document.createElement('input');
  pageInput.type = 'number';
  pageInput.min = '1';
  pageInput.className = 'page-input';
  pageInput.style.width = '60px';

  const gotoBtn = document.createElement('button');
  gotoBtn.className = 'btn small';
  gotoBtn.textContent = 'Ir';

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn small';
  nextBtn.textContent = 'Próximo';

  paginationControls.appendChild(prevBtn);
  paginationControls.appendChild(pageInput);
  paginationControls.appendChild(gotoBtn);
  paginationControls.appendChild(nextBtn);
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
      const editBtn = document.createElement('button');
      editBtn.className = 'btn small';
      editBtn.textContent = 'Editar';
      editBtn.addEventListener('click', () => openEdit(c.id));
      right.appendChild(editBtn);

      row.appendChild(right);
      list.appendChild(row);
    });
  }

  // Carregar e renderizar
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

      totalItems = resp.total || 0;
      totalPages = Math.max(1, Math.ceil(totalItems / currentPageSize));

      renderList(resp.items);
      feedback.textContent = `Mostrando página ${currentPage} de ${totalPages}`;
      pageInfo.textContent = `Mostrando ${resp.items.length} de ${totalItems} clientes`;

      prevBtn.disabled = currentPage <= 1;
      nextBtn.disabled = currentPage >= totalPages;
      pageInput.value = currentPage;

      notifiedToggle.setAttribute('aria-checked', String(currentNotNotified));
      notifiedToggle.classList.toggle('active', currentNotNotified);

      console.log('[loadAndRender] done', { returned: resp.items?.length || 0, totalItems });
    } catch (err) {
      feedback.textContent = 'Erro ao carregar clientes: ' + (err?.message || String(err));
      console.error('[loadAndRender] error', err);
    }
  }

  // Eventos
  function debounce(fn, wait = 200) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  searchInput.addEventListener('input', debounce(() => {
    currentSearch = searchInput.value.trim();
    currentPage = 1;
    console.log('[search] value', currentSearch);
    loadAndRender();
  }, 300));

  sortSelect.addEventListener('change', () => {
    currentSort = sortSelect.value;
    currentPage = 1;
    console.log('[sort] value', currentSort);
    loadAndRender();
  });

  pageSizeSelect.addEventListener('change', () => {
    currentPageSize = Number(pageSizeSelect.value) || 12;
    currentPage = 1;
    console.log('[pageSize] value', currentPageSize);
    loadAndRender();
  });

  // Notified toggle with logs
  notifiedToggle.addEventListener('click', () => {
    currentNotNotified = !currentNotNotified;
    notifiedToggle.setAttribute('aria-checked', String(currentNotNotified));
    notifiedToggle.classList.toggle('active', currentNotNotified);
    currentPage = 1;
    console.log('[notifiedToggle] toggled, currentNotNotified=', currentNotNotified);
    loadAndRender();
  });

  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      console.log('[pagination] prev, page=', currentPage);
      loadAndRender();
    }
  });

  nextBtn.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      console.log('[pagination] next, page=', currentPage);
      loadAndRender();
    }
  });

  gotoBtn.addEventListener('click', () => {
    const v = Math.max(1, Math.min(totalPages, Number(pageInput.value) || 1));
    if (v !== currentPage) {
      currentPage = v;
      console.log('[pagination] goto, page=', currentPage);
      loadAndRender();
    }
  });

  // CRUD: criar / editar (com logs)
  btnAdd.addEventListener('click', () => {
    console.log('[btnAdd] abrir modal novo cliente');
    openFormModal({
      title: 'Novo cliente',
      renderForm: (container, ctx) => renderClientForm(container, ctx, null),
      onConfirm: async (data) => {
        console.log('[createClient] payload', data);
        await createClient(data);
        await loadAndRender();
      }
    }).catch((err) => { console.warn('[btnAdd] modal closed/rejected', err); });
  });

  async function openEdit(id) {
    console.log('[openEdit] id', id);
    const resp = await getClients({ page: 1, pageSize: 1000 });
    const item = resp.items.find(x => x.id === id);
    if (!item) {
      console.warn('[openEdit] item not found', id);
      return;
    }

    openFormModal({
      title: 'Editar cliente',
      renderForm: (container, ctx) => renderClientForm(container, ctx, item),
      onConfirm: async (data) => {
        console.log('[updateClient] id, payload', id, data);
        await updateClient(id, data);
        await loadAndRender();
      }
    }).catch((err) => { console.warn('[openEdit] modal closed/rejected', err); });
  }

  // Inicial
  console.log('[mountClientsView] initializing view');
  await loadAndRender();
  root.appendChild(container);
}
