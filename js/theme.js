// js/theme.js
const THEME_KEY = 'pandda_theme';
const themeToggle = document.getElementById('themeToggle'); // pode ser undefined
const mobileThemeToggle = document.getElementById('mobileThemeToggle'); // mobile topbar
const desktopFloating = document.getElementById('desktopThemeFloating'); // novo botão flutuante

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  localStorage.setItem(THEME_KEY, theme);
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'light';
  applyTheme(saved);
}

function toggleTheme() {
  const current = localStorage.getItem(THEME_KEY) || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

initTheme();

// ligar eventos se os botões existirem
if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
if (mobileThemeToggle) mobileThemeToggle.addEventListener('click', toggleTheme);
if (desktopFloating) desktopFloating.addEventListener('click', toggleTheme);

export { applyTheme, toggleTheme };
