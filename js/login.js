// js/login.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const submitBtn = document.getElementById('loginSubmit');

  if (!form) {
    console.warn('login.js: form #loginForm não encontrado');
    return;
  }

  function log(msg, obj) {
    console.log('[login]', msg, obj || '');
  }

  async function handleSuccess() {
    log('Login bem sucedido — chamando window.app.afterLogin');
    if (window.app && typeof window.app.afterLogin === 'function') {
      try {
        await window.app.afterLogin();
      } catch(e) {
        console.error('afterLogin erro:', e);
      }
    } else {
      console.warn('afterLogin não encontrado em window.app');
    }
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    submitBtn && (submitBtn.disabled = true);

    const email = form.querySelector('input[name="email"]')?.value || '';
    const senha = form.querySelector('input[name="senha"]')?.value || '';

    log('Tentativa de login', { email, temSenha: !!senha });

    try {
      // validação simples de protótipo
      if (!email.trim() || !senha.trim()) {
        alert('Preencha email e senha');
        return;
      }

      // Aqui você faria chamada ao backend; no protótipo aceitamos qualquer credencial não vazia
      await new Promise(r => setTimeout(r, 120)); // simula leve delay
      await handleSuccess();
    } catch(err) {
      console.error('Erro no processo de login:', err);
      alert('Erro ao logar, veja console.');
    } finally {
      submitBtn && (submitBtn.disabled = false);
    }
  });
});
