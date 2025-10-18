// js/views/plans.js
// Planos com campos: nome, telas, validadeEmMeses, preco
import { getPlans, createPlan, updatePlan, deletePlan } from '../mockData.js';
import { openFormModal } from '../modal.js';

function el(tag, text, className) { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (className) e.className = className; return e; }

export async function mountPlansView(root) {
  const container = document.createElement('section'); container.className='view view-plans';
  const header = document.createElement('div'); header.className='view-header'; header.appendChild(Object.assign(document.createElement('h2'),{textContent:'Planos'}));
  const actions = document.createElement('div'); actions.className='view-actions';
  const btnAdd = document.createElement('button'); btnAdd.className='btn'; btnAdd.textContent='Novo plano'; actions.appendChild(btnAdd);
  header.appendChild(actions); container.appendChild(header);

  const list = document.createElement('div'); list.className='list'; const feedback = document.createElement('div'); feedback.className='feedback';
  container.appendChild(list); container.appendChild(feedback);

  async function load() {
    feedback.textContent = 'Carregando...';
    try {
      const plans = await getPlans();
      list.innerHTML = '';
      plans.forEach(p=>{
        const row = document.createElement('div'); row.className='list-row';
        row.appendChild(Object.assign(document.createElement('div'),{textContent:p.nome + ` — ${p.telas} telas — ${p.validadeEmMeses} meses — R$${p.preco}`, className:'list-title'}));
        const right = document.createElement('div');
        const edit = document.createElement('button'); edit.className='btn small'; edit.textContent='Editar'; edit.addEventListener('click', ()=> openEdit(p.id));
        right.appendChild(edit);
        const del = document.createElement('button'); del.className='btn small ghost'; del.textContent='Excluir'; del.addEventListener('click', async ()=> { if(confirm('Excluir plano?')) { await deletePlan(p.id); await load(); }});
        right.appendChild(del);
        row.appendChild(right);
        list.appendChild(row);
      });
      feedback.textContent = `${plans.length} planos`;
    } catch (err) {
      feedback.textContent = 'Erro: ' + err.message;
    }
  }

  btnAdd.addEventListener('click', ()=> {
    openFormModal({
      title: 'Novo plano',
      renderForm: (container, ctx) => {
        const nameLabel = el('label','Nome'); const nameInput = document.createElement('input'); nameInput.type='text';
        const telasLabel = el('label','Telas'); const telasInput = document.createElement('input'); telasInput.type='number';
        const valLabel = el('label','Validade em meses'); const valInput = document.createElement('input'); valInput.type='number';
        const precoLabel = el('label','Preço'); const precoInput = document.createElement('input'); precoInput.type='number'; precoInput.step='0.01';

        container.appendChild(nameLabel); container.appendChild(nameInput);
        container.appendChild(telasLabel); container.appendChild(telasInput);
        container.appendChild(valLabel); container.appendChild(valInput);
        container.appendChild(precoLabel); container.appendChild(precoInput);

        const save = document.createElement('button'); save.className='btn'; save.type='button'; save.textContent='Salvar';
        save.addEventListener('click', ()=> {
          if (!nameInput.value.trim()) return alert('Nome obrigatório');
          ctx.resolve({ nome: nameInput.value.trim(), telas: Number(telasInput.value||0), validadeEmMeses: Number(valInput.value||0), preco: Number(precoInput.value||0) });
        });
        const cancel = document.createElement('button'); cancel.className='btn ghost'; cancel.type='button'; cancel.textContent='Cancelar'; cancel.addEventListener('click', ()=> ctx.cancel());
        container.appendChild(save); container.appendChild(cancel);
      },
      onConfirm: async (data) => { await createPlan(data); await load(); }
    }).catch(()=>{});
  });

  async function openEdit(id) {
    const plans = await getPlans();
    const p = plans.find(x=>x.id===id);
    if (!p) return;
    openFormModal({
      title: 'Editar plano',
      renderForm: (container, ctx) => {
        const nameLabel = el('label','Nome'); const nameInput = document.createElement('input'); nameInput.type='text'; nameInput.value=p.nome;
        const telasLabel = el('label','Telas'); const telasInput = document.createElement('input'); telasInput.type='number'; telasInput.value=p.telas;
        const valLabel = el('label','Validade em meses'); const valInput = document.createElement('input'); valInput.type='number'; valInput.value=p.validadeEmMeses;
        const precoLabel = el('label','Preço'); const precoInput = document.createElement('input'); precoInput.type='number'; precoInput.step='0.01'; precoInput.value=p.preco;

        container.appendChild(nameLabel); container.appendChild(nameInput);
        container.appendChild(telasLabel); container.appendChild(telasInput);
        container.appendChild(valLabel); container.appendChild(valInput);
        container.appendChild(precoLabel); container.appendChild(precoInput);

        const save = document.createElement('button'); save.className='btn'; save.type='button'; save.textContent='Salvar';
        save.addEventListener('click', ()=> {
          if (!nameInput.value.trim()) return alert('Nome obrigatório');
          ctx.resolve({ nome: nameInput.value.trim(), telas: Number(telasInput.value||0), validadeEmMeses: Number(valInput.value||0), preco: Number(precoInput.value||0) });
        });
        const cancel = document.createElement('button'); cancel.className='btn ghost'; cancel.type='button'; cancel.textContent='Cancelar'; cancel.addEventListener('click', ()=> ctx.cancel());
        container.appendChild(save); container.appendChild(cancel);
      },
      onConfirm: async (data) => { await updatePlan(id, data); await load(); }
    }).catch(()=>{});
  }

  await load();
  root.appendChild(container);
}
