// js/views/servers.js
// Servidor: nome, alias
import { getServers, createServer, updateServer, deleteServer } from '../mockData.js';
import { openFormModal } from '../modal.js';

function el(tag, text, className) { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (className) e.className = className; return e; }

export async function mountServersView(root) {
  const container = document.createElement('section'); container.className='view view-servers';
  const header = document.createElement('div'); header.className='view-header'; header.appendChild(Object.assign(document.createElement('h2'),{textContent:'Servidores'}));
  const actions = document.createElement('div'); actions.className='view-actions';
  const btnAdd = document.createElement('button'); btnAdd.className='btn'; btnAdd.textContent='Novo servidor'; actions.appendChild(btnAdd);
  header.appendChild(actions); container.appendChild(header);

  const list = document.createElement('div'); list.className='list'; const feedback = document.createElement('div'); feedback.className='feedback';
  container.appendChild(list); container.appendChild(feedback);

  async function load() {
    feedback.textContent = 'Carregando...';
    try {
      const servers = await getServers();
      list.innerHTML = '';
      servers.forEach(s=>{
        const row = document.createElement('div'); row.className='list-row';
        row.appendChild(Object.assign(document.createElement('div'),{textContent: s.nome + (s.alias ? ` — ${s.alias}` : ''), className:'list-title'}));
        const right = document.createElement('div');
        const edit = document.createElement('button'); edit.className='btn small'; edit.textContent='Editar';
        edit.addEventListener('click', ()=> openEdit(s.id));
        right.appendChild(edit);
        const del = document.createElement('button'); del.className='btn small ghost'; del.textContent='Excluir';
        del.addEventListener('click', async ()=> { if(confirm('Excluir servidor?')) { await deleteServer(s.id); await load(); }});
        right.appendChild(del);
        row.appendChild(right);
        list.appendChild(row);
      });
      feedback.textContent = `${servers.length} servidores`;
    } catch (err) {
      feedback.textContent = 'Erro: ' + err.message;
    }
  }

  btnAdd.addEventListener('click', ()=> {
    openFormModal({
      title: 'Novo servidor',
      renderForm: (container, ctx) => {
        const nameLabel = el('label','Nome'); const nameInput = document.createElement('input'); nameInput.type='text';
        const aliasLabel = el('label','Alias'); const aliasInput = document.createElement('input'); aliasInput.type='text';
        container.appendChild(nameLabel); container.appendChild(nameInput);
        container.appendChild(aliasLabel); container.appendChild(aliasInput);
        const save = document.createElement('button'); save.className='btn'; save.type='button'; save.textContent='Salvar';
        save.addEventListener('click', ()=> {
          if (!nameInput.value.trim()) return alert('Nome obrigatório');
          ctx.resolve({ nome: nameInput.value.trim(), alias: aliasInput.value.trim() });
        });
        const cancel = document.createElement('button'); cancel.className='btn ghost'; cancel.type='button'; cancel.textContent='Cancelar'; cancel.addEventListener('click', ()=> ctx.cancel());
        container.appendChild(save); container.appendChild(cancel);
      },
      onConfirm: async (data) => { await createServer(data); await load(); }
    }).catch(()=>{});
  });

  async function openEdit(id) {
    const servers = await getServers();
    const s = servers.find(x=>x.id===id);
    if (!s) return;
    openFormModal({
      title: 'Editar servidor',
      renderForm: (container, ctx) => {
        const nameLabel = el('label','Nome'); const nameInput = document.createElement('input'); nameInput.type='text'; nameInput.value = s.nome;
        const aliasLabel = el('label','Alias'); const aliasInput = document.createElement('input'); aliasInput.type='text'; aliasInput.value = s.alias || '';
        container.appendChild(nameLabel); container.appendChild(nameInput);
        container.appendChild(aliasLabel); container.appendChild(aliasInput);
        const save = document.createElement('button'); save.className='btn'; save.type='button'; save.textContent='Salvar';
        save.addEventListener('click', ()=> {
          if (!nameInput.value.trim()) return alert('Nome obrigatório');
          ctx.resolve({ nome: nameInput.value.trim(), alias: aliasInput.value.trim() });
        });
        const cancel = document.createElement('button'); cancel.className='btn ghost'; cancel.type='button'; cancel.textContent='Cancelar'; cancel.addEventListener('click', ()=> ctx.cancel());
        container.appendChild(save); container.appendChild(cancel);
      },
      onConfirm: async (data) => { await updateServer(id, data); await load(); }
    }).catch(()=>{});
  }

  await load();
  root.appendChild(container);
}
