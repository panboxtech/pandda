// js/views/clients.js
// Formulário de cliente refinado para regra: telas == soma de conexões por servidor (cada servidor precisa alcançar telas).
// Mensagens inline (não usamos alert) e comentários para integração Supabase.

import {
  getClients,
  getPlans,
  getServers,
  getApps,
  createClient,
  updateClient
} from '../mockData.js';
import { openFormModal } from '../modal.js';
import { getSession } from '../auth.js';

function el(tag, text, className) { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (className) e.className = className; return e; }

function formatDateIso(d) {
  if (!d) return '';
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth()+1).padStart(2,'0');
  const day = String(dt.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function addMonthsFromDateUTC(date, months) {
  const d = new Date(date.getTime());
  const targetMonth = d.getUTCMonth() + months;
  return new Date(Date.UTC(d.getUTCFullYear(), targetMonth, d.getUTCDate()));
}

// Validador reutilizável: verifica soma por servidor == telas
export function validateConnectionsPerServer({ servidores = [], pontosDeAcesso = [], telas = 0 }) {
  const map = {};
  servidores.forEach(s => map[s] = 0);
  pontosDeAcesso.forEach(p => {
    if (!p.servidorId) return;
    map[p.servidorId] = (map[p.servidorId] || 0) + Number(p.conexoesSimultaneas || 0);
  });
  const details = [];
  for (const srv of servidores) {
    const sum = map[srv] || 0;
    details.push({ servidorId: srv, sum, expected: Number(telas) });
  }
  const ok = details.every(d => d.sum === d.expected);
  return { ok, details };
}

export async function mountClientsView(root, { session } = {}) {
  const container = document.createElement('section');
  container.className = 'view view-clients';

  const header = document.createElement('div'); header.className = 'view-header';
  header.appendChild(el('h2', 'Clientes'));
  const actions = document.createElement('div'); actions.className = 'view-actions';
  const btnAdd = document.createElement('button'); btnAdd.className = 'btn'; btnAdd.textContent = 'Novo cliente';
  actions.appendChild(btnAdd);
  header.appendChild(actions);
  container.appendChild(header);

  // list area
  const list = document.createElement('div'); list.className = 'list';
  const feedback = el('div','', 'feedback');
  container.appendChild(list); container.appendChild(feedback);

  async function load() {
    feedback.textContent = 'Carregando...';
    const resp = await getClients({ page:1, pageSize:1000 });
    list.innerHTML = '';
    resp.items.forEach(c => {
      const row = document.createElement('div'); row.className = 'list-row';
      const left = document.createElement('div');
      left.appendChild(el('div', `${c.nome} ${c.blocked ? '(Bloqueado)' : ''}`, 'list-title'));
      left.appendChild(el('div', `Plano: ${c.planoId || '—'} • Telas: ${c.telas} • Servidores: ${ (c.servidores||[]).join(', ') }`, 'muted'));
      row.appendChild(left);
      const right = document.createElement('div');
      const edit = document.createElement('button'); edit.className = 'btn small'; edit.textContent = 'Editar';
      edit.addEventListener('click', () => openEdit(c.id));
      right.appendChild(edit);
      row.appendChild(right);
      list.appendChild(row);
    });
    feedback.textContent = `${resp.total} clientes`;
  }

  btnAdd.addEventListener('click', () => {
    openFormModal({
      title: 'Novo cliente',
      renderForm: (container, ctx) => renderClientForm(container, ctx, null),
      onConfirm: async (data) => {
        // validação pré-persistência
        const v = validateConnectionsPerServer({ servidores: data.servidores, pontosDeAcesso: data.pontosDeAcesso, telas: data.telas });
        if (!v.ok) {
          const bad = v.details.filter(d => d.sum !== d.expected).map(d => `${d.servidorId}: ${d.sum}/${d.expected}`).join('; ');
          throw new Error('Validação falhou por servidor: ' + bad);
        }
        await createClient(data);
        await load();
      }
    }).catch(()=>{});
  });

  async function openEdit(id) {
    const resp = await getClients({ page:1, pageSize:1000 });
    const item = resp.items.find(x => x.id === id);
    if (!item) return;
    openFormModal({
      title: 'Editar cliente',
      renderForm: (container, ctx) => renderClientForm(container, ctx, item),
      onConfirm: async (data) => {
        const v = validateConnectionsPerServer({ servidores: data.servidores, pontosDeAcesso: data.pontosDeAcesso, telas: data.telas });
        if (!v.ok) {
          const bad = v.details.filter(d => d.sum !== d.expected).map(d => `${d.servidorId}: ${d.sum}/${d.expected}`).join('; ');
          throw new Error('Validação falhou por servidor: ' + bad);
        }
        await updateClient(id, data);
        await load();
      }
    }).catch(()=>{});
  }

  // Render do formulário de cliente
  function renderClientForm(container, ctx, values = null) {
    container.innerHTML = '';
    const form = document.createElement('div'); form.className = 'entity-form';

    // area de mensagens inline
    const messageBox = document.createElement('div'); messageBox.className = 'form-message'; messageBox.style.marginBottom = '8px';
    form.appendChild(messageBox);

    // Campos básicos
    form.appendChild(el('label','Nome')); const nomeInput = document.createElement('input'); nomeInput.type='text'; nomeInput.value = values ? values.nome || '' : ''; form.appendChild(nomeInput);
    form.appendChild(el('label','Telefone')); const phoneInput = document.createElement('input'); phoneInput.type='text'; phoneInput.value = values ? values.phone || '' : ''; form.appendChild(phoneInput);
    form.appendChild(el('label','Email')); const emailInput = document.createElement('input'); emailInput.type='email'; emailInput.value = values ? values.email || '' : ''; form.appendChild(emailInput);

    // Seleção de servidores (até 2) - checkboxes
    form.appendChild(el('label','Servidores (máx 2)'));
    const serversList = document.createElement('div'); serversList.className = 'servers-list';
    getServers().then(srvs => {
      srvs.forEach(srv => {
        const wrap = document.createElement('label');
        wrap.style.display = 'inline-flex'; wrap.style.alignItems='center'; wrap.style.gap='6px'; wrap.style.marginRight='12px';
        const ch = document.createElement('input'); ch.type='checkbox'; ch.value = srv.id;
        if (values && Array.isArray(values.servidores) && values.servidores.includes(srv.id)) ch.checked = true;
        wrap.appendChild(ch);
        wrap.appendChild(document.createTextNode(srv.nome));
        serversList.appendChild(wrap);
      });
    });
    form.appendChild(serversList);

    // Plano select
    form.appendChild(el('label','Plano'));
    const planSelect = document.createElement('select'); planSelect.appendChild(Object.assign(document.createElement('option'),{ value:'', textContent:'Selecione plano' }));
    getPlans().then(pls => {
      pls.forEach(p => {
        const o = document.createElement('option'); o.value = p.id; o.textContent = `${p.nome} — ${p.telas} telas — R$${p.preco}`;
        if (values && values.planoId === p.id) o.selected = true;
        planSelect.appendChild(o);
      });
    });
    form.appendChild(planSelect);

    // Telas (número POR servidor), Preço (padrão do plano, editável) e Validade (calculada)
    form.appendChild(el('label','Telas (por servidor)'));
    const telasInput = document.createElement('input'); telasInput.type='number'; telasInput.min='1'; telasInput.value = values ? (values.telas || 0) : 1;
    form.appendChild(telasInput);

    form.appendChild(el('label','Preço (R$)'));
    const precoInput = document.createElement('input'); precoInput.type='number'; precoInput.step='0.01'; precoInput.value = values ? (values.preco || 0) : 0;
    form.appendChild(precoInput);

    form.appendChild(el('label','Validade'));
    const validadeInput = document.createElement('input'); validadeInput.type='date'; validadeInput.value = values ? (values.validade || '') : '';
    form.appendChild(validadeInput);

    // Indicadores por servidor (mostram soma atual / telas)
    const serversIndicators = document.createElement('div'); serversIndicators.className = 'servers-indicators'; serversIndicators.style.margin = '8px 0';
    form.appendChild(serversIndicators);

    // Pontos de Acesso (dinâmico)
    form.appendChild(el('label','Pontos de Acesso'));
    const pontosContainer = document.createElement('div'); pontosContainer.className = 'pontos-container';
    form.appendChild(pontosContainer);
    const addPontoBtn = document.createElement('button'); addPontoBtn.className = 'btn small'; addPontoBtn.type='button'; addPontoBtn.textContent = 'Adicionar Ponto';
    form.appendChild(addPontoBtn);

    // populate existing pontos if editing
    (async () => {
      if (values && Array.isArray(values.pontosDeAcesso)) {
        await renderPontos(values.pontosDeAcesso.slice());
      } else {
        await renderPontos([]);
      }
      updateIndicatorsAndValidation();
    })();

    // when plan selected, fill telas/preco/validade defaults
    planSelect.addEventListener('change', async () => {
      if (!planSelect.value) return;
      const plans = await getPlans();
      const sel = plans.find(p => p.id === planSelect.value);
      if (!sel) return;
      telasInput.value = sel.telas;
      precoInput.value = sel.preco;
      const now = new Date();
      const calc = addMonthsFromDateUTC(now, sel.validadeEmMeses);
      // fallback: if day mismatch, set to 01 of next month
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

    // when servers selection changes, ensure max 2 and update indicators
    serversList.addEventListener('change', () => {
      const selected = getSelectedServers();
      if (selected.length > 2) {
        // desfaz última mudança (simples: desmarcar a última marcada)
        // para simplicidade, apenas alertamos aqui e desmarcamos todos extras
        messageBox.innerHTML = `<div class="error">Selecione no máximo 2 servidores</div>`;
        Array.from(serversList.querySelectorAll('input[type=checkbox]')).forEach(inp => {
          if (!selected.includes(inp.value)) inp.checked = false;
        });
      } else {
        messageBox.innerHTML = '';
      }
      updateIndicatorsAndValidation();
    });

    // when telas change, update constraints for pontos
    telasInput.addEventListener('input', () => {
      updateIndicatorsAndValidation();
    });

    addPontoBtn.addEventListener('click', async () => {
      const cur = readPontosFromUI();
      cur.push({ appId: '', servidorId: '', usuario: '', senha: '', conexoesSimultaneas: 1 });
      await renderPontos(cur);
      updateIndicatorsAndValidation();
    });

    // --- functions used above ---

    function getSelectedServers() {
      return Array.from(serversList.querySelectorAll('input[type=checkbox]:checked')).map(i => i.value);
    }

    async function renderPontos(pontos = []) {
      const allApps = await getApps();
      pontosContainer.innerHTML = '';
      pontos.forEach((p, idx) => {
        const card = document.createElement('div'); card.className = 'ponto-card'; card.style.padding='8px'; card.style.border='1px solid rgba(0,0,0,0.06)'; card.style.marginBottom='8px'; card.style.borderRadius='6px';
        // app select
        const appLabel = el('label','App'); const appSelect = document.createElement('select');
        appSelect.appendChild(Object.assign(document.createElement('option'),{value:'',textContent:'Selecione app'}));
        allApps.forEach(a => {
          const o = document.createElement('option'); o.value = a.id; o.textContent = `${a.nome} — ${a.codigoDeAcesso} — srv:${a.servidorId}`;
          if (p.appId === a.id) o.selected = true;
          appSelect.appendChild(o);
        });
        // usuario / senha
        const userLabel = el('label','Usuário'); const userInput = document.createElement('input'); userInput.type='text'; userInput.value = p.usuario || '';
        const passLabel = el('label','Senha'); const passInput = document.createElement('input'); passInput.type='text'; passInput.value = p.senha || '';
        // conexoes
        const conexLabel = el('label','Conexões Simultâneas'); const conexInput = document.createElement('input'); conexInput.type='number'; conexInput.min='1'; conexInput.value = p.conexoesSimultaneas || 1;

        // servidorInfo display
        const srvInfo = el('div', p.servidorId ? `Servidor: ${p.servidorId}` : '', 'muted');

        // remove btn
        const removeBtn = document.createElement('button'); removeBtn.className = 'btn ghost small'; removeBtn.type='button'; removeBtn.textContent = 'Remover';
        removeBtn.addEventListener('click', async () => {
          const cur = readPontosFromUI();
          cur.splice(idx,1);
          await renderPontos(cur);
          updateIndicatorsAndValidation();
        });

        // when app changes, set servidorId derived and enforce multiplosAcessos rule
        appSelect.addEventListener('change', async () => {
          const selApp = allApps.find(a => a.id === appSelect.value);
          if (selApp) {
            srvInfo.textContent = `Servidor: ${selApp.servidorId}`;
            // enforce single-access apps
            if (!selApp.multiplosAcessos) {
              conexInput.value = 1;
              conexInput.disabled = true;
            } else {
              conexInput.disabled = false;
              // optionally set max, but final validation checks sums per servidor
              conexInput.removeAttribute('max');
            }
          } else {
            srvInfo.textContent = '';
            conexInput.disabled = false;
          }
          updateIndicatorsAndValidation();
        });

        // initial enforcement based on p.appId
        (async () => {
          const appObj = allApps.find(a => a.id === p.appId);
          if (appObj) {
            srvInfo.textContent = `Servidor: ${appObj.servidorId}`;
            if (!appObj.multiplosAcessos) {
              conexInput.value = 1;
              conexInput.disabled = true;
            }
          }
        })();

        // assemble card
        card.appendChild(appLabel); card.appendChild(appSelect);
        card.appendChild(srvInfo);
        card.appendChild(userLabel); card.appendChild(userInput);
        card.appendChild(passLabel); card.appendChild(passInput);
        card.appendChild(conexLabel); card.appendChild(conexInput);
        card.appendChild(removeBtn);
        pontosContainer.appendChild(card);
      });
    }

    function readPontosFromUI() {
      const cards = Array.from(pontosContainer.children);
      const dados = [];
      cards.forEach(card => {
        const sel = card.querySelector('select');
        const appId = sel ? sel.value : '';
        const appObj = null;
        const inputsText = card.querySelectorAll('input[type="text"]');
        const usuario = inputsText && inputsText[0] ? inputsText[0].value : '';
        const senha = inputsText && inputsText[1] ? inputsText[1].value : '';
        const conex = card.querySelector('input[type="number"]') ? Number(card.querySelector('input[type="number"]').value || 0) : 0;
        // derive servidorId by app selection from app list
        dados.push({ appId, servidorId: null, usuario, senha, conexoesSimultaneas: conex });
      });
      return dados;
    }

    async function resolvePontosWithServerIds(rawPontos) {
      const allApps = await getApps();
      return rawPontos.map(p => {
        const appObj = allApps.find(a => a.id === p.appId);
        return { ...p, servidorId: appObj ? appObj.servidorId : null };
      });
    }

    // update indicators per servidor and perform inline validation messages
    async function updateIndicatorsAndValidation() {
      const selectedServers = getSelectedServers();
      serversIndicators.innerHTML = '';
      // if no servers, show warning if pontos exist
      const rawPontos = readPontosFromUI();
      const pontos = await resolvePontosWithServerIds(rawPontos);

      // build sums
      const sums = {};
      selectedServers.forEach(s => sums[s] = 0);
      pontos.forEach(p => {
        if (!p.servidorId) return;
        if (!sums.hasOwnProperty(p.servidorId)) sums[p.servidorId] = 0;
        sums[p.servidorId] += Number(p.conexoesSimultaneas || 0);
      });

      const telasVal = Number(telasInput.value || 0);

      // render indicator per selected server
      selectedServers.forEach(srvId => {
        const sum = sums[srvId] || 0;
        const row = document.createElement('div'); row.style.display='flex'; row.style.justifyContent='space-between'; row.style.alignItems='center'; row.style.gap='8px';
        const left = document.createElement('div'); left.textContent = `Servidor ${srvId}`;
        const right = document.createElement('div');
        if (sum === telasVal) {
          right.innerHTML = `<span class="ok">Conexões: ${sum}/${telasVal} — ok</span>`;
        } else if (sum < telasVal) {
          right.innerHTML = `<span class="warn">Conexões: ${sum}/${telasVal} — faltam ${telasVal - sum}</span>`;
        } else {
          right.innerHTML = `<span class="error">Conexões: ${sum}/${telasVal} — excede ${sum - telasVal}</span>`;
        }
        row.appendChild(left); row.appendChild(right);
        serversIndicators.appendChild(row);
      });

      // overall validation: every selected server must have sum === telasVal
      const validation = validateConnectionsPerServer({ servidores: selectedServers, pontosDeAcesso: pontos, telas: telasVal });
      if (!selectedServers.length && pontos.length) {
        messageBox.innerHTML = `<div class="error">Selecione pelo menos um servidor antes de adicionar pontos de acesso.</div>`;
      } else if (!validation.ok) {
        const bad = validation.details.filter(d => d.sum !== d.expected);
        const msgs = bad.map(d => `${d.servidorId}: ${d.sum}/${d.expected}`).join('; ');
        messageBox.innerHTML = `<div class="error">Validação por servidor falhou: ${msgs}</div>`;
      } else {
        messageBox.innerHTML = `<div class="success">Validação por servidor OK</div>`;
      }
    }

    // save handler
    const saveBtn = document.createElement('button'); saveBtn.className = 'btn'; saveBtn.type='button'; saveBtn.textContent = 'Salvar';
    saveBtn.addEventListener('click', async () => {
      // basic required fields
      if (!nomeInput.value.trim()) {
        messageBox.innerHTML = `<div class="error">Nome obrigatório</div>`; return;
      }
      const selectedServers = getSelectedServers();
      if (selectedServers.length === 0) {
        messageBox.innerHTML = `<div class="error">Selecione ao menos 1 servidor</div>`; return;
      }
      const planId = planSelect.value || null;
      const telasVal = Number(telasInput.value || 0);
      const precoVal = Number(precoInput.value || 0);
      const validadeVal = validadeInput.value || null;

      // collect pontos and resolve servidorId
      const rawPontos = readPontosFromUI();
      const pontos = await resolvePontosWithServerIds(rawPontos);

      // validations per ponto: app must be valid, conexoesSimultaneas obey multiplosAcessos
      const appsMap = (await getApps()).reduce((acc,a) => { acc[a.id] = a; return acc; }, {});
      for (const p of pontos) {
        const app = appsMap[p.appId];
        if (!app) { messageBox.innerHTML = `<div class="error">Selecione um app válido em todos os pontos</div>`; return; }
        if (!selectedServers.includes(app.servidorId)) {
          messageBox.innerHTML = `<div class="error">App ${app.nome} pertence ao servidor ${app.servidorId} não selecionado</div>`; return;
        }
        if (!app.multiplosAcessos && Number(p.conexoesSimultaneas) !== 1) {
          messageBox.innerHTML = `<div class="error">App ${app.nome} não permite múltiplos acessos; conexões deve ser 1</div>`; return;
        }
        if (app.multiplosAcessos) {
          if (Number(p.conexoesSimultaneas) < 1 || Number(p.conexoesSimultaneas) > telasVal) {
            messageBox.innerHTML = `<div class="error">Conexões para ${app.nome} deve estar entre 1 e ${telasVal}</div>`; return;
          }
        }
      }

      // final validation: soma por servidor == telasVal
      const finalV = validateConnectionsPerServer({ servidores: selectedServers, pontosDeAcesso: pontos, telas: telasVal });
      if (!finalV.ok) {
        const bad = finalV.details.filter(d => d.sum !== d.expected);
        const msgs = bad.map(d => `${d.servidorId}: ${d.sum}/${d.expected}`).join('; ');
        messageBox.innerHTML = `<div class="error">Validação por servidor falhou: ${msgs}</div>`; return;
      }

      // payload assembly (persistência)
      const payload = {
        nome: nomeInput.value.trim(),
        phone: phoneInput.value.trim(),
        email: emailInput.value.trim(),
        servidores: selectedServers,
        planoId: planId,
        telas: telasVal,
        preco: precoVal,
        validade: validadeVal,
        pontosDeAcesso: pontos
      };

      // feedback se preco/telas divergem do plano
      if (planId) {
        const plan = (await getPlans()).find(p => p.id === planId);
        if (plan) {
          if (Number(plan.preco) !== precoVal) {
            messageBox.innerHTML = `<div class="warn">Preço salvo difere do preço do plano (${plan.preco})</div>`;
          }
          if (Number(plan.telas) !== telasVal) {
            messageBox.innerHTML = `<div class="warn">Telas salvas difere do plano (${plan.telas})</div>`;
          }
        }
      }

      ctx.resolve(payload);
    });

    const cancelBtn = document.createElement('button'); cancelBtn.className = 'btn ghost'; cancelBtn.type='button'; cancelBtn.textContent = 'Cancelar';
    cancelBtn.addEventListener('click', () => ctx.cancel());

    form.appendChild(saveBtn); form.appendChild(cancelBtn);
    container.appendChild(form);

    // observe changes in pontosContainer to update indicators in realtime
    const obs = new MutationObserver(() => updateIndicatorsAndValidation());
    obs.observe(pontosContainer, { childList: true, subtree: true });

    // small intervalic check for inputs (handles manual edits)
    const intervalId = setInterval(updateIndicatorsAndValidation, 400);
    // cleanup when modal closes: ctx is expected to return a promise resolving/canceling; we can't detect that here.
    // The modal implementation should call ctx.cancel/ctx.resolve and then remove the DOM; interval will stop when modal removed.
  }

  // mount
  load();
  root.appendChild(container);
}
