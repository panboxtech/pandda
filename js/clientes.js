/* js/clientes.js
   - initClientes(): renderiza clientes, summary, binds
   - Notificar via WhatsApp: abre wa.me com mensagem formatada
   - Ao notificar: seta statusNotificacao = true e salva (window.app.saveState)
*/

function initClientes(){
  const DB = window.DB;
  const cont = document.getElementById('clientsList');
  const summary = document.getElementById('summaryCards');

  function fmtDate(d){ if(!d) return ''; try{ return new Date(d).toISOString().slice(0,10); }catch(e){return d;} }

  function computeBuckets(){
    const today = new Date();
    const days = d => Math.floor((new Date(d) - today)/(1000*60*60*24));
    const all = DB.clientes || [];
    return {
      total: all.length,
      ativos: all.filter(c=> new Date(c.dataVencimento) >= new Date()).length,
      vencendo: all.filter(c => { const k = days(c.dataVencimento); return k>=0 && k<=7; }).length,
      vencidosMenos30: all.filter(c => { const k = days(c.dataVencimento); return k<0 && k>=-30; }).length,
      vencidosMais30: all.filter(c => { const k = days(c.dataVencimento); return k < -30; }).length
    };
  }

  function renderSummary(){
    if (!summary) return;
    summary.innerHTML = '';
    const b = computeBuckets();
    const items = [
      {id:'ativos', title:'Clientes ativos', v:b.ativos},
      {id:'vencendo', title:'Vencendo (7d)', v:b.vencendo},
      {id:'vmenor', title:'Vencidos <30d', v:b.vencidosMenos30},
      {id:'vmaior', title:'Vencidos >30d', v:b.vencidosMais30},
      {id:'total', title:'Total', v:b.total}
    ];
    items.forEach(it=>{
      const el = document.createElement('div'); el.className='card'; el.innerHTML = `<h3>${it.title}</h3><p>${it.v}</p>`;
      el.addEventListener('click', ()=> renderClients(it.id));
      summary.appendChild(el);
    });
  }

  function planPaymentInfo(plan){
    if (!plan) return '';
    const parts = [];
    if (plan.valor !== undefined) parts.push(`Valor: R$ ${Number(plan.valor).toFixed(2)}`);
    if (plan.chavePIX) parts.push(`PIX: ${plan.chavePIX}`);
    if (plan.linkCartao) parts.push(`Cartão: ${plan.linkCartao}`);
    return parts.join(' | ');
  }

  function whatsappMessageFor(client){
    const plan = DB.planos.find(p => p.id === client.planoId);
    const planName = plan ? plan.nome : '—';
    const venc = fmtDate(client.dataVencimento);
    const paymentInfo = plan ? planPaymentInfo(plan) : '';
    // montar mensagem legível
    const lines = [
      `Olá ${client.nome},`,
      `Seu plano: ${planName}.`,
      `Vencimento: ${venc}.`,
    ];
    if (paymentInfo) lines.push(`Formas de pagamento: ${paymentInfo}.`);
    lines.push('', 'Por favor, regularize ou entre em contato. Obrigado.');
    return encodeURIComponent(lines.join('\n'));
  }

  function whatsappHref(client){
    // usar wa.me com número no formato internacional sem símbolos
    const raw = client.whatsapp || '';
    const num = raw.replace(/\D/g,''); // apenas dígitos
    const msg = whatsappMessageFor(client);
    if (!num) {
      // fallback: abrir apenas whatsapp web sem número (não funcionará para enviar), retornar empty string
      return '';
    }
    return `https://wa.me/${num}?text=${msg}`;
  }

  function makeRow(c){
    const row = document.createElement('div'); row.className = 'client-row';
    row.innerHTML = `
      <div class="client-summary">
        <div>
          <div style="font-weight:700">${c.nome}</div>
          <div class="muted">${c.whatsapp} <button class="small-btn copy-btn">📋</button></div>
        </div>
        <div style="text-align:right">
          <div class="muted">Vence: ${fmtDate(c.dataVencimento)}</div>
          <div style="margin-top:6px">
            <button class="small-btn notify-btn"></button>
            <button class="small-btn renew-btn">🔁</button>
            <button class="small-btn edit-btn">✏️</button>
          </div>
        </div>
      </div>
      <button class="expand-toggle">Mostrar mais informações ▼</button>
      <div class="client-details">
        <div><strong>Plano:</strong> ${(DB.planos.find(p=>p.id===c.planoId)||{}).nome || '—'}</div>
        <div><strong>Servidor 1:</strong> ${(DB.servidores.find(s=>s.id===c.servidor1)||{}).nome || '—'}</div>
        <div style="margin-top:8px"><button class="secondary block-client">Bloquear cliente</button></div>
      </div>
    `;

    // label do botão de notificar conforme statusNotificacao
    const notifyBtn = row.querySelector('.notify-btn');
    function updateNotifyBtnLabel(){
      if (c.statusNotificacao === true || c.statusNotificacao === 1) {
        notifyBtn.textContent = '🔁 Re-notificar';
      } else {
        notifyBtn.textContent = '💬 Notificar';
      }
    }
    updateNotifyBtnLabel();

    // bind handlers
    row.querySelector('.expand-toggle')?.addEventListener('click', (e)=>{
      row.classList.toggle('expanded');
      e.target.textContent = row.classList.contains('expanded') ? 'Mostrar menos ▲' : 'Mostrar mais informações ▼';
    });
    row.querySelector('.copy-btn')?.addEventListener('click', ()=> navigator.clipboard?.writeText(c.whatsapp||''));
    row.querySelector('.renew-btn')?.addEventListener('click', ()=> openRenew(c));
    row.querySelector('.edit-btn')?.addEventListener('click', ()=> openEdit(c));
    row.querySelector('.block-client')?.addEventListener('click', ()=> { if(!confirm('Bloquear cliente?')) return; c.bloqueado = true; window.app.saveState(); renderClients(); });

    // Notificar: abrir WhatsApp e setar statusNotificacao = true
    notifyBtn.addEventListener('click', (e)=>{
      const href = whatsappHref(c);
      // setar status antes de abrir para garantir persistência
      c.statusNotificacao = true;
      window.app.saveState();
      updateNotifyBtnLabel();
      // abrir WhatsApp em nova aba/janela
      if (href) {
        const win = window.open(href, '_blank');
        if (!win) {
          // popup bloqueado, fallback: alterar location (não recomendado)
          window.location.href = href;
        }
      } else {
        alert('Número de WhatsApp inválido para este cliente.');
      }
    });

    return row;
  }

  function renderClients(filterCard){
    if (!cont) return;
    cont.innerHTML = '';
    let out = (DB.clientes || []).slice();
    const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const onlyNot = document.getElementById('onlyNotifiedToggle')?.checked;
    if (q) out = out.filter(c => (c.nome||'').toLowerCase().includes(q) || (c.usuario1||'').toLowerCase().includes(q) || (c.whatsapp||'').toLowerCase().includes(q));
    if (onlyNot) out = out.filter(c => c.statusNotificacao === false || c.statusNotificacao === 0 || c.statusNotificacao === undefined);
    if (filterCard){
      const today = new Date();
      const diff = d => Math.floor((new Date(d) - today)/(1000*60*60*24));
      out = out.filter(c=>{
        const dd = diff(c.dataVencimento);
        if (filterCard === 'ativos') return dd >=0;
        if (filterCard === 'vencendo') return dd >=0 && dd <=7;
        if (filterCard === 'vmenor') return dd <0 && dd >= -30;
        if (filterCard === 'vmaior') return dd < -30;
        return true;
      });
    }
    out.sort((a,b)=> new Date(a.dataVencimento) - new Date(b.dataVencimento));
    out.forEach(c => cont.appendChild(makeRow(c)));
  }

  function openRenew(client){
    const form = document.createElement('form'); form.className='form';
    form.innerHTML = `<h3>Renovar ${client.nome}</h3>
      <label class="field"><span>Plano</span><select name="planoId"></select></label>
      <label class="field"><span>Nova data de vencimento</span><input name="dataVencimento" type="date" value="${client.dataVencimento}"></label>
      <div class="form-actions"><button type="button" id="cancelRenew" class="secondary">Cancelar</button><button type="submit" class="primary">Renovar</button></div>`;
    const sel = form.querySelector('select[name=planoId]');
    DB.planos.forEach(p=> { const o=document.createElement('option'); o.value=p.id; o.textContent=p.nome + ' ('+p.validade+'m)'; if (p.id===client.planoId) o.selected=true; sel.appendChild(o); });
    form.querySelector('#cancelRenew')?.addEventListener('click', ()=> window.app.closeModal());
    form.addEventListener('submit', (e)=> {
      e.preventDefault();
      const f = form.elements;
      client.planoId = f.namedItem('planoId').value;
      client.dataVencimento = f.namedItem('dataVencimento').value;
      client.numeroRenovacoes = (client.numeroRenovacoes||0) + 1;
      window.app.saveState();
      window.app.closeModal();
      renderClients();
      renderSummary();
    });
    window.app.openModal(form);
  }

  function openEdit(client){
    const form = document.createElement('form'); form.className='form';
    form.innerHTML = `<h3>Editar Cliente</h3>
      <div class="two-col"><label class="field"><span>Nome</span><input name="nome" required></label><label class="field"><span>WhatsApp</span><input name="whatsapp"></label></div>
      <div class="form-actions"><button type="button" id="cancelClient" class="secondary">Cancelar</button><button type="submit" class="primary">Salvar</button></div>`;
    const f = form.elements;
    f.namedItem('nome').value = client.nome || '';
    f.namedItem('whatsapp').value = client.whatsapp || '';
    form.querySelector('#cancelClient')?.addEventListener('click', ()=> window.app.closeModal());
    form.addEventListener('submit', (e)=> {
      e.preventDefault();
      client.nome = f.namedItem('nome').value;
      client.whatsapp = f.namedItem('whatsapp').value;
      window.app.saveState();
      window.app.closeModal();
      renderClients();
      renderSummary();
    });
    window.app.openModal(form);
  }

  // bind UI controls (search, toggle, new client)
  const searchEl = document.getElementById('searchInput');
  if (searchEl) {
    searchEl.removeEventListener?.('input', renderClients);
    searchEl.addEventListener('input', ()=> renderClients());
  }
  const onlyToggle = document.getElementById('onlyNotifiedToggle');
  if (onlyToggle) {
    onlyToggle.removeEventListener?.('change', renderClients);
    onlyToggle.addEventListener('change', ()=> renderClients());
  }
  const btnNew = document.getElementById('btnNewClient');
  if (btnNew) {
    btnNew.removeEventListener?.('click', ()=>{});
    btnNew.addEventListener('click', ()=> {
      const form = document.createElement('form'); form.className='form';
      form.innerHTML = `<h3>Novo Cliente</h3>
        <div class="two-col"><label class="field"><span>Nome</span><input name="nome" required></label><label class="field"><span>WhatsApp</span><input name="whatsapp"></label></div>
        <div class="form-actions"><button type="button" id="cancelNew" class="secondary">Cancelar</button><button type="submit" class="primary">Salvar</button></div>`;
      form.querySelector('#cancelNew')?.addEventListener('click', ()=> window.app.closeModal());
      form.addEventListener('submit', (e)=> {
        e.preventDefault();
        const f = form.elements;
        const nc = { id:'c'+Math.random().toString(36).slice(2,8), nome: f.namedItem('nome').value, whatsapp: f.namedItem('whatsapp').value, dataCriacao: (new Date()).toISOString().slice(0,10), dataVencimento: (new Date()).toISOString().slice(0,10), planoId:'', observacoes:'', statusNotificacao:false, numeroRenovacoes:0, bloqueado:false };
        DB.clientes.push(nc);
        window.app.saveState();
        window.app.closeModal();
        renderClients();
        renderSummary();
      });
      window.app.openModal(form);
    });
  }

  // initial render
  renderSummary();
  renderClients();
}

// export standardized name
window.initClientes = initClientes;
if (document.readyState !== 'loading' && document.getElementById('clientsList')) initClientes();
