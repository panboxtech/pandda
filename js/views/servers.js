// js/views/servers.js
import { getServers, createServer, updateServer, deleteServer } from '../mockData.js';
import { openFormModal } from '../modal.js';
import { getSession } from '../auth.js';

export async function mountServersView(root) {
  const role = (getSession() || {}).role || 'comum';

  const container = document.createElement('section');
  container.className = 'view view-servers';
  const header = document.createElement('div'); header.className='view-header';
  header.appendChild(Object.assign(document.createElement('h2'),{textContent:'Servidores'}));

  const actions = document.createElement('div');
  const btnAdd = document.createElement('button'); btnAdd.className='btn'; btnAdd.textContent='Novo servidor';
  actions.appendChild(btnAdd);
  header.appendChild(actions);
  container.appendChild(header);

  const list = document.createElement('div'); list.className='list';
  container.appendChild(list);
  const feedback = document.createElement('div'); feedback.className='feedback';
  container.appendChild(feedback);

  async function load() {
    feedback.textContent = 'Carregando...';
    try {
      const items = await getServers();
      list.innerHTML = '';
      items.forEach(s=>{
        const row = document.createElement('div'); row.className='list-row';
        const left = document.createElement('div');
        left.appendChild(Object.assign(document.createElement('div'),{textContent:s.name,className:'list-title'}));
        left.appendChild(Object.assign(document.createElement('div'),{textContent:s.url,className:'muted'}));
        row.appendChild(left);
        const right = document.createElement('div');
        const edit = document.createElement('button'); edit.className='btn small'; edit.textContent='Editar';

        // regra de permissões: comum NÃO pode editar servidores
        if (role === 'master') {
          edit.addEventListener('click',()=> openEdit(s.id));
          right.appendChild(edit);

          const del = document.createElement('button'); del.className='btn small ghost'; del.textContent='Excluir';
          del.addEventListener('click',()=> confirmDelete(s.id));
          right.appendChild(del);
        } else {
          // comum: apenas adiciona novo servidor (botão "Editar" não exibido)
          // mostrar apenas um indicador se quiser (opcional)
          const dash = document.createElement('span'); dash.className='muted'; dash.textContent='';
          right.appendChild(dash);
        }

        row.appendChild(right);
        list.appendChild(row);
      });
      feedback.textContent = `${items.length} servidores`;
    } catch (err) {
      feedback.textContent = 'Erro: '+err.message;
    }
  }

  btnAdd.addEventListener('click', ()=>{
    // ambos os roles podem adicionar novo servidor (conforme regra)
    openFormModal({
      title: 'Novo servidor',
      renderForm: (container, ctx) => {
        const nameLabel = document.createElement('label'); nameLabel.textContent='Nome';
        const nameInput = document.createElement('input'); nameInput.type='text';
        const urlLabel = document.createElement('label'); urlLabel.textContent='URL';
        const urlInput = document.createElement('input'); urlInput.type='url';
        const saveBtn = document.createElement('button'); saveBtn.className='btn'; saveBtn.textContent='Salvar';
        saveBtn.addEventListener('click', ()=> ctx.resolve({ name: nameInput.value, url: urlInput.value }));
        const cancelBtn = document.createElement('button'); cancelBtn.className='btn ghost'; cancelBtn.textContent='Cancelar';
        cancelBtn.addEventListener('click', ()=> ctx.cancel());

        container.appendChild(nameLabel); container.appendChild(nameInput);
        container.appendChild(urlLabel); container.appendChild(urlInput);
        container.appendChild(saveBtn); container.appendChild(cancelBtn);
      },
      onConfirm: async (data) => { await createServer(data); await load(); }
    }).catch(()=>{});
  });

  async function openEdit(id) {
    // apenas master alcança aqui (ver load logic)
    const items = await getServers();
    const s = items.find(x=>x.id===id);
    if (!s) return;
    openFormModal({
      title: 'Editar servidor',
      renderForm: (container, ctx) => {
        const nameLabel = document.createElement('label'); nameLabel.textContent='Nome';
        const nameInput = document.createElement('input'); nameInput.type='text'; nameInput.value = s.name;
        const urlLabel = document.createElement('label'); urlLabel.textContent='URL';
        const urlInput = document.createElement('input'); urlInput.type='url'; urlInput.value = s.url;
        const saveBtn = document.createElement('button'); saveBtn.className='btn'; saveBtn.textContent='Salvar';
        saveBtn.addEventListener('click', ()=> ctx.resolve({ name: nameInput.value, url: urlInput.value }));
        const cancelBtn = document.createElement('button'); cancelBtn.className='btn ghost'; cancelBtn.textContent='Cancelar';
        cancelBtn.addEventListener('click', ()=> ctx.cancel());
        container.appendChild(nameLabel); container.appendChild(nameInput);
        container.appendChild(urlLabel); container.appendChild(urlInput);
        container.appendChild(saveBtn); container.appendChild(cancelBtn);
      },
      onConfirm: async (data) => { await updateServer(id, data); await load(); }
    }).catch(()=>{});
  }

  async function confirmDelete(id) {
    openFormModal({
      title: 'Confirmar exclusão',
      renderForm: (container, ctx) => {
        container.appendChild(Object.assign(document.createElement('div'),{textContent:'Remover servidor?' }));
        const ok = document.createElement('button'); ok.className='btn'; ok.textContent='Excluir';
        ok.addEventListener('click', async ()=> {
          await deleteServer(id);
          ctx.resolve(true);
        });
        const cancel = document.createElement('button'); cancel.className='btn ghost'; cancel.textContent='Cancelar';
        cancel.addEventListener('click', ()=> ctx.cancel());
        container.appendChild(ok); container.appendChild(cancel);
      },
      onConfirm: () => load()
    }).catch(()=>{});
  }

  await load();
  root.appendChild(container);
}
