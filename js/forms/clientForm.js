// js/forms/clientForm.js
// Formulário de cliente reutilizável (criação e edição).
// Exporta: renderClientForm(container, ctx, values)
// - Valores principais: nome, telefone, email, servidores (até 2), plano, telas (por servidor), preço, validade
// - Pontos de acesso: app (define servidor automaticamente), usuário, senha, conexõesSimultâneas
// - Regras: para cada servidor selecionado, a soma de conexõesSimultâneas dos pontos daquele servidor deve ser exatamente igual a "telas"
// - Se o app não permite multiplosAcessos, conexões = 1 fixo
// - Mensagens inline e indicadores por servidor

import { getPlans, getServers, getApps } from '../mockData.js';

function el(tag, text, className) {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (className) e.className = className;
  return e;
}
function formatDateIso(d) {
  if (!d) return '';
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function addMonthsFromDateUTC(date, months) {
  const d = new Date(date.getTime());
  const targetMonth = d.getUTCMonth() + months;
  return new Date(Date.UTC(d.getUTCFullYear(), targetMonth, d.getUTCDate()));
}
function validateConnectionsPerServer({ servidores = [], pontosDeAcesso = [], telas = 0 }) {
  const map = {};
  servidores.forEach(s => (map[s] = 0));
  pontosDeAcesso.forEach(p => {
    if (!p.servidorId) return;
    map[p.servidorId] = (map[p.servidorId] || 0) + Number(p.conexoesSimultaneas || 0);
  });
  const details = servidores.map(srv => ({
    servidorId: srv,
    sum: map[srv] || 0,
    expected: Number(telas),
  }));
  return { ok: details.every(d => d.sum === d.expected), details };
}

export async function renderClientForm(container, ctx, values = null) {
  container.innerHTML = '';
  const form = document.createElement('div');
  form.className = 'entity-form';

  // Caixa de mensagens inline
  const messageBox = document.createElement('div');
  messageBox.className = 'form-message';
  form.appendChild(messageBox);

  // Campos básicos
  form.appendChild(el('label', 'Nome'));
  const nomeInput = document.createElement('input');
  nomeInput.type = 'text';
  nomeInput.value = values?.nome || '';
  form.appendChild(nomeInput);

  form.appendChild(el('label', 'Telefone'));
  const phoneInput = document.createElement('input');
  phoneInput.type = 'text';
  phoneInput.value = values?.phone || '';
  form.appendChild(phoneInput);

  form.appendChild(el('label', 'Email'));
  const emailInput = document.createElement('input');
  emailInput.type = 'email';
  emailInput.value = values?.email || '';
  form.appendChild(emailInput);

  // Seleção de servidores (máx 2)
  form.appendChild(el('label', 'Servidores (máx 2)'));
  const serversList = document.createElement('div');
  serversList.className = 'servers-list';
  const servers = await getServers();
  servers.forEach(srv => {
    const wrap = document.createElement('label');
    wrap.style.display = 'inline-flex';
    wrap.style.alignItems = 'center';
    wrap.style.gap = '6px';
    wrap.style.marginRight = '12px';
    const ch = document.createElement('input');
    ch.type = 'checkbox';
    ch.value = srv.id;
    if (values?.servidores?.includes(srv.id)) ch.checked = true;
    wrap.appendChild(ch);
    wrap.appendChild(document.createTextNode(srv.nome));
    serversList.appendChild(wrap);
  });
  form.appendChild(serversList);

  // Seleção de plano
  form.appendChild(el('label', 'Plano'));
  const planSelect = document.createElement('select');
  planSelect.appendChild(Object.assign(document.createElement('option'), { value: '', textContent: 'Selecione plano' }));
  const plans = await getPlans();
  plans.forEach(p => {
    const o = document.createElement('option');
    o.value = p.id;
    o.textContent = `${p.nome} — ${p.telas} telas — R$${p.preco}`;
    if (values?.planoId === p.id) o.selected = true;
    planSelect.appendChild(o);
  });
  form.appendChild(planSelect);

  // Telas, Preço, Validade
  form.appendChild(el('label', 'Telas (por servidor)'));
  const telasInput = document.createElement('input');
  telasInput.type = 'number';
  telasInput.min = '1';
  telasInput.value = values?.telas || 1;
  form.appendChild(telasInput);

  form.appendChild(el('label', 'Preço (R$)'));
  const precoInput = document.createElement('input');
  precoInput.type = 'number';
  precoInput.step = '0.01';
  precoInput.value = values?.preco || 0;
  form.appendChild(precoInput);

  form.appendChild(el('label', 'Validade'));
  const validadeInput = document.createElement('input');
  validadeInput.type = 'date';
  validadeInput.value = values?.validade || '';
  form.appendChild(validadeInput);

  // Indicadores por servidor (soma atual / telas)
  const serversIndicators = document.createElement('div');
  serversIndicators.className = 'servers-indicators';
  serversIndicators.style.margin = '8px 0';
  form.appendChild(serversIndicators);

  // Pontos de Acesso dinâmicos
  form.appendChild(el('label', 'Pontos de Acesso'));
  const pontosContainer = document.createElement('div');
  pontosContainer.className = 'pontos-container';
  form.appendChild(pontosContainer);
  const addPontoBtn = document.createElement('button');
  addPontoBtn.className = 'btn small';
  addPontoBtn.type = 'button';
  addPontoBtn.textContent = 'Adicionar Ponto';
  form.appendChild(addPontoBtn);

  // Popular pontos (edição) e inicializar indicadores
  const initialPontos = values?.pontosDeAcesso?.map(p => ({ ...p })) || [];
  await renderPontos(initialPontos);
  await updateIndicatorsAndValidation();

  // Eventos: plano muda → preencher telas/preço/validade
  planSelect.addEventListener('change', () => {
    const sel = plans.find(p => p.id === planSelect.value);
    if (!sel) return;
    telasInput.value = sel.telas;
    precoInput.value = sel.preco;
    const now = new Date();
    const calc = addMonthsFromDateUTC(now, sel.validadeEmMeses);
    if (calc.getUTCDate() !== now.getUTCDate()) {
      const fallback = new Date(Date.UTC(calc.getUTCFullYear(), calc.getUTCMonth() + 1, 1));
      validadeInput.value = formatDateIso(fallback);
      messageBox.innerHTML = `<div class="warn">Validade ajustada para ${formatDateIso(fallback)} (ajuste de dia inválido no mês alvo).</div>`;
    } else {
      validadeInput.value = formatDateIso(calc);
      messageBox.innerHTML = '';
    }
    updateIndicatorsAndValidation();
  });

  // Servidores mudam → máximo 2 e atualizar indicadores
  serversList.addEventListener('change', () => {
    const selected = getSelectedServers();
    if (selected.length > 2) {
      messageBox.innerHTML = `<div class="error">Selecione no máximo 2 servidores</div>`;
      // desmarcar excesso (estratégia simples: desmarcar o último clicado)
      const inputs = Array.from(serversList.querySelectorAll('input[type=checkbox]'));
      // se ainda >2, desmarca extras a partir do fim
      while (getSelectedServers().length > 2) {
        const lastChecked = inputs.reverse().find(i => i.checked);
        if (!lastChecked) break;
        lastChecked.checked = false;
      }
    } else {
      messageBox.innerHTML = '';
    }
    updateIndicatorsAndValidation();
  });

  // Telas muda → atualizar indicadores
  telasInput.addEventListener('input', () => updateIndicatorsAndValidation());

  // Adicionar ponto
  addPontoBtn.addEventListener('click', async () => {
    const cur = readPontosFromUI();
    cur.push({ appId: '', servidorId: '', usuario: '', senha: '', conexoesSimultaneas: 1 });
    await renderPontos(cur);
    updateIndicatorsAndValidation();
  });

  // Botões salvar/cancelar
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn';
  saveBtn.type = 'button';
  saveBtn.textContent = 'Salvar';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn ghost';
  cancelBtn.type = 'button';
  cancelBtn.textContent = 'Cancelar';

  saveBtn.addEventListener('click', onSave);
  cancelBtn.addEventListener('click', () => ctx.cancel());

  form.appendChild(saveBtn);
  form.appendChild(cancelBtn);
  container.appendChild(form);

  // Observers/cleanup
  const mo = new MutationObserver(() => updateIndicatorsAndValidation());
  mo.observe(pontosContainer, { childList: true, subtree: true });
  if (ctx && typeof ctx._registerCleanup === 'function') {
    ctx._registerCleanup(() => mo.disconnect());
    const intervalId = setInterval(updateIndicatorsAndValidation, 500);
    ctx._registerCleanup(() => clearInterval(intervalId));
  }

  // ------------- Helpers internos -------------

  function getSelectedServers() {
    return Array.from(serversList.querySelectorAll('input[type=checkbox]:checked')).map(i => i.value);
  }
  function readPontosFromUI() {
    const cards = Array.from(pontosContainer.children);
    return cards.map(card => {
      const sel = card.querySelector('select');
      const appId = sel ? sel.value : '';
      const inputsText = card.querySelectorAll('input[type="text"]');
      const usuario = inputsText && inputsText[0] ? inputsText[0].value : '';
      const senha = inputsText && inputsText[1] ? inputsText[1].value : '';
      const conex = card.querySelector('input[type="number"]') ? Number(card.querySelector('input[type="number"]').value || 0) : 0;
      return { appId, servidorId: null, usuario, senha, conexoesSimultaneas: conex };
    });
  }
  async function resolvePontosWithServerIds(rawPontos) {
    const allApps = await getApps();
    return rawPontos.map(p => {
      const appObj = allApps.find(a => a.id === p.appId);
      return { ...p, servidorId: appObj ? appObj.servidorId : null };
    });
  }

  async function renderPontos(pontos = []) {
    const allApps = await getApps();
    pontosContainer.innerHTML = '';
    pontos.forEach((p, idx) => {
      const card = document.createElement('div');
      card.className = 'ponto-card';
      card.style.padding = '8px';
      card.style.border = '1px solid rgba(0,0,0,0.06)';
      card.style.marginBottom = '8px';
      card.style.borderRadius = '6px';

      const appLabel = el('label', 'App');
      const appSelect = document.createElement('select');
      appSelect.appendChild(Object.assign(document.createElement('option'), { value: '', textContent: 'Selecione app' }));
      allApps.forEach(a => {
        const o = document.createElement('option');
        o.value = a.id;
        o.textContent = `${a.nome} — ${a.codigoDeAcesso} — srv:${a.servidorId}`;
        if (p.appId === a.id) o.selected = true;
        appSelect.appendChild(o);
      });

      const srvInfo = el('div', p.servidorId ? `Servidor: ${p.servidorId}` : '', 'muted');
      const userLabel = el('label', 'Usuário');
      const userInput = document.createElement('input');
      userInput.type = 'text';
      userInput.value = p.usuario || '';
      const passLabel = el('label', 'Senha');
      const passInput = document.createElement('input');
      passInput.type = 'text';
      passInput.value = p.senha || '';
      const conexLabel = el('label', 'Conexões Simultâneas');
      const conexInput = document.createElement('input');
      conexInput.type = 'number';
      conexInput.min = '1';
      conexInput.value = p.conexoesSimultaneas || 1;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn ghost small';
      removeBtn.type = 'button';
      removeBtn.textContent = 'Remover';
      removeBtn.addEventListener('click', async () => {
        const cur = readPontosFromUI();
        cur.splice(idx, 1);
        await renderPontos(cur);
        updateIndicatorsAndValidation();
      });

      appSelect.addEventListener('change', () => {
        const selApp = allApps.find(a => a.id === appSelect.value);
        if (selApp) {
          srvInfo.textContent = `Servidor: ${selApp.servidorId}`;
          if (!selApp.multiplosAcessos) {
            conexInput.value = 1;
            conexInput.disabled = true;
          } else {
            conexInput.disabled = false;
            conexInput.removeAttribute('max');
          }
        } else {
          srvInfo.textContent = '';
          conexInput.disabled = false;
        }
        updateIndicatorsAndValidation();
      });

      // enforcement inicial
      const initApp = allApps.find(a => a.id === p.appId);
      if (initApp) {
        srvInfo.textContent = `Servidor: ${initApp.servidorId}`;
        if (!initApp.multiplosAcessos) {
          conexInput.value = 1;
          conexInput.disabled = true;
        }
      }

      card.appendChild(appLabel);
      card.appendChild(appSelect);
      card.appendChild(srvInfo);
      card.appendChild(userLabel);
      card.appendChild(userInput);
      card.appendChild(passLabel);
      card.appendChild(passInput);
      card.appendChild(conexLabel);
      card.appendChild(conexInput);
      card.appendChild(removeBtn);
      pontosContainer.appendChild(card);
    });
  }

  async function updateIndicatorsAndValidation() {
    const selectedServers = getSelectedServers();
    serversIndicators.innerHTML = '';

    const rawPontos = readPontosFromUI();
    const pontos = await resolvePontosWithServerIds(rawPontos);

    const sums = {};
    selectedServers.forEach(s => (sums[s] = 0));
    pontos.forEach(p => {
      if (!p.servidorId) return;
      if (!sums.hasOwnProperty(p.servidorId)) sums[p.servidorId] = 0;
      sums[p.servidorId] += Number(p.conexoesSimultaneas || 0);
    });

    const telasVal = Number(telasInput.value || 0);

    selectedServers.forEach(srvId => {
      const sum = sums[srvId] || 0;
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.alignItems = 'center';
      row.style.gap = '8px';
      const left = document.createElement('div');
      left.textContent = `Servidor ${srvId}`;
      const right = document.createElement('div');
      if (sum === telasVal) right.innerHTML = `<span class="ok">Conexões: ${sum}/${telasVal} — ok</span>`;
      else if (sum < telasVal) right.innerHTML = `<span class="warn">Conexões: ${sum}/${telasVal} — faltam ${telasVal - sum}</span>`;
      else right.innerHTML = `<span class="error">Conexões: ${sum}/${telasVal} — excede ${sum - telasVal}</span>`;
      row.appendChild(left);
      row.appendChild(right);
      serversIndicators.appendChild(row);
    });

    // Mensagens inline
    if (!selectedServers.length && pontos.length) {
      messageBox.innerHTML = `<div class="error">Selecione pelo menos um servidor antes de adicionar pontos de acesso.</div>`;
    } else {
      const validation = validateConnectionsPerServer({ servidores: selectedServers, pontosDeAcesso: pontos, telas: telasVal });
      if (!validation.ok) {
        const bad = validation.details.filter(d => d.sum !== d.expected);
        const msgs = bad.map(d => `${d.servidorId}: ${d.sum}/${d.expected}`).join('; ');
        messageBox.innerHTML = `<div class="error">Validação por servidor falhou: ${msgs}</div>`;
      } else {
        messageBox.innerHTML = `<div class="success">Validação por servidor OK</div>`;
      }
    }
  }

  async function onSave() {
    // Regras básicas
    if (!nomeInput.value.trim()) {
      messageBox.innerHTML = `<div class="error">Nome obrigatório</div>`;
      return;
    }
    const selectedServers = getSelectedServers();
    if (selectedServers.length === 0) {
      messageBox.innerHTML = `<div class="error">Selecione ao menos 1 servidor</div>`;
      return;
    }

    const planId = planSelect.value || null;
    const telasVal = Number(telasInput.value || 0);
    const precoVal = Number(precoInput.value || 0);
    const validadeVal = validadeInput.value || null;

    const rawPontos = readPontosFromUI();
    const pontos = await resolvePontosWithServerIds(rawPontos);

    // Validações por ponto
    const appsMap = (await getApps()).reduce((acc, a) => {
      acc[a.id] = a;
      return acc;
    }, {});
    for (const p of pontos) {
      const app = appsMap[p.appId];
      if (!app) {
        messageBox.innerHTML = `<div class="error">Selecione um app válido em todos os pontos</div>`;
        return;
      }
      if (!selectedServers.includes(app.servidorId)) {
        messageBox.innerHTML = `<div class="error">App ${app.nome} pertence ao servidor ${app.servidorId} não selecionado</div>`;
        return;
      }
      if (!app.multiplosAcessos && Number(p.conexoesSimultaneas) !== 1) {
        messageBox.innerHTML = `<div class="error">App ${app.nome} não permite múltiplos acessos; conexões deve ser 1</div>`;
        return;
      }
      if (app.multiplosAcessos) {
        if (Number(p.conexoesSimultaneas) < 1 || Number(p.conexoesSimultaneas) > telasVal) {
          messageBox.innerHTML = `<div class="error">Conexões para ${app.nome} deve estar entre 1 e ${telasVal}</div>`;
          return;
        }
      }
    }

    // Validação final por servidor
    const finalV = validateConnectionsPerServer({ servidores: selectedServers, pontosDeAcesso: pontos, telas: telasVal });
    if (!finalV.ok) {
      const bad = finalV.details.filter(d => d.sum !== d.expected);
      const msgs = bad.map(d => `${d.servidorId}: ${d.sum}/${d.expected}`).join('; ');
      messageBox.innerHTML = `<div class="error">Validação por servidor falhou: ${msgs}</div>`;
      return;
    }

    const payload = {
      nome: nomeInput.value.trim(),
      phone: phoneInput.value.trim(),
      email: emailInput.value.trim(),
      servidores: selectedServers,
      planoId: planId,
      telas: telasVal,
      preco: precoVal,
      validade: validadeVal,
      pontosDeAcesso: pontos,
    };

    // Feedback diferencial do plano
    if (planId) {
      const plan = plans.find(p => p.id === planId);
      if (plan) {
        if (Number(plan.preco) !== precoVal) {
          messageBox.innerHTML = `<div class="warn">Preço salvo difere do preço do plano (${plan.preco})</div>`;
        }
        if (Number(plan.telas) !== telasVal) {
          messageBox.innerHTML = `<div class="warn">Telas salvas difere do plano (${plan.telas})</div>`;
        }
      }
    }

    // Entregar dados ao modal
    ctx.resolve(payload);
  }
}
