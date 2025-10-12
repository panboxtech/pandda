/* js/login.js
   - agora define initLogin() to follow convention
*/
function initLogin(){
  // reveal/hide password
  document.getElementById('toggleEye')?.addEventListener('click', ()=>{
    const p = document.getElementById('loginPass');
    if (!p) return;
    p.type = p.type === 'password' ? 'text' : 'password';
  });

  document.getElementById('btnLogin')?.addEventListener('click', async ()=>{
    // mock auth
    if (window.app && typeof window.app.injectSidebar === 'function') window.app.injectSidebar();
    // after injecting the sidebar, load clientes is done by injectSidebar
  });
}
// expose for loader
window.initLogin = initLogin;
// also call immediately if script executed after view injection
if (document.readyState !== 'loading') initLogin();
