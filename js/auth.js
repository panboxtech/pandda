// js/auth.js
// Lógica de autenticação separada; usa mock por enquanto.
// Comentários indicam onde substituir por Supabase (ex: supabase.auth.signInWithPassword).

const USERS = [
  { id: 'u1', email: 'master@pandda.local', role: 'master', password: 'master' },
  { id: 'u2', email: 'comum@pandda.local', role: 'comum', password: 'comum' }
];

// Inicializa a lógica na página de login (index.html)
export function initAuthOnLoginPage() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const feedback = document.getElementById('loginFeedback');
  const demoBtn = document.getElementById('demoBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setFeedback('Tentando autenticar...');
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    try {
      const user = await mockSignIn(email, password);
      setFeedback('Login bem sucedido. Redirecionando...');
      localStorage.setItem('pandda_session', JSON.stringify({ id: user.id, email: user.email, role: user.role }));
      window.location.href = 'dashboard.html';
    } catch (err) {
      setFeedback(err.message, true);
    }
  });

  demoBtn.addEventListener('click', () => {
    emailInput.value = 'comum@pandda.local';
    passwordInput.value = 'comum';
    setFeedback('Credenciais preenchidas para demo');
  });

  function setFeedback(msg, isError = false) {
    feedback.textContent = msg;
    feedback.className = isError ? 'feedback error' : 'feedback';
  }
}

// Funções utilitárias para uso no dashboard
export function signOut() {
  localStorage.removeItem('pandda_session');
  window.location.href = './index.html';
}

export function getSession() {
  const raw = localStorage.getItem('pandda_session');
  return raw ? JSON.parse(raw) : null;
}

// Mock sign in; substituir por Supabase quando integrar
async function mockSignIn(email, password) {
  await new Promise(r => setTimeout(r, 300));
  const u = USERS.find(x => x.email === email && x.password === password);
  if (!u) throw new Error('Credenciais inválidas');
  return { id: u.id, email: u.email, role: u.role };
}

// Auto-initialize on index.html
if (document.body.classList.contains('page-login')) {
  initAuthOnLoginPage();
}
