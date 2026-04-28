// Wire up the frontEnd to the backend endpoints in ../server.js

// Hide Register when doing log-in
function showLogin() {
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('register-form').style.display = 'none';
  document.getElementById('login-tab').classList.add('active');
  document.getElementById('register-tab').classList.remove('active');
}

// hide Log in form when registering
function showRegister() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'block';
  document.getElementById('register-tab').classList.add('active');
  document.getElementById('login-tab').classList.remove('active');
}


async function login() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  // Hit the /login endpoint in Server.js
  const response = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  // req.body will be the email and the password
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (response.ok) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);

    if (data.role === 'barber') {
	// tell browser to navigate to the barber dashboard
      window.location.href = '/barber-dashboard.html';
    } else {
	// tell browser to naviage to the customer dashboard
      window.location.href = '/customer-dashboard.html';
    }
  } else {
    document.getElementById('message').textContent = data.error;
  }
}

async function register() {
  const first_name = document.getElementById('register-first-name').value;
  const last_name = document.getElementById('register-last-name').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const role = document.getElementById('register-role').value;

// git the /register endpoint
  const response = await fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ first_name, last_name, email, password, role })
  });

  const data = await response.json();

  if (response.ok) {
    document.getElementById('message').textContent = 'Account created! You can now log in.';
    showLogin();
  } else {
    document.getElementById('message').textContent = data.error;
  }
}
