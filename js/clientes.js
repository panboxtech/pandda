/* js/clientes.js
   - initClientes(): renderiza clientes, summary, binds
   - Notificar via WhatsApp: abre wa.me com mensagem formatada
   - Ao notificar: seta statusNotificacao = true e salva (window.app.saveState)
   - Renovação: calcula nova data somando a validade (meses) do plano; plano atual selecionado por padrão;
     ao trocar plano, atualiza data em tempo real; mostra nome e usuario1 na modal.
   - Renovação: "Salvar" e "Salvar e Notificar" salvam de forma segura; envio só ocorre se o saveState for bem-sucedido.
   - Feedback não bloqueante (toast) e abertura do link em nova aba
*/

function initClientes(){
  const DB = window.DB;
  const cont = document.getElementById('clientsList');
  const summary = document.getElementById('summaryCards');

  /* -------------------------
     Helpers UI: toast (feedback não bloqueante)
     ------------------------- */
  function ensureToastContainer(){
    let c = document.getElementById('toastContainer');
    if (!c) {
      c = document.createElement('div');
      c.id = 'toastContainer';
      c.style.position = 'fixed';
      c.style.right = '16px';
      c.style.bottom = '16px';
      c.style.zIndex = '1000';
      c.style.display = 'flex';
      c.style.flexDirection = 'column';
      c.style.gap = '8px';
      document.body.appendChild(c);
    }
    return c;
  }
  function showToast(message, ms = 2000){
    const cont = ensureToastContainer();
    const t = document.createElement('div');
    t.textContent = message;
    t.style.background = '#222';
    t.style.color = '#fff';
    t.style.padding = '10px 14px';
    t.style.borderRadius = '8px';
    t.style.boxShadow = '0 6px 18px rgba(0,0,0,0.15)';
    t.style.fontSize = '14px';
    t.style.opacity = '0';
    t.style.transition = 'opacity .18s ease, transform .18s ease';
    t.style.transform = 'translateY(8px)';
    cont.appendChild(t);
    requestAnimationFrame(()=> {
      t.style.opacity = '1';
      t.style.transform = 'translateY(0)';
    });
    return new Promise(resolve => {
      setTimeout(()=> {
        t.style.opacity = '0';
        t.style.transform = 'translateY(8px)';
        setTimeout(()=> { t.remove(); resolve(); }, 180);
      }, ms);
    });
  }

  /* -------------------------
     Data/time helpers
     ------------------------- */
  function fmtDate(d){ if(!d) return ''; try{ return new Date(d).toISOString().slice(0,10); }catch(e){return d;} }

  function addMonthsToDate(dateStr, months){
    const d = dateStr ? new Date(dateStr) : new Date();
    const day = d.getDate();
    d.setMonth(d.getMonth() + Number(months));
    if (d.getDate() !== day) d.setDate(0);
    return d.toISOString().slice(0,10);
  }

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
    const raw = client.whatsapp || '';
    const num = raw.replace(/\D/g,'');
    const msg = whatsappMessageFor(client);
    if (!num) return '';
    return `https://wa.me/${num}?text=${msg}`;
  }

  /* -------------------------
     Rows / rendering
     ------------------------- */
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

    const notifyBtn = row.querySelector('.notify-btn');
    function updateNotifyBtnLabel(){
      if (c.statusNotificacao === true || c.statusNotificacao === 1) {
        notifyBtn.textContent = '🔁 Re-notificar';
      } else {
        notifyBtn.textContent = '💬 Notificar';
      }
    }
    updateNotifyBtnLabel();

    row.querySelector('.expand-toggle')?.addEventListener('click', (e)=>{
      row.classList.toggle('expanded');
      e.target.textContent = row.classList.contains('expanded') ? 'Mostrar menos ▲' : 'Mostrar mais informações ▼';
    });
    row.querySelector('.copy-btn')?.addEventListener('click', ()=> navigator.clipboard?.writeText(c.whatsapp||''));
    row.querySelector('.renew-btn')?.addEventListener('click', ()=> openRenew(c));
    row.querySelector('.edit-btn')?.addEventListener('click', ()=> openEdit(c));
    row.querySelector('.block-client')?.addEventListener('click', ()=> { if(!confirm('Bloquear cliente?')) return; c.bloqueado = true; window.app.saveState(); renderClients(); });

    notifyBtn.addEventListener('click', (e)=>{
      const href = whatsappHref(c);
      c.statusNotificacao = true;
      try {
        window.app.saveState();
      } catch(err) {
        console.error('Falha ao salvar statusNotificacao:', err);
        showToast('Falha ao salvar notificação. Operação cancelada.', 2200);
        return;
      }
      updateNotifyBtnLabel();
      if (href) {
        const w = window.open(href, '_blank', 'noopener,noreferrer');
        if (!w) {
          const a = document.createElement('a');
          a.href = href;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          a.remove();
        }
      } else {
        showToast('Número de WhatsApp inválido para este cliente.', 2500);
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

  /* -------------------------
     Renovação: "Salvar" e "Salvar e Notificar" (salvamento verificado antes de envio)
     ------------------------- */
  function openRenew(client){
    const form = document.createElement('form'); form.className='form';
    const currentPlan = DB.planos.find(p => p.id === client.planoId) || null;
    form.innerHTML = `
      <h3>Renovar ${client.nome} — ${client.usuario1 || ''}</h3>
      <label class="field"><span>Plano</span><select name="planoId"></select></label>
      <label class="field"><span>Nova data de vencimento</span><input name="dataVencimento" type="date"></label>
      <div class="form-actions">
        <button type="button" id="cancelRenew" class="secondary">Cancelar</button>
        <button type="submit" id="saveRenew" class="primary">Salvar</button>
        <button type="button" id="saveNotifyRenew" class="primary">Salvar e Notificar</button>
      </div>
    `;
    const sel = form.querySelector('select[name=planoId]');
    DB.planos.forEach(p=> {
      const o = document.createElement('option');
      o.value = p.id;
      o.textContent = `${p.nome} — ${p.validade} mês(es)`;
      if (currentPlan && p.id === currentPlan.id) o.selected = true;
      sel.appendChild(o);
    });

    const dateIn = form.querySelector('input[name=dataVencimento]');
    const baseDate = client.dataVencimento || new Date().toISOString().slice(0,10);
    const initialPlan = DB.planos.find(p => p.id === sel.value);
    dateIn.value = addMonthsToDate(baseDate, initialPlan ? initialPlan.validade : 0);

    sel.addEventListener('change', () => {
      const p = DB.planos.find(x => x.id === sel.value);
      dateIn.value = addMonthsToDate(baseDate, p ? p.validade : 0);
    });

    form.querySelector('#cancelRenew')?.addEventListener('click', ()=> window.app.closeModal());

    // função que salva a renovação e retorna true se salvou, false caso contrário
    async function saveRenewal(){
      try {
        const f = form.elements;
        const newPlanId = f.namedItem('planoId').value;
        const newDate = f.namedItem('dataVencimento').value;
        client.planoId = newPlanId;
        client.dataVencimento = newDate;
        client.numeroRenovacoes = (client.numeroRenovacoes || 0) + 1;
        client.renovacaoConfirmada = true;
        client.ultimaConfirmacao = new Date().toISOString();
        try {
          window.app.saveState();
        } catch (err) {
          console.error('Erro ao salvar estado:', err);
          return false;
        }
        try { renderClients(); } catch(_) {}
        try { renderSummary(); } catch(_) {}
        return true;
      } catch (err) {
        console.error('Erro inesperado em saveRenewal:', err);
        return false;
      }
    }

    // salvar apenas: feedback não bloqueante (toast)
    form.addEventListener('submit', async (e)=> {
      e.preventDefault();
      const ok = await saveRenewal();
      window.app.closeModal();
      if (ok) await showToast(`Cliente ${client.nome} renovado até ${form.elements.namedItem('dataVencimento').value}.`, 1800);
      else showToast('Falha ao salvar renovação. Tente novamente.', 2200);
    });

    // salvar e notificar: salva, se salvou então mostra toast curto, espera 2s, abre WhatsApp em nova aba
    form.querySelector('#saveNotifyRenew')?.addEventListener('click', async (e)=>{
      const ok = await saveRenewal();
      if (!ok) {
        showToast('Falha ao salvar renovação. Notificação cancelada.', 2500);
        return;
      }
      await showToast(`Renovação salva para ${client.nome}. Abrindo WhatsApp em breve...`, 2000);
      const plan = DB.planos.find(p => p.id === client.planoId) || null;
      const planName = plan ? plan.nome : '—';
      const venc = fmtDate(client.dataVencimento);
      const paymentInfo = plan ? planPaymentInfo(plan) : '';
      const lines = [
        `Olá ${client.nome},`,
        `Sua renovação foi confirmada.`,
        `Plano: ${planName}`,
        `Nova data de vencimento: ${venc}`,
      ];
      if (paymentInfo) lines.push(`Formas de pagamento: ${paymentInfo}`);
      lines.push('', 'Obrigado pela preferência.');
      const msg = encodeURIComponent(lines.join('\n'));
      const raw = client.whatsapp || '';
      const num = raw.replace(/\D/g,'');
      if (num) {
        const href = `https://wa.me/${num}?text=${msg}`;
        const w = window.open(href, '_blank', 'noopener,noreferrer');
        if (!w) {
          const a = document.createElement('a');
          a.href = href;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          a.remove();
        }
      } else {
        showToast('Número de WhatsApp inválido para este cliente.', 2500);
      }
      window.app.closeModal();
    });

    window.app.openModal(form);
  }

  /* -------------------------
     Edit / New client
     ------------------------- */
  function openEdit(client){
    const form = document.createElement('form'); form.className='form';
    form.innerHTML = `<h3>Editar Cliente</h3>
      <div class="two-col"><label class="field"><span>Nome</span><input name="nome" required></label><label class="field"><span>WhatsApp</span><input name="whatsapp"></label></div>
      <div class="form-actions"><button type="button" id="cancelClient" class="secondary">Cancelar</button><button type="submit" class="primary">Salvar</button></div>`;
    const f = form.elements;
    f.namedItem('nome').value = client.nome || '';
    f.namedItem('whatsapp').value = client.whatsapp || '';
    form.querySelector('#cancelClient')?.addEventListener('click', ()=> window.app.closeModal());
    form.addEventListener('submit', async (e)=> {
      e.preventDefault();
      client.nome = f.namedItem('nome').value;
      client.whatsapp = f.namedItem('whatsapp').value;
      try {
        window.app.saveState();
        window.app.closeModal();
        renderClients();
        renderSummary();
        await showToast('Cliente atualizado.', 1400);
      } catch(err) {
        console.error('Erro ao salvar cliente:', err);
        showToast('Falha ao salvar cliente.', 1800);
      }
    });
    window.app.openModal(form);
  }

  // binds
  const searchEl = document.getElementById('searchInput');
  if (searchEl) {
    try { searchEl.removeEventListener('input', renderClients); } catch(_) {}
    searchEl.addEventListener('input', ()=> renderClients());
  }
  const onlyToggle = document.getElementById('onlyNotifiedToggle');
  if (onlyToggle) {
    try { onlyToggle.removeEventListener('change', renderClients); } catch(_) {}
    onlyToggle.addEventListener('change', ()=> renderClients());
  }
  const btnNew = document.getElementById('btnNewClient');
  if (btnNew) {
    try { btnNew.removeEventListener('click', ()=>{}); } catch(_) {}
    btnNew.addEventListener('click', ()=> {
      const form = document.createElement('form'); form.className='form';
      form.innerHTML = `<h3>Novo Cliente</h3>
        <div class="two-col"><label class="field"><span>Nome</span><input name="nome" required></label><label class="field"><span>WhatsApp</span><input name="whatsapp"></label></div>
        <div class="form-actions"><button type="button" id="cancelNew" class="secondary">Cancelar</button><button type="submit" class="primary">Salvar</button></div>`;
      form.querySelector('#cancelNew')?.addEventListener('click', ()=> window.app.closeModal());
      form.addEventListener('submit', async (e)=> {
        e.preventDefault();
        const f = form.elements;
        const nc = { id:'c'+Math.random().toString(36).slice(2,8), nome: f.namedItem('nome').value, whatsapp: f.namedItem('whatsapp').value, dataCriacao: (new Date()).toISOString().slice(0,10), dataVencimento: (new Date()).toISOString().slice(0,10), planoId:'', usuario1:'', observacoes:'', statusNotificacao:false, numeroRenovacoes:0, bloqueado:false };
        try {
          DB.clientes.push(nc);
          window.app.saveState();
          window.app.closeModal();
          renderClients();
          renderSummary();
          await showToast('Cliente criado.', 1400);
        } catch(err) {
          console.error('Erro ao salvar novo cliente:', err);
          showToast('Falha ao criar cliente.', 1800);
        }
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
