const form = document.getElementById('loginForm');
const message = document.getElementById('loginMessage');
const submitBtn = form.querySelector('.login-submit');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  message.textContent = '';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Entering…';

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      // Server has set an HttpOnly session cookie. Redirect into the app;
      // the middleware on /.../tools/ verifies the cookie server-side.
      window.location.href = '/.../tools/';
      return;
    }

    message.textContent = 'Access denied.';
  } catch (err) {
    message.textContent = 'Access denied.';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Enter';
  }
});
