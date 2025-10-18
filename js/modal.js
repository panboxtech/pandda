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
// Melhorias: adiciona atributos ARIA, garante remoção do nodo do DOM no fechamento,
// e não deixa elementos invisíveis bloqueando interação.

export function openFormModal(options = {}) {
  const { title = '', renderForm, onConfirm } = options;

  return new Promise((resolve, reject) => {
    // criar estrutura do modal
    const modalRoot = document.createElement('div');
    modalRoot.className = 'modal-root'; // sem active inicialmente
    modalRoot.setAttribute('role', 'dialog');
    modalRoot.setAttribute('aria-modal', 'true');

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
    closeBtn.setAttribute('aria-label', 'Fechar modal');
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

    // append to body (invisível até ativar)
    document.body.appendChild(modalRoot);

    // ativar modal (aplica classe active que exibe e habilita pointer-events)
    // usa setTimeout para garantir pintura antes de setar focus
    requestAnimationFrame(() => {
      modalRoot.classList.add('active');
      // move focus to modal for accessibility
      try { modal.focus(); } catch (e) {}
    });

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
        const maybe = (async () => {
          try {
            if (typeof onConfirm === 'function') {
              await onConfirm(data);
            }
            closeModal();
            resolve(data);
          } catch (err) {
            // do not close modal; surface error to caller
            reject(err);
          }
        })();
        return maybe;
      },
      cancel: (reason) => {
        closeModal();
        reject(reason || new Error('cancelled'));
      },
      _registerCleanup: registerCleanup
    };

    // close actions
    function closeModal() {
      // run cleanup first (observers, intervals, etc)
      try { runCleanup(); } catch (err) {}
      // remove DOM node if still attached
      try {
        if (modalRoot && modalRoot.parentNode) {
          // visual hide before removal to avoid flicker
          modalRoot.classList.remove('active');
          // allow CSS transition to finish if any, then remove
          // use setTimeout 150ms which is small; safe fallback to immediate removal if needed
          setTimeout(() => {
            if (modalRoot && modalRoot.parentNode) modalRoot.parentNode.removeChild(modalRoot);
          }, 150);
        }
      } catch (err) {
        try { if (modalRoot && modalRoot.parentNode) modalRoot.parentNode.removeChild(modalRoot); } catch (_) {}
      }
    }

    // wire close button and overlay click to cancel
    function onCloseClick() { ctx.cancel(); }
    closeBtn.addEventListener('click', onCloseClick);
    overlay.addEventListener('click', onCloseClick);
    registerCleanup(() => {
      closeBtn.removeEventListener('click', onCloseClick);
      overlay.removeEventListener('click', onCloseClick);
    });

    // trap keyboard ESC to close
    function onKeyDown(e) {
      if (e.key === 'Escape') ctx.cancel();
    }
    document.addEventListener('keydown', onKeyDown);
    registerCleanup(() => document.removeEventListener('keydown', onKeyDown));

    // render form
    try {
      if (typeof renderForm === 'function') {
        renderForm(content, ctx);
      } else {
        content.appendChild(document.createTextNode('Nenhum renderForm fornecido'));
      }
    } catch (err) {
      // Erro ao renderizar o form: cleanup e rejeitar
      runCleanup();
      try { if (modalRoot && modalRoot.parentNode) modalRoot.parentNode.removeChild(modalRoot); } catch {}
      reject(err);
    }
  });
}
