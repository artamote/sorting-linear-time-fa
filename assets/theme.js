const themeButton = document.querySelector('.theme-toggle');
const themeMedia = window.matchMedia('(prefers-color-scheme: dark)');

function updateThemeButton() {
  const dark = document.documentElement.dataset.theme === 'dark';
  themeButton.setAttribute('aria-pressed', String(dark));
  themeButton.textContent = dark ? 'حالت روشن' : 'حالت تیره';
}

themeButton.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('sorting-theme', next); } catch { /* Storage may be unavailable. */ }
  updateThemeButton();
});

themeMedia.addEventListener('change', event => {
  try {
    if (localStorage.getItem('sorting-theme')) return;
  } catch { return; }
  document.documentElement.dataset.theme = event.matches ? 'dark' : 'light';
  updateThemeButton();
});

updateThemeButton();
