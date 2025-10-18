// js/modal.js
// Modal simples usado pelos forms. API:
//   openFormModal({ title, renderForm(container, ctx), onConfirm(data) })
// Retorna uma Promise que resolve quando ctx.resolve(payload) é chamado pelo form,
// ou rejeita quando ctx.cancel() é chamado (ou modal fechado).
//
// O modal garante cleanup de listeners, MutationObservers e timers registrados
// através do ctx._registerCleanup(fn). Isso evita intervals/observers persistindo
// após fechamento do modal.
//
// Comentários para Supabase/integracao:
// - Esta é apenas a camada de UI. Ao migrar para chamadas assíncronas que podem
//   demorar (ex: supabase rpc/insert), prefira usar onConfirm/await dentro do
//   openFormModal caller para exibir estado de "salvando" e impedir fechamento.

export function openFormModal(options = {}) {
  const { title = '', renderForm, onConfirm } = options;

  return new Promise((resolve, reject) => {
    // criar estrutura do modal
    const modalRoot = document.createElement('div');
    modalRoot.className = 'modal-root active';

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    modalRoot.appendChild(overlay);

    const modal = document.createElement('div');
    modal.className = 'modal';
    modalRoot.appendChild(modal);

    // header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '8px';

    const h = document.createElement('h3');
    h.textContent = title || '';
    h.style.margin = '0';
    header.appendChild(h);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'icon-btn';
    closeBtn.innerHTML = '✕';
    closeBtn.title = 'Fechar';
    header.appendChild(closeBtn);

    modal.appendChild(header);

    // container onde o form será renderizado
    const content = document.createElement('div');
    content.className = 'modal-content';
    modal.appendChild(content);

    // footer (opcional)
    const footer = document.createElement('div');
    footer.style.marginTop = '12px';
    footer.style.display = 'flex';
    footer.style.justifyContent = 'flex-end';
    modal.appendChild(footer);

    // append to body
    document.body.appendChild(modalRoot);

    // housekeeping for cleanup
    const cleanupFns = new Set();
    function registerCleanup(fn) {
      if (typeof fn === 'function') cleanupFns.add(fn);
      return () => cleanupFns.delete(fn);
    }
    function runCleanup() {
      cleanupFns.forEach(fn => {
        try { fn(); } catch (_) {}
      });
      cleanupFns.clear();
    }

    // context passed to renderForm so form can resolve/cancel and register cleanup tasks
    const ctx = {
      resolve: (data) => {
        // delegate to onConfirm if provided and it's async; wait it before closing
        const maybe = (async () => {
          try {
            if (typeof onConfirm === 'function') {
              // allow onConfirm to throw to block closure
              await onConfirm(data);
            }
            closeModal();
            resolve(data);
          } catch (err) {
            // keep modal open and surface error to form if wanted (form should handle displays)
            // also reject promise to callers that awaited openFormModal().catch()
            // but we choose to reject to surface error to caller
            reject(err);
          }
        })();
        return maybe;
      },
      cancel: (reason) => {
        closeModal();
        reject(reason || new Error('cancelled'));
      },
      // internal helper for forms to register observers/intervals for cleanup on close
      _registerCleanup: registerCleanup
    };

    // close actions
    function closeModal() {
      // run cleanup first (observers, intervals, etc)
      try { runCleanup(); } catch (err) {}
      // remove DOM
      if (modalRoot && modalRoot.parentNode) modalRoot.parentNode.removeChild(modalRoot);
    }

    // wire close button and overlay click to cancel
    function onCloseClick() { ctx.cancel(); }
    closeBtn.addEventListener('click', onCloseClick);
    overlay.addEventListener('click', onCloseClick);
    registerCleanup(() => {
      closeBtn.removeEventListener('click', onCloseClick);
      overlay.removeEventListener('click', onCloseClick);
    });

    // render form
    try {
      if (typeof renderForm === 'function') {
        // Passamos ctx para que o form possa chamar ctx.resolve / ctx.cancel
        renderForm(content, ctx);
      } else {
        content.appendChild(document.createTextNode('Nenhum renderForm fornecido'));
      }
    } catch (err) {
      // Erro ao renderizar o form: cleanup e rejeitar
      runCleanup();
      if (modalRoot && modalRoot.parentNode) modalRoot.parentNode.removeChild(modalRoot);
      reject(err);
    }
  });
}
