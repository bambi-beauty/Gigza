// admin-login.js
// API Configuration
const API_BASE_URL = 'https://gigza-testing-11.onrender.com/api'

document.addEventListener('DOMContentLoaded', () => {
    checkExistingSession();
    
    const rememberedEmail = localStorage.getItem('gigza_admin_remember');
    if (rememberedEmail) {
        document.getElementById('email').value = rememberedEmail;
        document.getElementById('remember').checked = true;
    }
    
    console.log('🔐 GIGZA Admin Login Ready');
});

// ==================== SESSION MANAGEMENT ====================

function checkExistingSession() {
    const adminSession = sessionStorage.getItem('gigza_admin_session');
    const token = localStorage.getItem('gigza_admin_token');
    
    if (adminSession && token) {
        // Verify session with backend
        verifySession(token);
    }
}

async function verifySession(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/verify-session`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                window.location.href = 'admin.html';
            } else {
                // Session invalid, clear storage
                clearSession();
            }
        } else {
            clearSession();
        }
    } catch (error) {
        console.error('Session verification error:', error);
        clearSession();
    }
}

function clearSession() {
    sessionStorage.removeItem('gigza_admin_session');
    localStorage.removeItem('gigza_admin_token');
    localStorage.removeItem('gigza_admin_remember');
}

// ==================== LOGIN HANDLING ====================

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;

    hideError();

    // Validate input
    if (!email || !password) {
        showError('Please enter both email and password.');
        return;
    }

    // Validate email format
    if (!isValidEmail(email)) {
        showError('Please enter a valid email address.');
        return;
    }

    showLoading(true);

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                email: email.toLowerCase().trim(), 
                password 
            })
        });

        const data = await response.json();

        if (data.success) {
            // Store token
            localStorage.setItem('gigza_admin_token', data.token);
            
            // Store session data (without password)
            const sessionData = {
                id: data.admin.id,
                email: data.admin.email,
                name: data.admin.name,
                role: data.admin.role,
                is_active: data.admin.is_active,
                loginTime: new Date().toISOString()
            };
            
            sessionStorage.setItem('gigza_admin_session', JSON.stringify(sessionData));
            
            // Handle "Remember Me"
            if (remember) {
                localStorage.setItem('gigza_admin_remember', email);
            } else {
                localStorage.removeItem('gigza_admin_remember');
            }
            
            console.log(`✅ Admin logged in: ${data.admin.name} (${data.admin.role})`);
            
            // Redirect to admin panel
            window.location.href = 'admin.html';
        } else {
            // Show error from API
            showError(data.message || 'Invalid credentials. Please try again.');
            showLoading(false);
            
            // Shake animation on error
            const form = document.getElementById('loginForm');
            form.style.animation = 'none';
            form.offsetHeight; // Trigger reflow
            form.style.animation = 'shake 0.5s ease';
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Network error. Please check your connection and try again.');
        showLoading(false);
    }
}

// ==================== HELPER FUNCTIONS ====================

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

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

// ==================== FORGOT PASSWORD ====================

function showForgotPassword() {
    document.getElementById('forgotModal').classList.add('active');
    document.getElementById('resetSuccess').style.display = 'none';
    document.getElementById('resetEmail').value = document.getElementById('email').value || '';
}

function closeForgotPassword() {
    document.getElementById('forgotModal').classList.remove('active');
}

async function handleResetPassword() {
    const email = document.getElementById('resetEmail').value.trim();
    
    if (!email) {
        alert('Please enter your admin email address.');
        return;
    }

    if (!isValidEmail(email)) {
        alert('Please enter a valid email address.');
        return;
    }

    // Show loading state
    const resetBtn = document.querySelector('#forgotModal .btn-primary');
    const originalText = resetBtn.textContent;
    resetBtn.textContent = 'Sending...';
    resetBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email.toLowerCase().trim() })
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById('resetSuccess').style.display = 'flex';
            setTimeout(() => {
                closeForgotPassword();
                // Reset button state
                resetBtn.textContent = originalText;
                resetBtn.disabled = false;
            }, 3000);
        } else {
            alert(data.message || 'Failed to send reset link. Please try again.');
            resetBtn.textContent = originalText;
            resetBtn.disabled = false;
        }
    } catch (error) {
        console.error('Password reset error:', error);
        alert('Network error. Please try again.');
        resetBtn.textContent = originalText;
        resetBtn.disabled = false;
    }
}

// ==================== EVENT LISTENERS ====================

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }
});

// Add Enter key support for reset password
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.getElementById('forgotModal').classList.contains('active')) {
        handleResetPassword();
    }
});

// ==================== STYLES (injected) ====================

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

