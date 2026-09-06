// //These are the sample admin credentials (for testing purposes only) should be replaced with real API authentication in production
// const VALID_ADMINS = [
//   {
//     email: 'admin@gigza.co.za',
//     password: 'GigzaAdmin2025!',
//     name: 'Super Admin',
//     role: 'super_admin'
//   },
//   {
//     email: 'manager@gigza.co.za',
//     password: 'Manager2025!',
//     name: 'Platform Manager',
//     role: 'admin'
//   },
//   {
//     email: 'moderator@gigza.co.za',
//     password: 'Mod2025!',
//     name: 'Content Moderator',
//     role: 'moderator'
//   }
// ];

// document.addEventListener('DOMContentLoaded', () => {
//   checkExistingSession();

//   const rememberedEmail = localStorage.getItem('gigza_admin_remember');
//   if (rememberedEmail) {
//     document.getElementById('email').value = rememberedEmail;
//     document.getElementById('remember').checked = true;
//   }
  
//   console.log('🔐 GIGZA Admin Login Ready');
// });

// function checkExistingSession() {
//   const adminSession = sessionStorage.getItem('gigza_admin_session');
  
//   if (adminSession) {
//     const admin = JSON.parse(adminSession);

//     window.location.href = 'admin.html';
//   }
// }
// function handleLogin(event) {
//   event.preventDefault();
  
//   const email = document.getElementById('email').value.trim();
//   const password = document.getElementById('password').value;
//   const remember = document.getElementById('remember').checked;

//   hideError();

//   if (!email || !password) {
//     showError('Please enter both email and password.');
//     return;
//   }

//   showLoading(true);
  
//   // This can be removed when we actually start using the real API
//   setTimeout(() => {
//     authenticateAdmin(email, password, remember);
//   }, 1000);
  
//   // =============================================
//   // REAL API CALL — Replace the setTimeout above
//   // =============================================
//   // fetch('https://your-api.com/api/admin/login', {
//   //   method: 'POST',
//   //   headers: { 'Content-Type': 'application/json' },
//   //   body: JSON.stringify({ email, password })
//   // })
//   // .then(res => res.json())
//   // .then(data => {
//   //   if (data.success) {
//   //     handleLoginSuccess(data.admin, remember);
//   //   } else {
//   //     showError(data.message || 'Invalid credentials');
//   //   }
//   // })
//   // .catch(err => {
//   //   showError('Network error. Please try again.');
//   //   console.error('Login error:', err);
//   // })
//   // .finally(() => showLoading(false));
// }

// function authenticateAdmin(email, password, remember) {

//   const admin = VALID_ADMINS.find(
//     a => a.email.toLowerCase() === email.toLowerCase() && a.password === password
//   );
  
//   if (admin) {
//     handleLoginSuccess(admin, remember);
//   } else {
//     showError('Invalid email or password. Please try again.');
//     showLoading(false);
    
//     const form = document.getElementById('loginForm');
//     form.style.animation = 'none';
//     form.offsetHeight; 
//     form.style.animation = 'shake 0.5s ease';
//   }
// }

// function handleLoginSuccess(admin, remember) {
//   // Stores the session without a password
//   const sessionData = {
//     email: admin.email,
//     name: admin.name,
//     role: admin.role,
//     loginTime: new Date().toISOString()
//   };
  
//   // Use sessionStorage (clears when browser closes)
//   sessionStorage.setItem('gigza_admin_session', JSON.stringify(sessionData));
//   if (remember) {
//     localStorage.setItem('gigza_admin_remember', admin.email);
//   } else {
//     localStorage.removeItem('gigza_admin_remember');
//   }
  
//   console.log(`✅ Admin logged in: ${admin.name} (${admin.role})`);

//   window.location.href = 'admin.html';
// }
// function showLoading(isLoading) {
//   const loginBtn = document.getElementById('loginBtn');
//   const loadingBtn = document.getElementById('loadingBtn');
//   const loginBtnText = document.getElementById('loginBtnText');
  
//   if (isLoading) {
//     loginBtn.style.display = 'none';
//     loadingBtn.style.display = 'flex';
//   } else {
//     loginBtn.style.display = 'flex';
//     loadingBtn.style.display = 'none';
//   }
// }
// function showError(message) {
//   const errorEl = document.getElementById('errorMessage');
//   const errorText = document.getElementById('errorText');
  
//   errorText.textContent = message;
//   errorEl.classList.add('show');
// }

// function hideError() {
//   const errorEl = document.getElementById('errorMessage');
//   errorEl.classList.remove('show');
// }
// function togglePassword() {
//   const passwordInput = document.getElementById('password');
//   const toggleIcon = document.getElementById('toggleIcon');
  
//   if (passwordInput.type === 'password') {
//     passwordInput.type = 'text';
//     toggleIcon.classList.remove('fa-eye');
//     toggleIcon.classList.add('fa-eye-slash');
//   } else {
//     passwordInput.type = 'password';
//     toggleIcon.classList.remove('fa-eye-slash');
//     toggleIcon.classList.add('fa-eye');
//   }
// }

// function showForgotPassword() {
//   document.getElementById('forgotModal').classList.add('active');
//   document.getElementById('resetSuccess').style.display = 'none';
//   document.getElementById('resetEmail').value = document.getElementById('email').value;
// }
// function closeForgotPassword() {
//   document.getElementById('forgotModal').classList.remove('active');
// }
// function handleResetPassword() {
//   const email = document.getElementById('resetEmail').value.trim();
  
//   if (!email) {
//     alert('Please enter your admin email address.');
//     return;
//   }
  
//   // =============================================
//   // API CALL — Send password reset email
//   // =============================================
//   // fetch('https://your-api.com/api/admin/forgot-password', {
//   //   method: 'POST',
//   //   headers: { 'Content-Type': 'application/json' },
//   //   body: JSON.stringify({ email })
//   // })
//   // .then(res => res.json())
//   // .then(data => {
//   //   document.getElementById('resetSuccess').style.display = 'flex';
//   // })
//   // .catch(err => {
//   //   alert('Error sending reset link. Please try again.');
//   // });
  
//   // Simulate success
//   console.log(`[API Placeholder] Password reset requested for: ${email}`);
//   document.getElementById('resetSuccess').style.display = 'flex';

//   setTimeout(() => {
//     closeForgotPassword();
//   }, 3000);
// }

// document.addEventListener('click', (e) => {
//   if (e.target.classList.contains('modal-overlay')) {
//     e.target.classList.remove('active');
//   }
// });

// document.addEventListener('keydown', (e) => {
//   if (e.key === 'Escape') {
//     document.querySelectorAll('.modal-overlay.active').forEach(modal => {
//       modal.classList.remove('active');
//     });
//   }
// });

// const style = document.createElement('style');
// style.textContent = `
//   @keyframes shake {
//     0%, 100% { transform: translateX(0); }
//     25% { transform: translateX(-8px); }
//     50% { transform: translateX(8px); }
//     75% { transform: translateX(-4px); }
//   }
// `;
// document.head.appendChild(style);

// console.log('👮 Admin authentication system ready');
// console.log('📋 Sample credentials:');
// console.log('   admin@gigza.co.za / GigzaAdmin2025!');
// console.log('   manager@gigza.co.za / Manager2025!');
// console.log('   moderator@gigza.co.za / Mod2025!');



// admin-login.js - FULLY CONNECTED TO BACKEND API

const API_BASE = 'https://gigza-testing-11.onrender.com/api/admin';

// ============================================
// DOM READY
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  checkExistingSession();

  const rememberedEmail = localStorage.getItem('gigza_admin_remember');
  if (rememberedEmail) {
    document.getElementById('email').value = rememberedEmail;
    document.getElementById('remember').checked = true;
  }
  
  console.log('🔐 GIGZA Admin Login Ready');
  console.log(`📡 API: ${API_BASE}`);
});

// ============================================
// CHECK EXISTING SESSION
// ============================================
function checkExistingSession() {
  const token = sessionStorage.getItem('gigza_admin_token');
  const adminData = sessionStorage.getItem('gigza_admin_data');
  
  if (token && adminData) {
    // Verify session with backend
    verifySession(token);
  }
}

// ============================================
// VERIFY SESSION WITH BACKEND
// ============================================
async function verifySession(token) {
  try {
    const response = await fetch(`${API_BASE}/verify-session`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.success) {
      // Session valid - redirect to admin dashboard
      window.location.href = 'admin.html';
    } else {
      // Session invalid - clear storage
      sessionStorage.removeItem('gigza_admin_token');
      sessionStorage.removeItem('gigza_admin_data');
      localStorage.removeItem('gigza_admin_remember');
    }
  } catch (error) {
    console.error('Session verification failed:', error);
    sessionStorage.removeItem('gigza_admin_token');
    sessionStorage.removeItem('gigza_admin_data');
  }
}

// ============================================
// HANDLE LOGIN
// ============================================
function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const remember = document.getElementById('remember').checked;

  hideError();

  if (!email || !password) {
    showError('Please enter both email and password.');
    return;
  }

  showLoading(true);
  
  // Call the real API
  loginAdmin(email, password, remember);
}

// ============================================
// LOGIN API CALL
// ============================================
async function loginAdmin(email, password, remember) {
  try {
    console.log(`📡 Sending login request to ${API_BASE}/login`);
    
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    console.log('📥 Login response:', data);

    if (response.ok && data.success) {
      // ✅ Login successful
      handleLoginSuccess(data, remember);
    } else {
      // ❌ Login failed
      showError(data.message || 'Invalid credentials. Please try again.');
      showLoading(false);
      
      // Shake animation on failed login
      const form = document.getElementById('loginForm');
      form.style.animation = 'none';
      form.offsetHeight; 
      form.style.animation = 'shake 0.5s ease';
    }
  } catch (error) {
    console.error('Login error:', error);
    showError('Network error. Please check your connection and try again.');
    showLoading(false);
  }
}

// ============================================
// LOGIN SUCCESS
// ============================================
function handleLoginSuccess(data, remember) {
  const { admin, token } = data;
  
  // Store token
  sessionStorage.setItem('gigza_admin_token', token);
  
  // Store admin data (without sensitive info)
  const sessionData = {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    is_active: admin.is_active,
    loginTime: new Date().toISOString()
  };
  sessionStorage.setItem('gigza_admin_data', JSON.stringify(sessionData));
  
  // Remember me - store email in localStorage
  if (remember) {
    localStorage.setItem('gigza_admin_remember', admin.email);
  } else {
    localStorage.removeItem('gigza_admin_remember');
  }
  
  console.log(`✅ Admin logged in: ${admin.name} (${admin.role})`);
  
  // Redirect to admin dashboard
  window.location.href = 'admin.html';
}

// ============================================
// FORGOT PASSWORD
// ============================================
async function handleResetPassword() {
  const email = document.getElementById('resetEmail').value.trim();
  
  if (!email) {
    alert('Please enter your admin email address.');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (data.success) {
      document.getElementById('resetSuccess').style.display = 'flex';
      
      setTimeout(() => {
        closeForgotPassword();
      }, 3000);
    } else {
      alert(data.message || 'Error sending reset link. Please try again.');
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    alert('Network error. Please try again.');
  }
}

// ============================================
// TOGGLE PASSWORD VISIBILITY
// ============================================
function togglePassword() {
  const passwordInput = document.getElementById('password');
  const toggleIcon = document.getElementById('toggleIcon');
  
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleIcon.classList.remove('fa-eye');
    toggleIcon.classList.add('fa-eye-slash');
  } else {
    passwordInput.type = 'password';
    toggleIcon.classList.remove('fa-eye-slash');
    toggleIcon.classList.add('fa-eye');
  }
}

// ============================================
// UI HELPERS
// ============================================
function showLoading(isLoading) {
  const loginBtn = document.getElementById('loginBtn');
  const loadingBtn = document.getElementById('loadingBtn');
  
  if (isLoading) {
    loginBtn.style.display = 'none';
    loadingBtn.style.display = 'flex';
  } else {
    loginBtn.style.display = 'flex';
    loadingBtn.style.display = 'none';
  }
}

function showError(message) {
  const errorEl = document.getElementById('errorMessage');
  const errorText = document.getElementById('errorText');
  
  errorText.textContent = message;
  errorEl.classList.add('show');
}

function hideError() {
  const errorEl = document.getElementById('errorMessage');
  errorEl.classList.remove('show');
}

function showForgotPassword() {
  document.getElementById('forgotModal').classList.add('active');
  document.getElementById('resetSuccess').style.display = 'none';
  document.getElementById('resetEmail').value = document.getElementById('email').value;
}

function closeForgotPassword() {
  document.getElementById('forgotModal').classList.remove('active');
}

// Close modal on click outside
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(modal => {
      modal.classList.remove('active');
    });
  }
});

// Add shake animation
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-8px); }
    50% { transform: translateX(8px); }
    75% { transform: translateX(-4px); }
  }
`;
document.head.appendChild(style);

console.log('👮 Admin authentication system ready (API connected)');
console.log(`📡 API: ${API_BASE}`);