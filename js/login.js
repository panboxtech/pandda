// js/login.js
// Usa delegation para capturar submit mesmo quando a view é injetada
// e um observer de fallback para ligar diretamente quando o form for inserido.
(function(){
  console.log('[login] script carregado');

  function handleLoginSubmit(ev){
    const form = ev.target;
    if (!form || form.id !== 'loginForm') return;
    ev.preventDefault();
    console.log('[login] submit capturado (delegation)');

    const submitBtn = form.querySelector('#loginSubmit');
    submitBtn && (submitBtn.disabled = true);

    const email = form.querySelector('input[name="email"]')?.value || '';
    const senha = form.querySelector('input[name="senha"]')?.value || '';
    console.log('[login] credenciais', { email, senhaPresent: !!senha });

    // validação simples de protótipo
    if (!email.trim() || !senha.trim()) {
      alert('Preencha email e senha');
      submitBtn && (submitBtn.disabled = false);
      return;
    }

    // simula sucesso e chama afterLogin
    setTimeout(async () => {
      console.log('[login] simulando sucesso, chamando afterLogin se existir');
      try {
        if (window.app && typeof window.app.afterLogin === 'function') {
          await window.app.afterLogin();
        } else {
          console.warn('[login] window.app.afterLogin não encontrada');
        }
      } catch(err){
        console.error('[login] erro em afterLogin', err);
      } finally {
        submitBtn && (submitBtn.disabled = false);
      }
    }, 80);
  }

  // Delegation: captura qualquer submit no document
  document.addEventListener('submit', handleLoginSubmit, true);

  // Fallback: se o form for injetado depois e você preferir bind direto, observer liga evento direto
  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const n of m.addedNodes) {
        if (!(n instanceof HTMLElement)) continue;
        const directForm = n.id === 'loginForm' ? n : n.querySelector?.('#loginForm');
        if (directForm) {
          console.log('[login] form detectado via MutationObserver');
          // garante que o form já não tenha listener duplicado (delegation já cobre, mas mantemos bind direto minimal)
          if (!directForm.__loginBound) {
            directForm.__loginBound = true;
            // opcional: adiciona listener direto (não obrigatório porque delegation já faz)
            directForm.addEventListener('submit', function(ev){
              // deixar a lógica para delegation; apenas logamos aqui se executar
              console.log('[login] submit direto (observer) capturado');
            });
          }
          // não precisamos continuar observando se já encontrou o form
          // mas mantemos o observer ativo caso o form seja removido e reinserido
        }
      }
    }
  });

  mo.observe(document.body, { childList: true, subtree: true });

  // Info útil para debugging
  console.log('[login] listener de submit via delegation ativo');
})();
