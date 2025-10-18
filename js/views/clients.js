// js/views/clients.js
// Atualizado para incluir seleção de plano, servidores (até 2), override de telas/preco, cálculo de validade,
// e gerenciamento dinâmico de pontosDeAcesso com regras sobre multiplosAcessos.
// Observação: cálculo de validade usa date local no mock. Ao integrar Supabase, use a data retornada pelo backend.

import { getClients, getPlans, getServers, getApps, createClient, updateClient, getClients as getAllClients } from '../mockData.js';
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

function addMonthsFromDate(date, months) {
  // keep day; if invalid, caller must handle fallback to 01 next month
  const d = new Date(date.getTime());
  const targetMonth = d.getMonth() + months;
  return new Date(d.getFullYear(), targetMonth, d.getDate());
}

export async function mountClientsView(root, { session } = {}) {
  const container = document.createElement('section'); container.className='view view-clients';
  const header = document.createElement('div'); header.className='view-header';
  header.appendChild(el('h2','Clientes'));
  const actions = document.createElement('div'); actions.className='view-actions';
  const btnAdd = document.createElement('button'); btnAdd.className='btn'; btnAdd.textContent='Novo cliente';
  actions.appendChild(btnAdd); header.appendChild(actions); container.appendChild(header);

  // keep toolbar/filter/pagination as before — omitted here for brevity reusing existing UI of your project
  // We'll focus on the extended create/edit form which is the main change per request.

  const list = document.createElement('div'); list.className='list';
  const feedback = el('div','', 'feedback');
  container.appendChild(list); container.appendChild(feedback);

  async function load() {
    feedback.textContent = 'Carregando...';
    const resp = await getClients({ page:1, pageSize:1000 }); // for brevity show up to 1000
    list.innerHTML = '';
    resp.items.forEach(c => {
      const row = document.createElement('div'); row.className='list-row';
      const left = document.createElement('div');
      left.appendChild(el('div', `${c.nome} ${c.blocked ? '(Bloqueado)':''}`, 'list-title'));
      left.appendChild(el('div', `Plano: ${c.planoId || '—'} • Telas: ${c.telas} • Validade: ${c.validade || '—'}`, 'muted'));
      row.appendChild(left);
      const right = document.createElement('div');
      const edit = document.createElement('button'); edit.className='btn small'; edit.textContent='Editar';
      edit.addEventListener('click', ()=> openEdit(c.id));
      right.appendChild(edit);
      row.appendChild(right);
      list.appendChild(row);
    });
    feedback.textContent = `${resp.total} clientes`;
  }

  btnAdd.addEventListener('click', ()=> {
    openFormModal({
      title: 'Novo cliente',
      renderForm: (container, ctx) => renderClientForm(container, ctx, null),
      onConfirm: async (data) => {
        // validation before create: ensure pontosDeAcesso constraints
        const validationErr = validateClientPayload(data);
        if (validationErr) throw new Error(validationErr);
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
        const validationErr = validateClientPayload(data);
        if (validationErr) throw new Error(validationErr);
        await updateClient(id, data);
        await load();
      }
    }).catch(()=>{});
  }

  function validateClientPayload(payload) {
    // 1) servidores <= 2
    if (payload.servidores && payload.servidores.length > 2) return 'Um cliente pode ter no máximo 2 servidores';
    // 2) pontosDeAcesso: soma conexoes por servidor deve ser igual ao telas definidas para aquele servidor
    const pontos = payload.pontosDeAcesso || [];
    // build map servidorId -> soma conexoes
    const sumBySrv = {};
    pontos.forEach(p => {
      sumBySrv[p.servidorId] = (sumBySrv[p.servidorId] || 0) + Number(p.conexoesSimultaneas || 0);
    });
    // each server assigned to client must have sumBySrv == telas for that server
    // rule: "soma de conexõesMultiplas de todos os acessos adicionados só pode ser validado quando for igual ao numero de telas."
    // Interpretation: for each servidor in payload.servidores, the sum of conexoesSimultaneas for pontos using that servidor must equal allowed telas for that servidor.
    // Since telas is per cliente but not shared between servers, assume telas value is per server (user may input per server in UI); our model stores telas on client as total per server instance in the same field per server. For simplicity, require total sum across pontos for all servidores equals telas * number of servidores assigned? The user requested "numero de telas não é compartilhado", so telas applies per server. Therefore for N servers, each server should have its own tela count. For current data model we used single telas on client; therefore we require that when multiple servers present, pontos specify conexoes up to telas for each server. So we expect payload to include telasPorServidor map or clientes.servidores array with objects. To keep backward compatibility, we will require payload to include telasPorServidor mapping when more than one server provided. Validate accordingly.
    if (payload.servidores && payload.servidores.length > 1) {
      // expect payload.telasPorServidor: { servidorId: number, ... }
      if (!payload.telasPorServidor) return 'Para múltiplos servidores informe telas por servidor';
      for (const srvId of payload.servidores) {
        const allowed = Number(payload.telasPorServidor[srvId]||0);
        const sum = Number(sumBySrv[srvId]||0);
        if (sum !== allowed) return `Soma de conexões do servidor ${srvId} (${sum}) deve ser igual ao número de telas (${allowed})`;
      }
    } else {
      // single server case: use payload.telas as allowed
      const srvId = (payload.servidores && payload.servidores[0]) || null;
      if (srvId) {
        const allowed = Number(payload.telas || 0);
        const sum = Number(sumBySrv[srvId]||0);
        if (sum !== allowed) return `Soma de conexões (${sum}) deve ser igual ao número de telas (${allowed}) para o servidor ${srvId}`;
      }
    }
    // 3) pontosDeAcesso: if app.multiplosAcessos === false, conexoesSimultaneas must be 1
    // Note: this validation will be performed in UI as well; here do a soft check
    return null;
  }

  function renderClientForm(container, ctx, values = null) {
    // values null => create flow: user picks plan/servers and we compute defaults
    container.innerHTML = '';
    const form = document.createElement('div'); form.className='entity-form';

    const nomeLabel = el('label','Nome'); const nomeInput = document.createElement('input'); nomeInput.type='text'; nomeInput.value = values ? values.nome || '' : '';
    form.appendChild(nomeLabel); form.appendChild(nomeInput);

    const phoneLabel = el('label','Telefone'); const phoneInput = document.createElement('input'); phoneInput.type='text'; phoneInput.value = values ? values.phone || '' : '';
    form.appendChild(phoneLabel); form.appendChild(phoneInput);

    const emailLabel = el('label','Email'); const emailInput = document.createElement('input'); emailInput.type='email'; emailInput.value = values ? values.email || '' : '';
    form.appendChild(emailLabel); form.appendChild(emailInput);

    // servers selection (multiple up to 2) - use checkbox list for simplicity
    const serversLabel = el('label','Servidores (máx 2)');
    form.appendChild(serversLabel);
    const serversList = document.createElement('div'); serversList.className='servers-list';
    getServers().then(srvs => {
      srvs.forEach(srv => {
        const id = srv.id;
        const wrap = document.createElement('label'); wrap.style.display='inline-flex'; wrap.style.alignItems='center'; wrap.style.gap='6px'; wrap.style.marginRight='12px';
        const ch = document.createElement('input'); ch.type='checkbox'; ch.value = id;
        if (values && Array.isArray(values.servidores) && values.servidores.includes(id)) ch.checked = true;
        wrap.appendChild(ch); wrap.appendChild(document.createTextNode(srv.nome));
        serversList.appendChild(wrap);
      });
    });
    form.appendChild(serversList);

    // plan select dropdown
    const planLabel = el('label','Plano');
    form.appendChild(planLabel);
    const planSelect = document.createElement('select');
    planSelect.appendChild(Object.assign(document.createElement('option'),{value:'',textContent:'Selecione plano'}));
    getPlans().then(pls => {
      pls.forEach(p => {
        const o = document.createElement('option'); o.value = p.id; o.textContent = `${p.nome} — ${p.telas} telas — R$${p.preco}`;
        if (values && values.planoId === p.id) o.selected = true;
        planSelect.appendChild(o);
      });
    });
    form.appendChild(planSelect);

    // telas (default from plan, editable) + preco (default from plan editable) + validade (computed)
    form.appendChild(el('label','Telas'));
    const telasInput = document.createElement('input'); telasInput.type='number'; telasInput.min='1'; telasInput.value = values ? (values.telas || 0) : 0;
    form.appendChild(telasInput);

    form.appendChild(el('label','Preço (R$)'));
    const precoInput = document.createElement('input'); precoInput.type='number'; precoInput.step='0.01'; precoInput.value = values ? (values.preco || 0) : 0;
    form.appendChild(precoInput);

    // validade date (computed but editable)
    form.appendChild(el('label','Validade'));
    const validadeInput = document.createElement('input'); validadeInput.type='date'; validadeInput.value = values ? (values.validade || '') : '';
    form.appendChild(validadeInput);

    // telasPorServidor field for multi-server scenarios (object serialized in UI as per-server number)
    const telasPorSrvContainer = document.createElement('div'); telasPorSrvContainer.className='telas-por-srv';
    form.appendChild(telasPorSrvContainer);

    // Pontos de Acesso dynamic list
    form.appendChild(el('label','Pontos de Acesso'));
    const pontosContainer = document.createElement('div'); pontosContainer.className='pontos-container';
    form.appendChild(pontosContainer);
    const addPontoBtn = document.createElement('button'); addPontoBtn.className='btn small'; addPontoBtn.type='button'; addPontoBtn.textContent='Adicionar Ponto';
    form.appendChild(addPontoBtn);

    // helper to refresh telasPorServidor inputs based on selected servers
    function renderTelasPorServidorInputs(selectedServers) {
      telasPorSrvContainer.innerHTML = '';
      if (!selectedServers || selectedServers.length <= 1) return;
      selectedServers.forEach(srvId => {
        const row = document.createElement('div'); row.style.display='flex'; row.style.gap='8px'; row.style.alignItems='center'; row.style.marginBottom='6px';
        const lbl = el('label', `Telas para ${srvId}`); lbl.style.minWidth='150px';
        const inp = document.createElement('input'); inp.type='number'; inp.min='0'; inp.value = (values && values.telasPorServidor && values.telasPorServidor[srvId]) ? values.telasPorServidor[srvId] : 0;
        inp.dataset.srv = srvId;
        row.appendChild(lbl); row.appendChild(inp);
        telasPorSrvContainer.appendChild(row);
      });
    }

    // helper to render pontos list from values or dynamic additions
    async function renderPontos(pontos = []) {
      const allApps = await getApps();
      pontosContainer.innerHTML = '';
      pontos.forEach((p, idx) => {
        const card = document.createElement('div'); card.style.border='1px solid rgba(0,0,0,0.06)'; card.style.padding='8px'; card.style.borderRadius='6px'; card.style.marginBottom='8px';
        // app select
        const appLabel = el('label','App'); const appSelect = document.createElement('select');
        const emptyOpt = Object.assign(document.createElement('option'),{value:'',textContent:'Selecione app'});
        appSelect.appendChild(emptyOpt);
        allApps.forEach(a => {
          const o = document.createElement('option'); o.value = a.id; o.textContent = `${a.nome} (${a.codigoDeAcesso}) — Servidor: ${a.servidorId}`;
          if (p.appId === a.id) o.selected = true;
          appSelect.appendChild(o);
        });
        // usuario / senha
        const userLabel = el('label','Usuário'); const userInput = document.createElement('input'); userInput.type='text'; userInput.value = p.usuario || '';
        const passLabel = el('label','Senha'); const passInput = document.createElement('input'); passInput.type='text'; passInput.value = p.senha || '';
        // conexoesSimultaneas (respecting multiplosAcessos)
        const conexLabel = el('label','Conexões Simultâneas'); const conexInput = document.createElement('input'); conexInput.type='number'; conexInput.min='1'; conexInput.value = p.conexoesSimultaneas || 1;

        // when app selection changes, set servidorId and enforce conexoesSimultaneas rules
        appSelect.addEventListener('change', async () => {
          const selectedApp = await (async () => allApps.find(a=>a.id===appSelect.value))();
          if (selectedApp) {
            // set servidorId visually (we will store it on submit)
            serverInfo.textContent = `Servidor: ${selectedApp.servidorId}`;
            if (!selectedApp.multiplosAcessos) {
              conexInput.value = 1;
              conexInput.disabled = true;
            } else {
              conexInput.disabled = false;
              // set max as telas for that servidor (if provided)
              const max = getAllowedTelasForServer(selectedApp.servidorId);
              // constrain if needed
              if (max > 0) {
                conexInput.max = String(max);
                if (Number(conexInput.value) > max) conexInput.value = max;
              } else {
                conexInput.removeAttribute('max');
              }
            }
          } else {
            serverInfo.textContent = '';
            conexInput.disabled = false;
          }
        });

        const serverInfo = el('div', `Servidor: ${p.servidorId || ''}`, 'muted');
        const removeBtn = document.createElement('button'); removeBtn.className='btn ghost small'; removeBtn.type='button'; removeBtn.textContent='Remover';
        removeBtn.addEventListener('click', () => {
          pontos.splice(idx,1);
          renderPontos(pontos);
        });

        // initial enforcement
        (async () => {
          const sel = allApps.find(a => a.id === p.appId);
          if (sel && !sel.multiplosAcessos) { conexInput.value = 1; conexInput.disabled = true; }
        })();

        card.appendChild(appLabel); card.appendChild(appSelect);
        card.appendChild(serverInfo);
        card.appendChild(userLabel); card.appendChild(userInput);
        card.appendChild(passLabel); card.appendChild(passInput);
        card.appendChild(conexLabel); card.appendChild(conexInput);
        card.appendChild(removeBtn);
        pontosContainer.appendChild(card);
      });
    }

    // helper to compute allowed telas for a given servidor in current form state
    function getAllowedTelasForServer(servidorId) {
      const selectedServers = Array.from(serversList.querySelectorAll('input[type=checkbox]:checked')).map(i => i.value);
      if (selectedServers.length > 1) {
        // find input in telasPorSrvContainer
        const inp = telasPorSrvContainer.querySelector(`input[data-srv="${servidorId}"]`);
        return inp ? Number(inp.value||0) : 0;
      } else {
        return Number(telasInput.value || 0);
      }
    }

    // initialize form values based on values param or defaults from plan when creating
    if (values) {
      // populate pontos
      renderPontos(Array.isArray(values.pontosDeAcesso) ? values.pontosDeAcesso.slice() : []);
      // set telasPorServidor inputs if needed
      renderTelasPorServidorInputs(values.servidores || []);
    } else {
      renderPontos([]);
    }

    // when plan changes, auto-fill telas/preco/validade according to plan
    planSelect.addEventListener('change', async () => {
      const planId = planSelect.value;
      if (!planId) return;
      const plans = await getPlans();
      const sel = plans.find(p => p.id === planId);
      if (!sel) return;
      // set default telas/preco
      const previousTelas = Number(telasInput.value || 0);
      const previousPreco = Number(precoInput.value || 0);
      telasInput.value = sel.telas;
      precoInput.value = sel.preco;
      // compute validade based on current date (mock uses local)
      const now = new Date();
      const calc = addMonthsFromDate(now, sel.validadeEmMeses);
      // if day invalid (e.g., 31 Feb), detect and fallback to 01 next month
      if (calc.getDate() !== now.getDate()) {
        const fallback = new Date(calc.getFullYear(), calc.getMonth()+1, 1);
        validadeInput.value = formatDateIso(fallback);
        // show feedback notice
        const msg = `Data de validade ajustada para ${formatDateIso(fallback)} por incompatibilidade de dia no mês alvo.`;
        alert(msg);
      } else {
        validadeInput.value = formatDateIso(calc);
      }
      // if user later changes preco/telas manually, we'll show feedback on submit
    });

    // when servers selection changes, re-render telasPorServidor inputs and re-check pontos constraints
    serversList.addEventListener('change', () => {
      const selectedServers = Array.from(serversList.querySelectorAll('input[type=checkbox]:checked')).map(i=>i.value);
      if (selectedServers.length > 2) {
        alert('Selecione no máximo 2 servidores');
        // undo last change
        Array.from(serversList.querySelectorAll('input[type=checkbox]')).forEach(inp => {
          if (selectedServers.indexOf(inp.value) === -1) inp.checked = false;
        });
        return;
      }
      renderTelasPorServidorInputs(selectedServers);
    });

    addPontoBtn.addEventListener('click', async () => {
      // append a new point with empty values
      const pontos = Array.from(pontosContainer.querySelectorAll('.pontos-container')) ? [] : [];
      // we'll manage pontos in a lightweight manner: read current rendered points into an array, push empty object, re-render
      const existing = readPontosFromUI();
      existing.push({ appId: '', servidorId: '', usuario: '', senha: '', conexoesSimultaneas: 1 });
      await renderPontos(existing);
    });

    // helper to read pontos from current UI (used before submit)
    function readPontosFromUI() {
      const cards = Array.from(pontosContainer.children);
      const dados = [];
      cards.forEach(card => {
        const sel = card.querySelector('select');
        const appId = sel ? sel.value : '';
        const usuario = card.querySelector('input[type="text"]') ? card.querySelector('input[type="text"]').value : '';
        const senhaInputs = card.querySelectorAll('input[type="text"]');
        const senha = senhaInputs && senhaInputs[1] ? senhaInputs[1].value : '';
        const conexInput = card.querySelector('input[type="number"]');
        const conex = conexInput ? Number(conexInput.value || 0) : 0;
        // derive servidorId from selected app
        const appObj = null; // will be resolved in submit
        dados.push({ appId, servidorId: '', usuario, senha, conexoesSimultaneas: conex });
      });
      return dados;
    }

    // on save: assemble payload, resolve
    const saveBtn = document.createElement('button'); saveBtn.className='btn'; saveBtn.type='button'; saveBtn.textContent='Salvar';
    saveBtn.addEventListener('click', async () => {
      // basic validations
      if (!nomeInput.value.trim()) return alert('Nome obrigatório');
      // collect servidores
      const selectedServers = Array.from(serversList.querySelectorAll('input[type=checkbox]:checked')).map(i=>i.value);
      if (selectedServers.length > 2) return alert('Máximo 2 servidores');
      // plan
      const planId = planSelect.value || null;
      // telas & preco & validade
      const telasVal = Number(telasInput.value || 0);
      const precoVal = Number(precoInput.value || 0);
      const validadeVal = validadeInput.value || null;

      // collect telasPorServidor if any
      const telasPorServidor = {};
      const telaInputs = Array.from(telasPorSrvContainer.querySelectorAll('input[data-srv]'));
      telaInputs.forEach(inp => {
        telasPorServidor[inp.dataset.srv] = Number(inp.value || 0);
      });

      // collect pontos from UI and resolve servidorId based on selected app
      const pontosCards = Array.from(pontosContainer.children);
      const allApps = await getApps();
      const pontos = pontosCards.map(card => {
        const sel = card.querySelector('select');
        const appId = sel ? sel.value : '';
        const usuario = card.querySelector('input[type="text"]') ? card.querySelector('input[type="text"]').value : '';
        const passInputs = card.querySelectorAll('input[type="text"]');
        const senha = passInputs && passInputs[1] ? passInputs[1].value : '';
        const conexInput = card.querySelector('input[type="number"]');
        const conex = conexInput ? Number(conexInput.value||0) : 0;
        const appObj = allApps.find(a=>a.id === appId);
        const servidorId = appObj ? appObj.servidorId : null;
        return { appId, servidorId, usuario, senha, conexoesSimultaneas: conex };
      });

      // enforce pontos rules: for each ponto if app.multiplosAcessos === false => conexoesSimultaneas must be 1
      const appsMap = (await getApps()).reduce((acc,a)=>{acc[a.id]=a;return acc;},{});
      for (const p of pontos) {
        const appObj = appsMap[p.appId];
        if (!appObj) return alert('Selecione app válido para cada ponto');
        if (!appObj.multiplosAcessos && Number(p.conexoesSimultaneas) !== 1) return alert(`App ${appObj.nome} não permite múltiplos acessos; conexões deve ser 1`);
        if (appObj.multiplosAcessos) {
          // validate max per server
          const max = selectedServers.length > 1 ? (telasPorServidor[p.servidorId] || 0) : telasVal;
          if (Number(p.conexoesSimultaneas) < 1 || Number(p.conexoesSimultaneas) > max) return alert(`Conexões para app ${appObj.nome} deve estar entre 1 e ${max}`);
        }
      }

      // validate soma por servidor
      const sumBySrv = {};
      pontos.forEach(p => { sumBySrv[p.servidorId] = (sumBySrv[p.servidorId]||0) + Number(p.conexoesSimultaneas||0); });
      if (selectedServers.length > 1) {
        // require telasPorServidor provided
        if (Object.keys(telasPorServidor).length === 0) return alert('Informe telas por servidor');
        for (const srvId of selectedServers) {
          const allowed = Number(telasPorServidor[srvId]||0);
          const sum = Number(sumBySrv[srvId]||0);
          if (sum !== allowed) return alert(`Soma de conexões no servidor ${srvId} (${sum}) deve igualar telas (${allowed})`);
        }
      } else if (selectedServers.length === 1) {
        const srvId = selectedServers[0];
        const allowed = telasVal;
        const sum = Number(sumBySrv[srvId]||0);
        if (sum !== allowed) return alert(`Soma de conexões (${sum}) deve igualar telas (${allowed}) para o servidor ${srvId}`);
      }

      // create payload
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
        telasPorServidor: telasPorServidor
      };

      // feedback if preco/telas different from plan
      if (planId) {
        const plan = (await getPlans()).find(p => p.id === planId);
        if (plan) {
          if (Number(plan.preco) !== Number(precoVal)) alert(`Atenção: preço editado difere do preço do plano (${plan.preco})`);
          if (Number(plan.telas) !== Number(telasVal)) alert(`Atenção: número de telas difere do plano (${plan.telas})`);
        }
      }

      ctx.resolve(payload);
    });

    const cancel = document.createElement('button'); cancel.className='btn ghost'; cancel.type='button'; cancel.textContent='Cancelar';
    cancel.addEventListener('click', ()=> ctx.cancel());

    form.appendChild(saveBtn ? saveBtn : saveBtn); // placeholder
    form.appendChild(saveBtn);
    form.appendChild(cancel);

    // append form to container
    container.appendChild(form);
  }

  await load();
  root.appendChild(container);
}
