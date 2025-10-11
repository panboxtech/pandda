/* planos.js - simples */
const DBp = window.DB;

function initPlanosView(){
  renderPlans();
  bindPlanosUI();
}

function renderPlans(){
  const cont = document.getElementById('plansList'); if (!cont) return;
  cont.innerHTML = '';
  DBp.planos.forEach(p=>{
    const row = document.createElement('div'); row.className='item-row';
    row.innerHTML = `<div><strong>${p.nome}</strong><div class="muted">Pontos:${p.pontos} • R$ ${p.valor.toFixed(2)} • ${p.validade}m</div></div>
      <div><button class="small-btn edit-plan">✏️</button></div>`;
    row.querySelector('.edit-plan')?.addEventListener('click', ()=> openEditPlan(p));
    cont.appendChild(row);
  });
}

function bindPlanosUI(){
  document.getElementById('btnNewPlan')?.addEventListener('click', ()=> {
    const form = document.createElement('form'); form.className='form';
    form.innerHTML = `
      <h3>Novo Plano</h3>
      <label class="field"><span>Nome</span><input name="nome" required></label>
      <div class="two-col">
        <label class="field"><span>Pontos</span><input name="pontos" type="number"></label>
        <label class="field"><span>Valor</span><input name="valor" type="number" step="0.01"></label>
      </div>
      <div class="two-col">
        <label class="field"><span>Validade (meses)</span><input name="validade" type="number" min="1" value="1"></label>
        <label class="field"><span>Link Cartão</span><input name="linkCartao"></label>
      </div>
      <div class="form-actions"><button type="button" id="cancelPlan" class="secondary">Cancelar</button><button type="submit" class="primary">Salvar</button></div>
    `;
    form.querySelector('#cancelPlan').addEventListener('click', ()=> window.app.closeModal());
    form.addEventListener('submit', (e)=> {
      e.preventDefault();
      const f = form.elements;
      DBp.planos.push({ id:'p'+Math.random().toString(36).slice(2,8), nome:f.namedItem('nome').value, pontos:parseInt(f.namedItem('pontos').value||0), valor:parseFloat(f.namedItem('valor').value||0), validade:parseInt(f.namedItem('validade').value||1), linkCartao:f.namedItem('linkCartao').value||'' });
      window.app.saveState();
      window.app.closeModal();
      renderPlans();
    });
    window.app.openModal(form);
  });
}

function openEditPlan(p){
  const form = document.createElement('form'); form.className='form';
  form.innerHTML = `
    <h3>Editar Plano</h3>
    <label class="field"><span>Nome</span><input name="nome" required value="${p.nome}"></label>
    <div class="two-col">
      <label class="field"><span>Pontos</span><input name="pontos" type="number" value="${p.pontos}"></label>
      <label class="field"><span>Valor</span><input name="valor" type="number" step="0.01" value="${p.valor}"></label>
    </div>
    <div class="two-col">
      <label class="field"><span>Validade</span><input name="validade" type="number" value="${p.validade}"></label>
      <label class="field"><span>Link Cartão</span><input name="linkCartao" value="${p.linkCartao||''}"></label>
    </div>
    <div class="form-actions"><button type="button" id="cancelPlan" class="secondary">Cancelar</button><button type="submit" class="primary">Salvar</button></div>
  `;
  form.querySelector('#cancelPlan').addEventListener('click', ()=> window.app.closeModal());
  form.addEventListener('submit', (e)=> {
    e.preventDefault();
    const f = form.elements;
    p.nome = f.namedItem('nome').value;
    p.pontos = parseInt(f.namedItem('pontos').value||0);
    p.valor = parseFloat(f.namedItem('valor').value||0);
    p.validade = parseInt(f.namedItem('validade').value||1);
    p.linkCartao = f.namedItem('linkCartao').value||'';
    window.app.saveState();
    window.app.closeModal();
    renderPlans();
  });
  window.app.openModal(form);
}

/* start */
initPlanosView();
