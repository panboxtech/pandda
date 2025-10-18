// js/forms/clientForm.js
// Formulário de cliente reutilizável (criação e edição).
// Exporta renderClientForm(container, ctx, values)

import { getPlans, getServers, getApps } from '../mockData.js';

function el(tag, text, className) { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (className) e.className = className; return e; }
function formatDateIso(d) { if (!d) return ''; const dt = new Date(d); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`; }
function addMonthsFromDateUTC(date, months) { const d = new Date(date.getTime()); const targetMonth = d.getUTCMonth() + months; return new Date(Date.UTC(d.getUTCFullYear(), targetMonth, d.getUTCDate())); }

function validateConnectionsPerServer({ servidores = [], pontosDeAcesso = [], telas = 0 }) {
  const map = {}; servidores.forEach(s => map[s] = 0);
  pontosDeAcesso.forEach(p => { if (p.servidorId) map[p.servidorId] = (map[p.servidorId]||0) + Number(p.conexoesSimultaneas||0); });
  const details = servidores.map(srv => ({ servidorId: srv, sum: map[srv]||0, expected: Number(telas) }));
  return { ok: details.every(d => d.sum === d.expected), details };
}

export async function renderClientForm(container, ctx, values = null) {
  container.innerHTML = '';
  const form = document.createElement('div'); form.className = 'entity-form';

  const messageBox = document.createElement('div'); messageBox.className = 'form-message'; form.appendChild(messageBox);

  // Campos básicos
  form.appendChild(el('label','Nome')); const nomeInput = document.createElement('input'); nomeInput.type='text'; nomeInput.value = values?.nome||''; form.appendChild(nomeInput);
  form.appendChild(el('label','Telefone')); const phoneInput = document.createElement('input'); phoneInput.type='text'; phoneInput.value = values?.phone||''; form.appendChild(phoneInput);
  form.appendChild(el('label','Email')); const emailInput = document.createElement('input'); emailInput.type='email'; emailInput.value = values?.email||''; form.appendChild(emailInput);

  // Servidores
  form.appendChild(el('label','Servidores (máx 2)'));
  const serversList = document.createElement('div'); serversList.className = 'servers-list';
  const servers = await getServers();
  servers.forEach(srv => {
    const wrap = document.createElement('label'); wrap.style.display='inline-flex'; wrap.style.gap='6px'; wrap.style.marginRight='12px';
    const ch = document.createElement('input'); ch.type='checkbox'; ch.value = srv.id;
    if (values?.servidores?.includes(srv.id)) ch.checked = true;
    wrap.appendChild(ch); wrap.appendChild(document.createTextNode(srv.nome));
    serversList.appendChild(wrap);
  });
  form.appendChild(serversList);

  // Plano
  form.appendChild(el('label','Plano'));
  const planSelect = document.createElement('select'); planSelect.appendChild(Object.assign(document.createElement('option'),{value:'',textContent:'Selecione plano'}));
  const plans = await getPlans();
  plans.forEach(p => { const o=document.createElement('option'); o.value=p.id; o.textContent=`${p.nome} — ${p.telas} telas — R$${p.preco}`; if(values?.planoId===p.id) o.selected=true; planSelect.appendChild(o); });
  form.appendChild(planSelect);

  // Telas, Preço, Validade
  form.appendChild(el('label','Telas (por servidor)')); const telasInput=document.createElement('input'); telasInput.type='number'; telasInput.min='1'; telasInput.value=values?.telas||1; form.appendChild(telasInput);
  form.appendChild(el('label','Preço (R$)')); const precoInput=document.createElement('input'); precoInput.type='number'; precoInput.step='0.01'; precoInput.value=values?.preco||0; form.appendChild(precoInput);
  form.appendChild(el('label','Validade')); const validadeInput=document.createElement('input'); validadeInput.type='date'; validadeInput.value=values?.validade||''; form.appendChild(validadeInput);

  const serversIndicators = document.createElement('div'); serversIndicators.className='servers-indicators'; form.appendChild(serversIndicators);

  // Pontos de Acesso
  form.appendChild(el('label','Pontos de Acesso'));
  const pontosContainer=document.createElement('div'); pontosContainer.className='pontos-container'; form.appendChild(pontosContainer);
  const addPontoBtn=document.createElement('button'); addPontoBtn.className='btn small'; addPontoBtn.type='button'; addPontoBtn.textContent='Adicionar Ponto'; form.appendChild(addPontoBtn);

  // Helpers
  function getSelectedServers(){ return Array.from(serversList.querySelectorAll('input[type=checkbox]:checked')).map(i=>i.value); }
  function readPontosFromUI(){ const cards=Array.from(pontosContainer.children); return cards.map(card=>{ const sel=card.querySelector('select'); const appId=sel?sel.value:''; const inputs=card.querySelectorAll('input[type="text"]'); const usuario=inputs[0]?.value||''; const senha=inputs[1]?.value||''; const conex=Number(card.querySelector('input[type="number"]')?.value||0); return {appId,servidorId:null,usuario,senha,conexoesSimultaneas:conex}; }); }
  async function resolvePontosWithServerIds(raw){ const apps=await getApps(); return raw.map(p=>({...p,servidorId:apps.find(a=>a.id===p.appId)?.servidorId||null})); }

  async function renderPontos(pontos=[]){ const apps=await getApps(); pontosContainer.innerHTML=''; pontos.forEach((p,idx)=>{ const card=document.createElement('div'); card.className='ponto-card'; card.style.border='1px solid rgba(0,0,0,0.06)'; card.style.padding='8px'; card.style.marginBottom='8px'; card.style.borderRadius='6px';
    const appSelect=document.createElement('select'); appSelect.appendChild(Object.assign(document.createElement('option'),{value:'',textContent:'Selecione app'})); apps.forEach(a=>{ const o=document.createElement('option'); o.value=a.id; o.textContent=`${a.nome} — ${a.codigoDeAcesso} — srv:${a.servidorId}`; if(p.appId===a.id) o.selected=true; appSelect.appendChild(o); });
    const srvInfo=el('div',p.servidorId?`Servidor: ${p.servidorId}`:'','muted');
    const userInput=document.createElement('input'); userInput.type='text'; userInput.value=p.usuario||''; const passInput=document.createElement('input'); passInput.type='text'; passInput.value=p.senha||''; const conexInput=document.createElement('input'); conexInput.type='number'; conexInput.min='1'; conexInput.value=p.conexoesSimultaneas||1;
    const removeBtn=document.createElement('button'); removeBtn.className='btn ghost small'; removeBtn.type='button'; removeBtn.textContent='Remover'; removeBtn.addEventListener('click',async()=>{const cur=readPontosFromUI();cur.splice(idx,1);await renderPontos(cur);updateIndicators();});
    appSelect.addEventListener('change',()=>{const sel=apps.find(a=>a.id===appSelect.value); if(sel){srvInfo.textContent=`Servidor: ${sel.servidorId}`; if(!sel.multiplosAcessos){conexInput.value=1;conexInput.disabled=true;} else conexInput.disabled=false;} else {srvInfo.textContent=''; conexInput.disabled=false;} updateIndicators();});
    card.appendChild(el('label','App')); card.appendChild(appSelect); card.appendChild(srvInfo);
    card.appendChild(el('label','Usuário')); card.appendChild(userInput); card.appendChild(el('label','Senha')); card.appendChild(passInput);
    card.appendChild(el('label','Conexões Simultâneas')); card.appendChild(conexInput); card.appendChild(removeBtn);
    pontosContainer.appendChild(card); }); }

  async function updateIndicators(){ const selected=getSelectedServers(); serversIndicators.innerHTML=''; const pontos
