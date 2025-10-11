/* servidores.js - simples */
const DBs = window.DB;

function initServidoresView(){
  renderServers();
  bindServersUI();
}

function renderServers(){
  const cont = document.getElementById('serversList'); if (!cont) return;
  cont.innerHTML = '';
  DBs.servidores.forEach(s=>{
    const row = document.createElement('div'); row.className='item-row';
    row.innerHTML = `<div><strong>${s.nome}</strong><div class="muted">URL1:${s.url1||'—'} • URL2:${s.url2||'—'}</div></div>
      <div><button class="small-btn edit-server">✏️</button></div>`;
    row.querySelector('.edit-server')?.addEventListener('click', ()=> openEditServer(s));
    cont.appendChild(row);
  });
}

function bindServersUI(){
  document.getElementById('btnNewServer')?.addEventListener('click', ()=> {
    const form = document.createElement('form'); form.className='form';
    form.innerHTML = `
      <h3>Novo Servidor</h3>
      <label class="field"><span>Nome</span><input name="nome" required></label>
      <div class="two-col">
        <label class="field"><span>URL1</span><input name="url1"></label>
        <label class="field"><span>URL2</span><input name="url2"></label>
      </div>
      <div class="two-col">
        <label class="field"><span>App1</span><input name="app1"></label>
        <label class="field"><span>App2</span><input name="app2"></label>
      </div>
      <div class="form-actions"><button type="button" id="cancelServer" class="secondary">Cancelar</button><button type="submit" class="primary">Salvar</button></div>
    `;
    form.querySelector('#cancelServer').addEventListener('click', ()=> window.app.closeModal());
    form.addEventListener('submit', (e)=> {
      e.preventDefault();
      const f = form.elements;
      DBs.servidores.push({ id:'s'+Math.random().toString(36).slice(2,8), nome:f.namedItem('nome').value, url1:f.namedItem('url1').value||'', url2:f.namedItem('url2').value||'', app1:f.namedItem('app1').value||'', app2:f.namedItem('app2').value||'' });
      window.app.saveState();
      window.app.closeModal();
      renderServers();
    });
    window.app.openModal(form);
  });
}

function openEditServer(s){
  const form = document.createElement('form'); form.className='form';
  form.innerHTML = `
    <h3>Editar Servidor</h3>
    <label class="field"><span>Nome</span><input name="nome" required value="${s.nome}"></label>
    <div class="two-col">
      <label class="field"><span>URL1</span><input name="url1" value="${s.url1||''}"></label>
      <label class="field"><span>URL2</span><input name="url2" value="${s.url2||''}"></label>
    </div>
    <div class="two-col">
      <label class="field"><span>App1</span><input name="app1" value="${s.app1||''}"></label>
      <label class="field"><span>App2</span><input name="app2" value="${s.app2||''}"></label>
    </div>
    <div class="form-actions"><button type="button" id="cancelServer" class="secondary">Cancelar</button><button type="submit" class="primary">Salvar</button></div>
  `;
  form.querySelector('#cancelServer').addEventListener('click', ()=> window.app.closeModal());
  form.addEventListener('submit', (e)=> {
    e.preventDefault();
    const f = form.elements;
    s.nome = f.namedItem('nome').value;
    s.url1 = f.namedItem('url1').value||'';
    s.url2 = f.namedItem('url2').value||'';
    s.app1 = f.namedItem('app1').value||'';
    s.app2 = f.namedItem('app2').value||'';
    window.app.saveState();
    window.app.closeModal();
    renderServers();
  });
  window.app.openModal(form);
}

/* start */
initServidoresView();
