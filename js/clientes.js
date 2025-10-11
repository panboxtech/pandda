/* clientes.js - view logic simples */
const DB = window.DB;

function initClientesView(){
  renderSummaryCards();
  renderClientsList();
  bindClientesUI();
}

function computeBuckets(){
  const today = new Date();
  const days = d => Math.floor((new Date(d) - today)/(1000*60*60*24));
  const all = DB.clientes || [];
  return {
    total: all.length,
    ativos: all.filter(c=> new Date(c.dataVencimento) >= new Date()).length,
    vencendo: all.filter(c=> { const k = days(c.dataVencimento); return k>=0 && k<=7 }).length,
    vencidosMenos30: all.filter(c=> { const k = days(c.dataVencimento); return k<0 && k>=-30 }).length,
    vencidosMais30: all.filter(c=> { const k = days(c.dataVencimento); return k < -30 }).length
  };
}

function renderSummaryCards(){
  const cont = document.getElementById('summaryCards'); if (!cont) return;
  const b = computeBuckets();
  cont.innerHTML = '';
  const items = [
    {id:'ativos', title:'Clientes ativos', v:b.ativos},
    {id:'vencendo', title:'Vencendo (7d)', v:b.vencendo},
    {id:'vmenor', title:'Vencidos < 30d', v:b.vencidosMenos30},
    {id:'vmaior', title:'Vencidos > 30d', v:b.vencidosMais30},
    {id:'total', title:'Total', v:b.total}
  ];
  items.forEach(it=>{
    const d = document.createElement('div'); d.className='card'; d.innerHTML = `<h3>${it.title}</h3><p>${it.v}</p>`;
    d.addEventListener('click', ()=> {
      // filter by card
      document.getElementById('searchInput').value = '';
      renderClientsList(it.id);
    });
    cont.appendChild(d);
  });
}

function renderClientsList(filterCard){
  const list = document.getElementById('clientsList'); if (!list) return;
  list.innerHTML = '';
  let out = DB.clientes.slice();
  const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const onlyNotified = document.getElementById('onlyNotifiedToggle')?.checked;
  if (q) out = out.filter(c => (c.nome||'').toLowerCase().includes(q) || (c.usuario1||'').toLowerCase().includes(q) || (c.whatsapp||'').toLowerCase().includes(q));
  if (onlyNotified) out = out.filter(c => c.statusNotificacao === false);
  if (filterCard){
    const today = new Date();
    const diffDays = d => Math.floor((new Date(d) - today)/(1000*60*60*24));
    out = out.filter(c=>{
      const dd = diffDays(c.dataVencimento);
      if (filterCard === 'ativos') return dd >= 0;
      if (filterCard === 'vencendo') return dd >=0 && dd <=7;
      if (filterCard === 'vmenor') return dd < 0 && dd >= -30;
      if (filterCard === 'vmaior') return dd < -30;
      return true;
    });
  }
  out.sort((a,b)=> new Date(a.dataVencimento) - new Date(b.dataVencimento));
  out.forEach(c => list.appendChild(makeClientRow(c)));
}

function makeClientRow(c){
  const row = document.createElement('div'); row.className='client-row';
  row.innerHTML = `
    <div class="client-summary">
      <div>
        <div style="font-weight:700">${c.nome}</div>
        <div class="muted">${c.whatsapp} <button class="small-btn copy-btn">📋</button></div>
      </div>
      <div style="text-align:right">
        <div class="muted">Vence: ${c.dataVencimento}</div>
        <div style="margin-top:6px">
          <button class="small-btn notify-btn">💬</button>
          <button class="small-btn renew-btn">🔁</button>
          <button class="small-btn edit-btn">✏️</button>
        </div>
      </div>
    </div>
    <button class="expand-toggle">Mostrar mais informações ▼</button>
    <div class="client-details">
      <div><strong>Plano:</strong> ${ (DB.planos.find(p=>p.id===c.planoId)||{}).nome || '—' }</div>
      <div><strong>Servidor 1:</strong> ${(DB.servidores.find(s=>s.id===c.servidor1)||{}).nome || '—'}</div>
      <div><strong>Observações:</strong> ${c.observacoes || '—'}</div>
      <div style="margin-top:8px"><button class="secondary block-client">Bloquear cliente</button></div>
    </div>
  `;
  // events
  row.querySelector('.expand-toggle').addEventListener('click', (ev)=>{
    row.classList.toggle('expanded');
    ev.target.textContent = row.classList.contains('expanded') ? 'Mostrar menos ▲' : 'Mostrar mais informações ▼';
  });
  row.querySelector('.copy-btn')?.addEventListener('click', ()=> navigator.clipboard?.writeText(c.whatsapp||''));
  row.querySelector('.notify-btn')?.addEventListener('click', ()=> { c.statusNotificacao = true; window.app.saveState(); renderClientsList(); alert('Notificação simulada'); });
  row.querySelector('.renew-btn')?.addEventListener('click', ()=> openRenew(c));
  row.querySelector('.edit-btn')?.addEventListener('click', ()=> openEditClient(c));
  row.querySelector('.block-client')?.addEventListener('click', ()=> { if(!confirm('Bloquear cliente?')) return; c.bloqueado = true; window.app.saveState(); renderClientsList(); });
  return row;
}

function openRenew(client){
  const form = document.createElement('form');
  form.className = 'form';
  form.innerHTML = `
    <h3>Renovar ${client.nome}</h3>
    <label class="field"><span>Plano</span><select name="planoId"></select></label>
    <label class="field"><span>Nova data de vencimento</span><input name="dataVencimento" type="date" value="${client.dataVencimento}"></label>
    <div class="form-actions"><button type="button" id="cancelRenew" class="secondary">Cancelar</button><button type="submit" class="primary">Renovar</button></div>
  `;
  const sel = form.querySelector('select[name=planoId]');
  DB.planos.forEach(p=> { const o = document.createElement('option'); o.value = p.id; o.textContent = p.nome + ' ('+p.validade+'m)'; if (p.id===client.planoId) o.selected = true; sel.appendChild(o); });
  form.querySelector('#cancelRenew').addEventListener('click', ()=> window.app.closeModal());
  form.addEventListener('submit', (e)=> {
    e.preventDefault();
    const f = form.elements;
    client.planoId = f.namedItem('planoId').value;
    client.dataVencimento = f.namedItem('dataVencimento').value;
    client.numeroRenovacoes = (client.numeroRenovacoes||0) + 1;
    window.app.saveState();
    window.app.closeModal();
    renderClientsList();
  });
  window.app.openModal(form);
}

function openEditClient(client){
  const fragForm = buildClientFormTemplate(client);
  window.app.openModal(fragForm);
}

function buildClientFormTemplate(client){
  const form = document.createElement('form');
  form.className = 'form';
  form.innerHTML = `
    <h3>${client ? 'Editar' : 'Novo'} Cliente</h3>
    <div class="two-col">
      <label class="field"><span>Nome</span><input name="nome" required></label>
      <label class="field"><span>WhatsApp</span><input name="whatsapp"></label>
    </div>
    <div class="two-col">
      <label class="field"><span>Data de vencimento</span><input name="dataVencimento" type="date"></label>
      <label class="field"><span>Plano</span><select name="planoId"></select></label>
    </div>
    <label class="field"><span>Observações</span><textarea name="observacoes"></textarea></label>
    <div class="form-actions"><button type="button" id="cancelClient" class="secondary">Cancelar</button><button type="submit" class="primary">Salvar</button></div>
  `;
  const sel = form.querySelector('select[name=planoId]');
  DB.planos.forEach(p=> { const o=document.createElement('option'); o.value=p.id; o.textContent=p.nome; sel.appendChild(o); });
  if (client){
    const f = form.elements;
    f.namedItem('nome').value = client.nome || '';
    f.namedItem('whatsapp').value = client.whatsapp || '';
    f.namedItem('dataVencimento').value = client.dataVencimento || '';
    f.namedItem('planoId').value = client.planoId || '';
    f.namedItem('observacoes').value = client.observacoes || '';
  }
  form.querySelector('#cancelClient').addEventListener('click', ()=> window.app.closeModal());
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const f = form.elements;
    if (client){
      client.nome = f.namedItem('nome').value;
      client.whatsapp = f.namedItem('whatsapp').value;
      client.dataVencimento = f.namedItem('dataVencimento').value;
      client.planoId = f.namedItem('planoId').value;
      client.observacoes = f.namedItem('observacoes').value;
    } else {
      const nc = {
        id:'c'+Math.random().toString(36).slice(2,8),
        nome: f.namedItem('nome').value,
        whatsapp: f.namedItem('whatsapp').value,
        dataCriacao: (new Date()).toISOString().slice(0,10),
        dataVencimento: f.namedItem('dataVencimento').value || (new Date()).toISOString().slice(0,10),
        planoId: f.namedItem('planoId').value || '',
        observacoes: f.namedItem('observacoes').value || '',
        statusNotificacao:false, numeroRenovacoes:0, bloqueado:false
      };
      DB.clientes.push(nc);
    }
    window.app.saveState();
    window.app.closeModal();
    renderClientsList();
    renderSummaryCards();
  });
  return form;
}

/* binds */
function bindClientesUI(){
  document.getElementById('searchInput')?.addEventListener('input', ()=> renderClientsList());
  document.getElementById('onlyNotifiedToggle')?.addEventListener('change', ()=> renderClientsList());
  document.getElementById('btnNewClient')?.addEventListener('click', ()=> {
    const f = buildClientFormTemplate(null);
    window.app.openModal(f);
  });
}

/* start view init when script runs */
initClientesView();
