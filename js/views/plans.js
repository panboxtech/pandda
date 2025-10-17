// js/views/plans.js
import { getPlans, createPlan, updatePlan, deletePlan } from '../mockData.js';
import { openFormModal } from '../modal.js';
import { getSession } from '../auth.js';

export async function mountPlansView(root) {
  const role = (getSession() || {}).role || 'comum';

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
    // ambos podem adicionar planos (conforme regra)
    openFormModal({
      title:'Novo plano',
      renderForm:(c,ctx)=> {
        c.appendChild(Object.assign(document.createElement('label'),{textContent:'Nome'}));
        const name = document.createElement('input'); name.type='text';
        c.appendChild(name);
        const save = document.createElement('button'); save.className='btn'; save.textContent='Salvar';
        save.addEventListener('click', ()=> ctx.resolve({ name: name.value }));
        const cancel = document.createElement('button'); cancel.className='btn ghost'; cancel.textContent='Cancelar'; cancel.addEventListener('click', ()=> ctx.cancel());
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
        const right = document.createElement('div');
        // regra: comum NÃO pode editar planos; apenas master edita/exclui
        if (role === 'master') {
          const edit = document.createElement('button'); edit.className='btn small'; edit.textContent='Editar';
          edit.addEventListener('click', ()=> openEdit(p.id));
          right.appendChild(edit);
          const del = document.createElement('button'); del.className='btn small ghost'; del.textContent='Excluir';
          del.addEventListener('click', async ()=> { await deletePlan(p.id); await load(); });
          right.appendChild(del);
        } else {
          // comum: sem botões (apenas visual)
          const dash = document.createElement('span'); dash.className='muted'; dash.textContent='';
          right.appendChild(dash);
        }
        row.appendChild(right);
        list.appendChild(row);
      });
      feedback.textContent = `${items.length} planos`;
    } catch (err) {
      feedback.textContent = 'Erro: ' + err.message;
    }
  }

  async function openEdit(id){
    if (role !== 'master') return; // segurança extra
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
