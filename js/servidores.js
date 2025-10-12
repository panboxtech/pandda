/* js/servidores.js */
function initServidores(){
  const DB = window.DB;
  const cont = document.getElementById('serversList');

  function render(){
    if (!cont) return;
    cont.innerHTML = '';
    DB.servidores.forEach(s=>{
      const row = document.createElement('div'); row.className='item-row';
      row.innerHTML = `<div><strong>${s.nome}</strong><div class="muted">URL1:${s.url1||'—'}</div></div><div><button class="small-btn edit-server">✏️</button></div>`;
      row.querySelector('.edit-server')?.addEventListener('click', ()=> openEdit(s));
      cont.appendChild(row);
    });
  }

  function openEdit(s){
    const form = document.createElement('form'); form.className='form';
    form.innerHTML = `<h3>Editar Servidor</h3>
      <label class="field"><span>Nome</span><input name="nome" required value="${s.nome}"></label>
      <div class="two-col"><label class="field"><span>URL1</span><input name="url1" value="${s.url1||''}"></label><label class="field"><span>URL2</span><input name="url2" value="${s.url2||''}"></label></div>
      <div class="form-actions"><button type="button" id="cancelServer" class="secondary">Cancelar</button><button type="submit" class="primary">Salvar</button></div>`;
    form.querySelector('#cancelServer')?.addEventListener('click', ()=> window.app.closeModal());
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const f = form.elements;
      s.nome = f.namedItem('nome').value; s.url1 = f.namedItem('url1').value||''; s.url2 = f.namedItem('url2').value||'';
      window.app.saveState();
      window.app.closeModal();
      render();
    });
    window.app.openModal(form);
  }

  document.getElementById('btnNewServer')?.removeEventListener?.('click', ()=>{});
  document.getElementById('btnNewServer')?.addEventListener('click', ()=>{
    const form = document.createElement('form'); form.className='form';
    form.innerHTML = `<h3>Novo Servidor</h3>
      <label class="field"><span>Nome</span><input name="nome" required></label>
      <div class="two-col"><label class="field"><span>URL1</span><input name="url1"></label><label class="field"><span>URL2</span><input name="url2"></label></div>
      <div class="form-actions"><button type="button" id="cancelServer" class="secondary">Cancelar</button><button type="submit" class="primary">Salvar</button></div>`;
    form.querySelector('#cancelServer')?.addEventListener('click', ()=> window.app.closeModal());
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const f = form.elements;
      DB.servidores.push({ id:'s'+Math.random().toString(36).slice(2,8), nome:f.namedItem('nome').value, url1:f.namedItem('url1').value||'', url2:f.namedItem('url2').value||''});
      window.app.saveState();
      window.app.closeModal();
      render();
    });
    window.app.openModal(form);
  });

  render();
}

window.initServidores = initServidores;
if (document.readyState !== 'loading' && document.getElementById('serversList')) initServidores();
