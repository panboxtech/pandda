// js/views/plans.js
import { getPlans, createPlan, updatePlan, deletePlan } from '../js/mockData.js';
import { openFormModal } from '../js/modal.js';

export async function mountPlansView(root) {
  const container = document.createElement('section');
  container.className = 'view view-plans';
  const header = document.createElement('div'); header.className='view-header';
  header.appendChild(Object.assign(document.createElement('h2'),{textContent:'Planos'}));
  const actions = document.createElement('div');
  const btnAdd = document.createElement('button'); btnAdd.className='btn'; btnAdd.textContent='Novo plano';
  actions.appendChild(btnAdd);
  header.appendChild(actions);
  container.appendChild(header);

  const list = document.createElement('div'); list.className='list';
  container.appendChild(list);
  const feedback = document.createElement('div'); feedback.className='feedback';
  container.appendChild(feedback);

  btnAdd.addEventListener('click', ()=> {
    openFormModal({
      title:'Novo plano',
      renderForm:(c,ctx)=> {
        c.appendChild(Object.assign(document.createElement('label'),{textContent:'Nome'}));
        const name = document.createElement('input'); name.type='text';
        c.appendChild(name);
        const save = document.createElement('button'); save.className='btn'; save.textContent='Salvar';
        save.addEventListener('click', ()=> ctx.resolve({ name: name.value }));
        const cancel = document.createElement('button'); cancel.className='btn ghost'; cancel.textContent='Cancelar';
        cancel.addEventListener('click', ()=> ctx.cancel());
        c.appendChild(save); c.appendChild(cancel);
      },
      onConfirm: async (data)=> { await createPlan(data); await load(); }
    }).catch(()=>{});
  });

  async function load(){
    feedback.textContent = 'Carregando...';
    try {
      const items = await getPlans();
      list.innerHTML = '';
      items.forEach(p=>{
        const row = document.createElement('div'); row.className='list-row';
        row.appendChild(Object.assign(document.createElement('div'),{textContent:p.name,className:'list-title'}));
        const edit = document.createElement('button'); edit.className='btn small'; edit.textContent='Editar';
        edit.addEventListener('click', ()=> openEdit(p.id));
        row.appendChild(edit);
        const del = document.createElement('button'); del.className='btn small ghost'; del.textContent='Excluir';
        del.addEventListener('click', async ()=> { await deletePlan(p.id); await load(); });
        row.appendChild(del);
        list.appendChild(row);
      });
      feedback.textContent = `${items.length} planos`;
    } catch (err) {
      feedback.textContent = 'Erro: ' + err.message;
    }
  }

  async function openEdit(id){
    const items = await getPlans();
    const p = items.find(x=>x.id===id);
    if (!p) return;
    openFormModal({
      title:'Editar plano',
      renderForm:(c,ctx)=> {
        c.appendChild(Object.assign(document.createElement('label'),{textContent:'Nome'}));
        const name = document.createElement('input'); name.type='text'; name.value=p.name;
        c.appendChild(name);
        const save = document.createElement('button'); save.className='btn'; save.textContent='Salvar';
        save.addEventListener('click', ()=> ctx.resolve({ name: name.value }));
        const cancel = document.createElement('button'); cancel.className='btn ghost'; cancel.textContent='Cancelar';
        cancel.addEventListener('click', ()=> ctx.cancel());
        c.appendChild(save); c.appendChild(cancel);
      },
      onConfirm: async (data)=> { await updatePlan(id,data); await load(); }
    }).catch(()=>{});
  }

  await load();
  root.appendChild(container);
}
