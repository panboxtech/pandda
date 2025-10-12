// js/login.js - versão de debug
(function(){
  console.log('[login] script carregado');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[login] DOMContentLoaded');
    const form = document.getElementById('loginForm');
    const btn = document.getElementById('loginSubmit');
    if (!form) {
      console.warn('[login] #loginForm não encontrado');
      return;
    }
    console.log('[login] form encontrado, ligando submit');
    form.addEventListener('submit', function(ev){
      ev.preventDefault();
      console.log('[login] submit capturado');
      btn && (btn.disabled = true);
      const email = form.querySelector('input[name="email"]')?.value || '';
      const senha = form.querySelector('input[name="senha"]')?.value || '';
      console.log('[login] credenciais', { email, senhaPresent: !!senha });
      // simula sucesso
      setTimeout(() => {
        console.log('[login] simulando sucesso, chamando afterLogin se existir');
        if (window.app && typeof window.app.afterLogin === 'function') {
          window.app.afterLogin();
        } else {
          console.warn('[login] window.app.afterLogin não encontrada');
        }
        btn && (btn.disabled = false);
      }, 100);
    });
  });
})();
