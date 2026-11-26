(() => {
  'use strict';
  const form = document.querySelector('#login-form');
  const password = document.querySelector('#password');
  const error = document.querySelector('#login-error');
  const toggle = document.querySelector('#password-toggle');
  const submit = form.querySelector('button[type="submit"]');
  const PASSWORD = 'TIBFUNDAMENTAL';

  if (localStorage.getItem('tib-access') === 'yes') {
    window.location.replace('story.html');
    return;
  }

  toggle.addEventListener('click', () => {
    const visible = password.type === 'text';
    password.type = visible ? 'password' : 'text';
    toggle.textContent = visible ? 'Lihat' : 'Sembunyikan';
    toggle.setAttribute('aria-label', visible ? 'Tampilkan password' : 'Sembunyikan password');
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    error.textContent = '';
    if (password.value !== PASSWORD) {
      error.textContent = 'Password belum tepat. Coba periksa lagi, ya.';
      return;
    }
    localStorage.setItem('tib-access', 'yes');
    window.location.href = 'story.html';
  });
})();
