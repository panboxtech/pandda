// login.js - simples
document.getElementById('toggleEye')?.addEventListener('click', ()=>{
  const p = document.getElementById('loginPass');
  if (!p) return;
  p.type = p.type === 'password' ? 'text' : 'password';
});

document.getElementById('btnLogin')?.addEventListener('click', async (e)=>{
  // mock auth - qualquer credencial
  // injetar sidebar e carregar clientes
  window.app.injectSidebar();
  await window.app.loadView('views/clientes.html');
});
