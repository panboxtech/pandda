// js/login.js - atualiza fluxo de login para injetar sidebar APENAS após login e mostrar topbar
document.getElementById('toggleEye')?.addEventListener('click', ()=>{
  const p = document.getElementById('loginPass'); if (!p) return; p.type = p.type === 'password' ? 'text' : 'password';
});

document.getElementById('btnLogin')?.addEventListener('click', async ()=>{
  // mock auth
  if (window.app && typeof window.app.injectSidebar === 'function') {
    window.app.injectSidebar(); // injetar menu lateral
  }
  if (window.app && typeof window.app.showShell === 'function') {
    window.app.showShell(); // mostrar topbar e ajustar content
  }
  if (window.app && typeof window.app.loadView === 'function') {
    await window.app.loadView('views/clientes.html');
  }
});
