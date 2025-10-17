// js/views/apps.js
import { getApps, createApp, updateApp, deleteApp } from '../mockData.js';
import { openFormModal } from '../modal.js';


export async function mountAppsView(root) {
  const container = document.createElement('section');
  container.className = 'view view-apps';
  const header = document.createElement('div'); header.className='view-header';
  header.appendChild(Object.assign(document.createElement('h2'),{textContent:'Apps'}));
  const actions = document.createElement('div');
  const btnAdd = document.createElement('button'); btnAdd.className='btn'; btnAdd.textContent='Novo App';
  actions.appendChild(btnAdd);
  header.appendChild(actions);
  container.appendChild(header);

  const list = document.createElement('div'); list.className='list';
  container.appendChild(list);
  const feedback = document.createElement('div'); feedback.className='feedback';
  container.appendChild(feedback);

  btnAdd.addEventListener('click', ()=> {
    openFormModal({
      title:'Novo App',
      renderForm:(c,ctx)=> {
        c.appendChild(Object.assign(document.createElement('label'),{textContent:'Nome'}));
        const name = document.createElement('input'); name.type='text';
        c.appendChild(name);
        c.appendChild(Object.assign(document.createElement('label'),{textContent:'URL download'}));
        const url = document.createElement('input'); url.type='url';
        c.appendChild(url);
        const save = document.createElement('button'); save.className='btn'; save.textContent='Salvar';
        save.addEventListener('click', ()=> ctx.resolve({ name: name.value, urlDownload: url.value }));
        const cancel = document.createElement('button'); cancel.className='btn ghost'; cancel.textContent='Cancelar';
        cancel.addEventListener('click', ()=> ctx.cancel());
        c.appendChild(save); c.appendChild(cancel);
      },
      onConfirm: async (data)=> { await createApp(data); await load(); }
    }).catch(()=>{});
  });

  async function load(){
    feedback.textContent = 'Carregando...';
    try {
      const items = await getApps();
      list.innerHTML = '';
      items.forEach(a=>{
        const row = document.createElement('div'); row.className='list-row';
        row.appendChild(Object.assign(document.createElement('div'),{textContent:a.name,className:'list-title'}));
        row.appendChild(Object.assign(document.createElement('div'),{textContent:a.urlDownload,className:'muted'}));
        const edit = document.createElement('button'); edit.className='btn small'; edit.textContent='Editar';
        edit.addEventListener('click', ()=> openEdit(a.id));
        row.appendChild(edit);
        const del = document.createElement('button'); del.className='btn small ghost'; del.textContent='Excluir';
        del.addEventListener('click', async ()=> { await deleteApp(a.id); await load(); });
        row.appendChild(del);
        list.appendChild(row);
      });
      feedback.textContent = `${items.length} apps`;
    } catch (err) {
      feedback.textContent = 'Erro: ' + err.message;
    }
  }

  async function openEdit(id){
    const items = await getApps();
    const a = items.find(x=>x.id===id);
    if (!a) return;
    openFormModal({
      title:'Editar App',
      renderForm:(c,ctx)=> {
        c.appendChild(Object.assign(document.createElement('label'),{textContent:'Nome'}));
        const name = document.createElement('input'); name.type='text'; name.value=a.name;
        c.appendChild(name);
        c.appendChild(Object.assign(document.createElement('label'),{textContent:'URL download'}));
        const url = document.createElement('input'); url.type='url'; url.value=a.urlDownload;
        c.appendChild(url);
        const save = document.createElement('button'); save.className='btn'; save.textContent='Salvar';
        save.addEventListener('click', ()=> ctx.resolve({ name: name.value, urlDownload: url.value }));
        const cancel = document.createElement('button'); cancel.className='btn ghost'; cancel.textContent='Cancelar';
        cancel.addEventListener('click', ()=> ctx.cancel());
        c.appendChild(save); c.appendChild(cancel);
      },
      onConfirm: async (data)=> { await updateApp(id,data); await load(); }
    }).catch(()=>{});
  }

  await load();
  root.appendChild(container);
}
