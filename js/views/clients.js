// js/views/clients.js
// Implementa toolbar com busca, ordenação; filtros com estado ativo; paginação.
// Inclui toggle global "Não notificados" que funciona em conjunto com os filtros.
import { getClients, createClient, updateClient } from '../mockData.js';
import { openFormModal } from '../modal.js';
import { getSession } from '../auth.js';

function el(tag, text, className) {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (className) e.className = className;
  return e;
}

// UTIL: diferença em dias
function daysUntil(dateStr) {
  const today = new Date();
  const d = new Date(dateStr);
  return Math.floor((d - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / (1000*60*60*24));
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
  searchInput.id = 'clientSearch';
  searchInput.placeholder = 'Buscar por nome, telefone ou email';
  toolbar.appendChild(searchInput);

  const sortSelect = document.createElement('select');
  sortSelect.id = 'clientSort';
  const optDue = document.createElement('option'); optDue.value = 'dueDate'; optDue.textContent = 'Ordenar por vencimento';
  const optName = document.createElement('option'); optName.value = 'name'; optName.textContent = 'Ordenar por nome';
  sortSelect.appendChild(optDue); sortSelect.appendChild(optName);
  toolbar.appendChild(sortSelect);

  const pageSizeSelect = document.createElement('select');
  pageSizeSelect.id = 'clientPageSize';
  [10, 25, 50, 100].forEach(n => {
    const o = document.createElement('option'); o.value = String(n); o.textContent = `${n} por página`; pageSizeSelect.appendChild(o);
  });
  pageSizeSelect.value = '12'; // visual; mockData default 12
  toolbar.appendChild(pageSizeSelect);

  container.appendChild(toolbar);

  // Filters (com toggle visual active) + toggle "Não notificados"
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

  // Toggle button for "Não notificados" (works as independent checkbox-style filter)
  const notifiedToggle = document.createElement('button');
  notifiedToggle.className = 'filter-toggle';
  notifiedToggle.setAttribute('role', 'checkbox');
  notifiedToggle.setAttribute('aria-checked', 'false');
  notifiedToggle.title = 'Mostrar apenas clientes não notificados';
  notifiedToggle.type = 'button';
  notifiedToggle.innerHTML = '🔕 Não notificados';

  filtersWrap.appendChild(filters);
  filtersWrap.appendChild(notifiedToggle);
  container.appendChild(filtersWrap);

  // List + pagination area
  const list = document.createElement('div'); list.className = 'list';
  container.appendChild(list);

  const paginationBar = document.createElement('div'); paginationBar.className = 'pagination-bar';
  const pageInfo = document.createElement('div'); pageInfo.className = 'page-info muted';
  paginationBar.appendChild(pageInfo);

  const paginationControls = document.createElement('div'); paginationControls.className = 'pagination-controls';
  const prevBtn = document.createElement('button'); prevBtn.className = 'btn small'; prevBtn.textContent = 'Anterior';
  const nextBtn = document.createElement('button'); nextBtn.className = 'btn small'; nextBtn.textContent = 'Próximo';
  const pageInput = document.createElement('input'); pageInput.type = 'number'; pageInput.min = '1'; pageInput.className = 'page-input'; pageInput.style.width = '60px';
  const gotoBtn = document.createElement('button'); gotoBtn.className = 'btn small'; gotoBtn.textContent = 'Ir';
  paginationControls.appendChild(prevBtn);
  paginationControls.appendChild(pageInput);
  paginationControls.appendChild(gotoBtn);
  paginationControls.appendChild(nextBtn);
  paginationBar.appendChild(paginationControls);

  container.appendChild(paginationBar);

  // Feedback
  const feedback = el('div', '', 'feedback');
  container.appendChild(feedback);

  // Estado local
  let currentFilter = 'todos';
  let currentPage = 1;
  let currentPageSize = 12;
  let currentSearch = '';
  let currentSort = 'dueDate';
  let currentNotNotified = false; // quando true, filtra notified === false
  let totalItems = 0;
  let totalPages = 1;

  // Helper: render list of clients (items já paginados)
  function renderList(items) {
    list.innerHTML = '';
    if (!items || items.length === 0) {
      list.appendChild(el('div','Nenhum cliente encontrado.'));
      return;
    }
    items.forEach(c => {
      const row = document.createElement('div'); row.className = 'list-row';
      const left = document.createElement('div');
      left.appendChild(el('div', c.name + (c.blocked ? ' (Bloqueado)' : ''), 'list-title'));
      left.appendChild(el('div', `Venc: ${c.dueDate} • ${c.email} • ${c.phone}`, 'muted'));
      row.appendChild(left);

      const right = document.createElement('div'); right.className = 'list-actions';
      const editBtn = document.createElement('button'); editBtn.className = 'btn small'; editBtn.textContent = 'Editar';
      editBtn.addEventListener('click', () => openEdit(c.id));
      right.appendChild(editBtn);

      const sessionObj = session || getSession();
      if (sessionObj && sessionObj.role === 'master') {
        const delBtn = document.createElement('button'); delBtn.className = 'btn small ghost'; delBtn.textContent = 'Excluir';
        delBtn.addEventListener('click', () => confirmDelete(c.id));
        right.appendChild(delBtn);
      } else {
        const blockBtn = document.createElement('button'); blockBtn.className = 'btn small ghost';
        blockBtn.textContent = c.blocked ? 'Desbloquear' : 'Bloquear';
        blockBtn.addEventListener('click', () => toggleBlocked(c.id, !c.blocked));
        right.appendChild(blockBtn);
      }

      row.appendChild(right);
      list.appendChild(row);
    });
  }

  // Carrega dados (usa getClients paginado)
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
      // atualizar estado dos botões
      prevBtn.disabled = currentPage <= 1;
      nextBtn.disabled = currentPage >= totalPages;
      pageInput.value = currentPage;
      // atualizar estado visual do toggle (caso external changes)
      notifiedToggle.setAttribute('aria-checked', String(currentNotNotified));
      notifiedToggle.classList.toggle('active', currentNotNotified);
    } catch (err) {
      feedback.textContent = 'Erro ao carregar clientes: ' + err.message;
    }
  }

  // Eventos: busca / sort / pageSize
  searchInput.addEventListener('input', debounce(() => {
    currentSearch = searchInput.value.trim();
    currentPage = 1;
    loadAndRender();
  }, 300));

  sortSelect.addEventListener('change', () => {
    currentSort = sortSelect.value;
    currentPage = 1;
    loadAndRender();
  });

  pageSizeSelect.addEventListener('change', () => {
    currentPageSize = Number(pageSizeSelect.value) || 12;
    currentPage = 1;
    loadAndRender();
  });

  // filtros: toggles que setam active visual e atualizam filtro (status)
  filters.addEventListener('click', (e) => {
    if (!(e.target instanceof HTMLElement)) return;
    const f = e.target.dataset.filter;
    if (!f) return;
    // remover active de todos e aplicar no selecionado
    filters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    currentFilter = f;
    currentPage = 1;
    loadAndRender();
  });

  // toggle "Não notificados" (aplica em conjunto com status)
  notifiedToggle.addEventListener('click', () => {
    currentNotNotified = !currentNotNotified;
    notifiedToggle.setAttribute('aria-checked', String(currentNotNotified));
    notifiedToggle.classList.toggle('active', currentNotNotified);
    currentPage = 1;
    loadAndRender();
  });

  // paginação
  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; loadAndRender(); }
  });
  nextBtn.addEventListener('click', () => {
    if (currentPage < totalPages) { currentPage++; loadAndRender(); }
  });
  gotoBtn.addEventListener('click', () => {
    const v = Math.max(1, Math.min(totalPages, Number(pageInput.value) || 1));
    if (v !== currentPage) { currentPage = v; loadAndRender(); }
  });

  // CRUD actions
  btnAdd.addEventListener('click', () => {
    openFormModal({
      title: 'Novo cliente',
      renderForm: renderClientForm,
      onConfirm: async (data) => {
        if (!data.name) throw new Error('Nome obrigatório');
        await createClient(data);
        // após criar, recarregar na primeira página
        currentPage = 1;
        await loadAndRender();
      }
    }).catch(()=>{});
  });

  async function openEdit(id) {
    const resp = await getClients({ page:1, pageSize:9999 }); // pegar todos para encontrar
    const item = resp.items.find(x => x.id === id);
    if (!item) return;
    openFormModal({
      title: 'Editar cliente',
      renderForm: (container, ctx) => renderClientForm(container, ctx, item),
      onConfirm: async (data) => {
        await updateClient(id, data);
        await loadAndRender();
      }
    }).catch(()=>{});
  }

  async function confirmDelete(id) {
    openFormModal({
      title: 'Confirmar exclusão',
      renderForm: (container, ctx) => {
        container.appendChild(el('div','Deseja realmente excluir este cliente?'));
        const okBtn = document.createElement('button');
        okBtn.className = 'btn';
        okBtn.textContent = 'Excluir';
        okBtn.addEventListener('click', async () => {
          try {
            // por segurança, marcar como blocked antes de remover em protótipo
            await updateClient(id, { blocked: true });
            ctx.resolve(true);
            await loadAndRender();
          } catch (err) {
            ctx.resolve(false);
          }
        });
        const cancel = document.createElement('button');
        cancel.className = 'btn ghost';
        cancel.textContent = 'Cancelar';
        cancel.addEventListener('click', () => ctx.cancel());
        container.appendChild(okBtn);
        container.appendChild(cancel);
      },
      onConfirm: () => { loadAndRender(); }
    }).catch(()=>{});
  }

  async function toggleBlocked(id, blocked) {
    try {
      await updateClient(id, { blocked });
      await loadAndRender();
    } catch (err) {
      alert('Erro ao atualizar bloqueio: ' + err.message);
    }
  }

  function renderClientForm(container, ctx, values = {}) {
    const form = document.createElement('form');
    form.className = 'entity-form';

    const nameLabel = el('label','Nome');
    const nameInput = document.createElement('input'); nameInput.type='text'; nameInput.value = values.name || '';
    form.appendChild(nameLabel); form.appendChild(nameInput);

    const phoneLabel = el('label','Telefone');
    const phoneInput = document.createElement('input'); phoneInput.type='text'; phoneInput.value = values.phone || '';
    form.appendChild(phoneLabel); form.appendChild(phoneInput);

    const emailLabel = el('label','Email');
    const emailInput = document.createElement('input'); emailInput.type='email'; emailInput.value = values.email || '';
    form.appendChild(emailLabel); form.appendChild(emailInput);

    const dueLabel = el('label','Data de vencimento');
    const dueInput = document.createElement('input'); dueInput.type='date'; dueInput.value = values.dueDate || '';
    form.appendChild(dueLabel); form.appendChild(dueInput);

    const notifiedLabel = el('label','Notificado');
    const notifiedInput = document.createElement('input'); notifiedInput.type='checkbox'; notifiedInput.checked = !!values.notified;
    notifiedLabel.appendChild(notifiedInput);
    notifiedLabel.appendChild(document.createTextNode(' Marcar se notificado'));
    form.appendChild(notifiedLabel);

    const submitBtn = document.createElement('button'); submitBtn.className='btn'; submitBtn.textContent = 'Salvar';
    submitBtn.type = 'button';
    submitBtn.addEventListener('click', () => {
      const payload = {
        name: nameInput.value.trim(),
        phone: phoneInput.value.trim(),
        email: emailInput.value.trim(),
        dueDate: dueInput.value,
        notified: !!notifiedInput.checked
      };
      ctx.resolve(payload);
    });

    const cancelBtn = document.createElement('button'); cancelBtn.className='btn ghost'; cancelBtn.type='button'; cancelBtn.textContent='Cancelar';
    cancelBtn.addEventListener('click', () => ctx.cancel());

    form.appendChild(submitBtn);
    form.appendChild(cancelBtn);
    container.appendChild(form);
  }

  // debounce util
  function debounce(fn, wait = 200) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  // inicializar valores (pageSize default coerente)
  currentPageSize = Number(pageSizeSelect.value) || 12;
  await loadAndRender();
  root.appendChild(container);
}
