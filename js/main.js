/**
 * HYNAOS — Main Application Script
 * Hyna Studio Management System
 */

document.addEventListener('DOMContentLoaded', () => {
  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }, (err) => {
        console.log('ServiceWorker registration failed: ', err);
      });
    });
  }

  // Initialize Lucide SVG Icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Setup Admin Login Form listener if present
  const adminForm = document.getElementById('adminLoginForm');
  if (adminForm) {
    adminForm.addEventListener('submit', window.handleAdminLogin);
  }

  // Setup Employee Login Form listener if present
  const employeeForm = document.getElementById('employeeLoginForm');
  if (employeeForm) {
    employeeForm.addEventListener('submit', window.handleEmployeeLogin);
  }

  // Setup Demo Fill Helper Click Actions
  const demoFillAdmin = document.getElementById('demoFillAdmin');
  if (demoFillAdmin) {
    demoFillAdmin.addEventListener('click', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('emailInput');
      const passwordInput = document.getElementById('passwordInput');
      if (emailInput) emailInput.value = 'admin@hynastudio.com';
      if (passwordInput) passwordInput.value = 'adminPass123!';
    });
  }

  const demoFillEmployee = document.getElementById('demoFillEmployee');
  if (demoFillEmployee) {
    demoFillEmployee.addEventListener('click', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('emailInput');
      const passwordInput = document.getElementById('passwordInput');
      if (emailInput) emailInput.value = 'employee@hynastudio.com';
      if (passwordInput) passwordInput.value = 'employeePass123!';
    });
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }, err => {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}
