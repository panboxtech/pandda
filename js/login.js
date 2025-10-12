// login.js - atualizado para injetar a sidebar APENAS após login
document.getElementById('toggleEye')?.addEventListener('click', ()=>{
  const p = document.getElementById('loginPass');
  if (!p) return;
  p.type = p.type === 'password' ? 'text' : 'password';
});

document.getElementById('btnLogin')?.addEventListener('click', async (e)=>{
  // mock auth - qualquer credencial
  // injetar sidebar e carregar página de clientes
  if (window.app && typeof window.app.injectSidebar === 'function') {
    window.app.injectSidebar();
  }
  if (window.app && typeof window.app.loadView === 'function') {
    await window.app.loadView('views/clientes.html');
  }
});
