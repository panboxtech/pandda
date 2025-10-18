// js/views/apps.js
// Form de criação/edição de Apps atualizado para novos campos e select de Servidor
import { getApps, createApp, updateApp, deleteApp, getServers } from '../mockData.js';
import { openFormModal } from '../modal.js';
import { getSession } from '../auth.js';

function el(tag, text, className) {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (className) e.className = className;
  return e;
}

export async function mountAppsView(root) {
  const container = document.createElement('section');
  container.className = 'view view-apps';
  const header = document.createElement('div'); header.className='view-header';
  header.appendChild(Object.assign(document.createElement('h2'),{textContent:'Apps'}));

  const actions = document.createElement('div'); actions.className='view-actions';
  const btnAdd = document.createElement('button'); btnAdd.className='btn'; btnAdd.textContent='Novo app';
  actions.appendChild(btnAdd);
  header.appendChild(actions);
  container.appendChild(header);

  const list = document.createElement('div'); list.className='list';
  const feedback = document.createElement('div'); feedback.className='feedback';
  container.appendChild(list); container.appendChild(feedback);

  async function load(){
    feedback.textContent = 'Carregando...';
    try {
      const apps = await getApps();
      const servers = await getServers();
      list.innerHTML = '';
      apps.forEach(a=>{
        const row = document.createElement('div'); row.className='list-row';
        const left = document.createElement('div');
        const srv = servers.find(s => s.id === a.servidorId);
        left.appendChild(Object.assign(document.createElement('div'),{textContent: a.nome + (a.multiplosAcessos ? ' (multi)' : ''), className:'list-title'}));
        left.appendChild(Object.assign(document.createElement('div'),{textContent: `Código: ${a.codigoDeAcesso} • Servidor: ${srv ? srv.nome : '—'}`, className:'muted'}));
        row.appendChild(left);
        const right = document.createElement('div');
        const edit = document.createElement('button'); edit.className='btn small'; edit.textContent='Editar';
        edit.addEventListener('click', ()=> openEdit(a.id));
        right.appendChild(edit);
        const del = document.createElement('button'); del.className='btn small ghost'; del.textContent='Excluir';
        del.addEventListener('click', ()=> confirmDelete(a.id));
        right.appendChild(del);
        row.appendChild(right);
        list.appendChild(row);
      });
      feedback.textContent = `${apps.length} apps`;
    } catch (err) {
      feedback.textContent = 'Erro: '+err.message;
    }
  }

  btnAdd.addEventListener('click', ()=> {
    openFormModal({
      title: 'Novo app',
      renderForm: (container, ctx) => renderAppForm(container, ctx, null),
      onConfirm: async (data) => { await createApp(data); await load(); }
    }).catch(()=>{});
  });

  async function openEdit(id) {
    const apps = await getApps();
    const app = apps.find(a=>a.id===id);
    if (!app) return;
    openFormModal({
      title: 'Editar app',
      renderForm: (container, ctx) => renderAppForm(container, ctx, app),
      onConfirm: async (data) => { await updateApp(id, data); await load(); }
    }).catch(()=>{});
  }

  function renderAppForm(container, ctx, values = {}) {
    const form = document.createElement('form'); form.className='entity-form';
    // nome (obrigatório)
    const nameLabel = el('label','Nome'); const nameInput = document.createElement('input'); nameInput.type='text'; nameInput.value = values.nome || '';
    form.appendChild(nameLabel); form.appendChild(nameInput);

    const codeLabel = el('label','Código de Acesso'); const codeInput = document.createElement('input'); codeInput.type='text'; codeInput.value = values.codigoDeAcesso || '';
    form.appendChild(codeLabel); form.appendChild(codeInput);

    const srvLabel = el('label','Servidor'); const srvSelect = document.createElement('select');
    form.appendChild(srvLabel); form.appendChild(srvSelect);
    // load servers into select
    getServers().then(srvs => {
      srvSelect.innerHTML = '';
      const empty = document.createElement('option'); empty.value=''; empty.textContent='Selecione servidor'; srvSelect.appendChild(empty);
      srvs.forEach(s => {
        const o = document.createElement('option'); o.value = s.id; o.textContent = s.nome; if (values.servidorId === s.id) o.selected = true; srvSelect.appendChild(o);
      });
    });

    const androidLabel = el('label','URL Download Android'); const androidInput = document.createElement('input'); androidInput.type='url'; androidInput.value = values.urlDownloadAndroid || '';
    form.appendChild(androidLabel); form.appendChild(androidInput);

    const iosLabel = el('label','URL Download iOS'); const iosInput = document.createElement('input'); iosInput.type='url'; iosInput.value = values.urlDownloadIos || '';
    form.appendChild(iosLabel); form.appendChild(iosInput);

    const dlLabel = el('label','Código Download Downloader'); const dlInput = document.createElement('input'); dlInput.type='text'; dlInput.value = values.codigoDownloadDownloader || '';
    form.appendChild(dlLabel); form.appendChild(dlInput);

    const ntLabel = el('label','Código NTDown'); const ntInput = document.createElement('input'); ntInput.type='text'; ntInput.value = values.codigoNTDown || '';
    form.appendChild(ntLabel); form.appendChild(ntInput);

    const multiLabel = el('label','Multiplos Acessos'); 
    const multiSelect = document.createElement('select');
    const opEmpty = document.createElement('option'); opEmpty.value=''; opEmpty.textContent='Selecione';
    const opTrue = document.createElement('option'); opTrue.value='true'; opTrue.textContent='true';
    const opFalse = document.createElement('option'); opFalse.value='false'; opFalse.textContent='false';
    multiSelect.appendChild(opEmpty); multiSelect.appendChild(opTrue); multiSelect.appendChild(opFalse);
    if (typeof values.multiplosAcessos === 'boolean') multiSelect.value = String(values.multiplosAcessos);
    form.appendChild(multiLabel); form.appendChild(multiSelect);

    const save = document.createElement('button'); save.className='btn'; save.type='button'; save.textContent='Salvar';
    save.addEventListener('click', () => {
      // validation
      if (!nameInput.value.trim()) return alert('Nome é obrigatório');
      if (multiSelect.value === '') return alert('Campo multiplosAcessos obrigatório');
      ctx.resolve({
        nome: nameInput.value.trim(),
        codigoDeAcesso: codeInput.value.trim(),
        servidorId: srvSelect.value || null,
        urlDownloadAndroid: androidInput.value.trim(),
        urlDownloadIos: iosInput.value.trim(),
        codigoDownloadDownloader: dlInput.value.trim(),
        codigoNTDown: ntInput.value.trim(),
        multiplosAcessos: multiSelect.value === 'true'
      });
    });

    const cancel = document.createElement('button'); cancel.className='btn ghost'; cancel.type='button'; cancel.textContent='Cancelar';
    cancel.addEventListener('click', ()=> ctx.cancel());

    form.appendChild(save); form.appendChild(cancel);
    container.appendChild(form);
  }

  async function confirmDelete(id) {
    const yes = confirm('Excluir app?');
    if (!yes) return;
    await deleteApp(id);
    await load();
  }

  await load();
  root.appendChild(container);
}
