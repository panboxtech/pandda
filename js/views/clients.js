// js/views/clients.js
import { getClients, createClient, updateClient, deleteClient } from '../mockData.js';
import { openFormModal } from '../modal.js';
import { getSession } from '../auth.js';

function el(tag, text, className) {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (className) e.className = className;
  return e;
}

function daysUntil(dateStr) {
  const today = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((d - new Date(today.getFullYear(),today.getMonth(),today.getDate())) / (1000*60*60*24));
  return diff;
}

function applyFilter(items, filterKey) {
  if (filterKey === 'vencendo') {
    return items.filter(c => daysUntil(c.dueDate) <= 3 && daysUntil(c.dueDate) >= 0);
  }
  if (filterKey === 'vencidos_30_plus') {
    return items.filter(c => daysUntil(c.dueDate) < -30);
  }
  if (filterKey === 'vencidos_30_less') {
    return items.filter(c => daysUntil(c.dueDate) < 0 && daysUntil(c.dueDate) >= -30);
  }
  if (filterKey === 'notificados') {
    return items.filter(c => c.notified === true);
  }
  return items;
}

export async function mountClientsView(root, { session } = {}) {
  const container = document.createElement('section');
  container.className = 'view view-clients';

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

  const filters = document.createElement('div');
  filters.className = 'filters';
  const filterDefs = [
    { key: 'todos', label: 'Todos' },
    { key: 'vencendo', label: 'Vencendo (<=3d)' },
    { key: 'vencidos_30_less', label: 'Vencidos <30d' },
    { key: 'vencidos_30_plus', label: 'Vencidos >=30d' },
    { key: 'notificados', label: 'Notificados' }
  ];
  filterDefs.forEach(f => {
    const b = document.createElement('button');
    b.className = 'btn small';
    b.textContent = f.label;
    b.dataset.filter = f.key;
    filters.appendChild(b);
  });
  container.appendChild(filters);

  const list = document.createElement('div');
  list.className = 'list';
  container.appendChild(list);

  const feedback = el('div', '', 'feedback');
  container.appendChild(feedback);

  let currentFilter = 'todos';

  async function loadAndRender() {
    feedback.textContent = 'Carregando...';
    try {
      const items = await getClients();
      const filtered = applyFilter(items, currentFilter);
      renderList(filtered);
      feedback.textContent = `${filtered.length} clientes exibidos`;
    } catch (err) {
      feedback.textContent = 'Erro ao carregar clientes: ' + err.message;
    }
  }

  function renderList(items) {
    list.innerHTML = '';
    if (items.length === 0) {
      list.appendChild(el('div','Nenhum cliente encontrado.'));
      return;
    }
    items.forEach(c => {
      const row = document.createElement('div');
      row.className = 'list-row';
      const left = document.createElement('div');
      left.appendChild(el('div', c.name, 'list-title'));
      left.appendChild(el('div', `Venc: ${c.dueDate} • ${c.email} • ${c.phone}`, 'muted'));
      row.appendChild(left);

      const right = document.createElement('div');
      right.className = 'list-actions';
      const editBtn = document.createElement('button');
      editBtn.className = 'btn small';
      editBtn.textContent = 'Editar';
      editBtn.addEventListener('click', () => openEdit(c.id));
      right.appendChild(editBtn);

      const sessionObj = session || getSession();
      if (sessionObj && sessionObj.role === 'master') {
        const delBtn = document.createElement('button');
        delBtn.className = 'btn small ghost';
        delBtn.textContent = 'Excluir';
        delBtn.addEventListener('click', () => confirmDelete(c.id));
        right.appendChild(delBtn);
      }

      row.appendChild(right);
      list.appendChild(row);
    });
  }

  btnAdd.addEventListener('click', () => {
    openFormModal({
      title: 'Novo cliente',
      renderForm: renderClientForm,
      onConfirm: async (data) => {
        if (!data.name) throw new Error('Nome obrigatório');
        await createClient(data);
        await loadAndRender();
      }
    }).catch(()=>{});
  });

  async function openEdit(id) {
    const all = await getClients();
    const item = all.find(x => x.id === id);
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
          await deleteClient(id);
          ctx.resolve(true);
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

  filters.addEventListener('click', (e) => {
    if (!(e.target instanceof HTMLElement)) return;
    const f = e.target.dataset.filter;
    if (!f) return;
    currentFilter = f;
    loadAndRender();
  });

  await loadAndRender();
  root.appendChild(container);
}
