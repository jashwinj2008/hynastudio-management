/**
 * HYNAOS — Authentication & Role Verification Module
 * Hyna Studio Management System
 * Refactored for Cryptographic Session Management (Strict RLS)
 */

// Helper: Show Alert Message in Form UI
function showAlert(message, type = 'danger') {
  const alertBox = document.getElementById('alertBox');
  const alertText = document.getElementById('alertText');
  
  if (!alertBox || !alertText) return;

  alertText.textContent = message;
  alertBox.className = `alert-box alert-${type}`;
  alertBox.classList.remove('hidden');
}

// Helper: Hide Alert Message
function hideAlert() {
  const alertBox = document.getElementById('alertBox');
  if (alertBox) {
    alertBox.classList.add('hidden');
  }
}

// Helper: Toggle Loading Button State
function setLoadingState(isLoading) {
  const submitBtn = document.getElementById('submitBtn');
  const btnText = document.getElementById('btnText');
  const spinner = document.getElementById('btnSpinner');

  if (!submitBtn) return;

  if (isLoading) {
    submitBtn.disabled = true;
    if (spinner) spinner.classList.remove('hidden');
    if (btnText) btnText.textContent = 'Signing in...';
  } else {
    submitBtn.disabled = false;
    if (spinner) spinner.classList.add('hidden');
    if (btnText) btnText.textContent = 'SIGN IN →';
  }
}

// Password Visibility Toggle
function togglePassword(inputId = 'passwordInput', btnElement) {
  const passwordInput = document.getElementById(inputId);
  if (!passwordInput) return;

  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';

  // Toggle Lucide Icon
  if (btnElement) {
    const icon = btnElement.querySelector('i');
    if (icon) {
      if (isPassword) {
        icon.setAttribute('data-lucide', 'eye-off');
      } else {
        icon.setAttribute('data-lucide', 'eye');
      }
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }
  }
}

// Email Regex Validation
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Fetch Profile and Check Actual Database Role using the current session
 */
async function checkUserRole(userId) {
  const supabase = window.HYNAOS_SUPABASE ? window.HYNAOS_SUPABASE.getClient() : null;
  if (!supabase) return null;

  try {
    // With RLS, this will only return the profile if the authenticated user has access
    const { data, error } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.error("HYNAOS DB Role Check Error:", error);
      return null;
    }

    return data.role;
  } catch (err) {
    console.error("HYNAOS DB Query Exception:", err);
    return null;
  }
}

/**
 * Enforce Session State & Route Protection
 */
async function enforceSessionState() {
  const supabase = window.HYNAOS_SUPABASE ? window.HYNAOS_SUPABASE.getClient() : null;
  if (!supabase) return;
  const { data: { session }, error } = await supabase.auth.getSession();
  
  const currentPath = window.location.pathname.toLowerCase();
  const isDashboardPage = currentPath.includes('dashboard');
  const isLoginPage = currentPath.includes('login') || currentPath.endsWith('index.html') || currentPath === '/';

  // If on a dashboard but no valid session, kick to login
  if (isDashboardPage && (!session || error)) {
    window.location.href = 'index.html';
    return;
  }

  // If on a login page and session exists, route to correct dashboard
  if (isLoginPage && session && !error) {
    const role = await checkUserRole(session.user.id);
    if (role === 'admin') {
      window.location.href = 'admin-dashboard.html';
    } else if (role === 'employee') {
      window.location.href = 'employee-dashboard.html';
    }
  }
}

/**
 * Handle Admin Login
 */
async function handleAdminLogin(event) {
  if (event) event.preventDefault();
  hideAlert();

  const emailInput = document.getElementById('emailInput');
  const passwordInput = document.getElementById('passwordInput');

  const email = emailInput ? emailInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value.trim() : '';

  if (!email || !isValidEmail(email)) {
    showAlert('Please enter a valid administrator email address.');
    return;
  }
  if (!password) {
    showAlert('Please enter your password.');
    return;
  }

  setLoadingState(true);
  const supabase = window.HYNAOS_SUPABASE ? window.HYNAOS_SUPABASE.getClient() : null;

  try {
    if (!supabase) throw new Error("Supabase client not initialized.");

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      setLoadingState(false);
      showAlert(authError.message.includes('Invalid login credentials') ? 
        'Incorrect email or password. Please try again.' : 
        (authError.message || 'Authentication failed.'));
      return;
    }

    const user = authData.user;
    const actualRole = await checkUserRole(user.id);
    
    setLoadingState(false);

    if (actualRole === 'admin') {
      showAlert('Login successful! Access granted.', 'success');
      setTimeout(() => {
        window.location.href = 'admin-dashboard.html';
      }, 600);
    } else if (actualRole === 'employee') {
      showAlert('Login successful! Access granted.', 'success');
      setTimeout(() => {
        window.location.href = 'employee-dashboard.html';
      }, 600);
    } else {
      await supabase.auth.signOut();
      showAlert('No valid role found for this user.', 'danger');
    }

  } catch (err) {
    setLoadingState(false);
    console.error('HYNAOS Auth Exception:', err);
    showAlert(err.message || 'A network or authentication error occurred. Please try again.');
  }
}

/**
 * Handle Employee Login
 */
async function handleEmployeeLogin(event) {
  if (event) event.preventDefault();
  hideAlert();

  const emailInput = document.getElementById('emailInput');
  const passwordInput = document.getElementById('passwordInput');

  const email = emailInput ? emailInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value.trim() : '';

  if (!email) {
    showAlert('Please enter your employee email address.');
    return;
  }
  if (!password) {
    showAlert('Please enter your password.');
    return;
  }

  setLoadingState(true);
  const supabase = window.HYNAOS_SUPABASE ? window.HYNAOS_SUPABASE.getClient() : null;

  try {
    if (!supabase) throw new Error("Supabase client not initialized.");

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      setLoadingState(false);
      showAlert(authError.message.includes('Invalid login credentials') ? 
        'Incorrect email or password. Please try again.' : 
        (authError.message || 'Authentication failed.'));
      return;
    }

    const user = authData.user;
    const actualRole = await checkUserRole(user.id);
    
    setLoadingState(false);

    if (actualRole === 'admin') {
      showAlert('Login successful! Access granted.', 'success');
      setTimeout(() => {
        window.location.href = 'admin-dashboard.html';
      }, 600);
    } else if (actualRole === 'employee') {
      showAlert('Login successful! Access granted.', 'success');
      setTimeout(() => {
        window.location.href = 'employee-dashboard.html';
      }, 600);
    } else {
      await supabase.auth.signOut();
      showAlert('No valid role found for this user.', 'danger');
    }

  } catch (err) {
    setLoadingState(false);
    console.error('HYNAOS Auth Exception:', err);
    showAlert(err.message || 'A network or authentication error occurred. Please try again.');
  }
}

/**
 * Handle Password Reset Request
 */
async function forgotPassword() {
  const emailInput = document.getElementById('emailInput');
  const email = emailInput ? emailInput.value.trim() : '';

  if (!email || !isValidEmail(email)) {
    showAlert('Please enter your registered email address above to receive a password reset link.');
    return;
  }

  const supabase = window.HYNAOS_SUPABASE ? window.HYNAOS_SUPABASE.getClient() : null;
  if (!supabase) return;

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password.html'
    });

    if (error) {
      showAlert(error.message || 'Failed to send password reset email.');
    } else {
      showAlert(`Password recovery email sent to ${email}. Check your inbox.`, 'success');
    }
  } catch (err) {
    console.error('HYNAOS Forgot Password Error:', err);
    showAlert('An error occurred while sending password reset email.');
  }
}

/**
 * Handle User Logout
 */
async function logout() {
  const supabase = window.HYNAOS_SUPABASE ? window.HYNAOS_SUPABASE.getClient() : null;
  if (supabase) {
    await supabase.auth.signOut();
  }
  window.location.href = 'index.html';
}

// Global functions exports
window.handleAdminLogin = handleAdminLogin;
window.handleEmployeeLogin = handleEmployeeLogin;
window.checkUserRole = checkUserRole;
window.togglePassword = togglePassword;
window.forgotPassword = forgotPassword;
window.logout = logout;

// Run session check automatically on page load
document.addEventListener('DOMContentLoaded', () => {
  enforceSessionState();
});
