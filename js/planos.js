/* js/planos.js */
function initPlanos(){
  const DB = window.DB;
  const cont = document.getElementById('plansList');
  function render(){
    if (!cont) return;
    cont.innerHTML = '';
    DB.planos.forEach(p=>{
      const row = document.createElement('div'); row.className='item-row';
      row.innerHTML = `<div><strong>${p.nome}</strong><div class="muted">Pontos:${p.pontos} • R$ ${p.valor.toFixed(2)} • ${p.validade}m</div></div><div><button class="small-btn edit-plan">✏️</button></div>`;
      row.querySelector('.edit-plan')?.addEventListener('click', ()=> openEdit(p));
      cont.appendChild(row);
    });
  }
  function openEdit(p){
    const form = document.createElement('form'); form.className='form';
    form.innerHTML = `<h3>Editar Plano</h3>
      <label class="field"><span>Nome</span><input name="nome" required value="${p.nome}"></label>
      <div class="two-col"><label class="field"><span>Pontos</span><input name="pontos" type="number" value="${p.pontos}"></label><label class="field"><span>Valor</span><input name="valor" type="number" step="0.01" value="${p.valor}"></label></div>
      <div class="form-actions"><button type="button" id="cancelPlan" class="secondary">Cancelar</button><button type="submit" class="primary">Salvar</button></div>`;
    form.querySelector('#cancelPlan')?.addEventListener('click', ()=> window.app.closeModal());
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const f = form.elements;
      p.nome = f.namedItem('nome').value; p.pontos = parseInt(f.namedItem('pontos').value||0); p.valor = parseFloat(f.namedItem('valor').value||0);
      window.app.saveState();
      window.app.closeModal();
      render();
    });
    window.app.openModal(form);
  }

  document.getElementById('btnNewPlan')?.removeEventListener?.('click', ()=>{});
  document.getElementById('btnNewPlan')?.addEventListener('click', ()=>{
    const form = document.createElement('form'); form.className='form';
    form.innerHTML = `<h3>Novo Plano</h3>
      <label class="field"><span>Nome</span><input name="nome" required></label>
      <div class="two-col"><label class="field"><span>Pontos</span><input name="pontos" type="number"></label><label class="field"><span>Valor</span><input name="valor" type="number" step="0.01"></label></div>
      <div class="form-actions"><button type="button" id="cancelPlan" class="secondary">Cancelar</button><button type="submit" class="primary">Salvar</button></div>`;
    form.querySelector('#cancelPlan')?.addEventListener('click', ()=> window.app.closeModal());
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const f = form.elements;
      DB.planos.push({ id:'p'+Math.random().toString(36).slice(2,8), nome: f.namedItem('nome').value, pontos: parseInt(f.namedItem('pontos').value||0), valor: parseFloat(f.namedItem('valor').value||0), validade:1 });
      window.app.saveState();
      window.app.closeModal();
      render();
    });
    window.app.openModal(form);
  });

  render();
}

window.initPlanos = initPlanos;
if (document.readyState !== 'loading' && document.getElementById('plansList')) initPlanos();
