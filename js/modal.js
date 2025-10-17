// js/modal.js
const modalRoot = document.getElementById('modalRoot');

export function openFormModal({ title = 'Form', renderForm, onConfirm, onCancel }) {
  return new Promise((resolve, reject) => {
    modalRoot.innerHTML = '';
    modalRoot.classList.add('active');
    modalRoot.setAttribute('aria-hidden', 'false');

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.addEventListener('click', () => close(false));

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    const h = document.createElement('h3');
    h.textContent = title;
    modal.appendChild(h);

    const formContainer = document.createElement('div');
    modal.appendChild(formContainer);

    renderForm(formContainer, {
      resolve: (data) => {
        if (onConfirm) {
          Promise.resolve(onConfirm(data)).then(res => {
            close(true);
            resolve(res);
          }).catch(err => {
            const errEl = formContainer.querySelector('.form-error') || document.createElement('div');
            errEl.className = 'form-error';
            errEl.textContent = err.message || String(err);
            formContainer.appendChild(errEl);
          });
        } else {
          close(true);
          resolve(data);
        }
      },
      cancel: () => close(false)
    });

    const footer = document.createElement('div');
    footer.style.marginTop = '12px';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn ghost small';
    cancelBtn.textContent = 'Fechar';
    cancelBtn.addEventListener('click', () => close(false));
    footer.appendChild(cancelBtn);
    modal.appendChild(footer);

    modalRoot.appendChild(overlay);
    modalRoot.appendChild(modal);

    function close(ok) {
      modalRoot.classList.remove('active');
      modalRoot.setAttribute('aria-hidden', 'true');
      modalRoot.innerHTML = '';
      if (!ok) {
        if (onCancel) onCancel();
        reject(new Error('cancelled'));
      }
    }
  });
}
