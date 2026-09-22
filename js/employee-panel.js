let CURRENT_EMPLOYEE = null;




let myTasksList = [];

let myWorkLogs = [];

let myLeaveRequests = [];

// Scoped Personal Attendance State
let attendanceState = {
  isCheckedIn: false,
  checkInTime: null,
  checkOutTime: null,
  workingSeconds: 0,
  timerInterval: null
};




async function initializeEmployeeSession() {
  try {
    const supabase = window.HYNAOS_SUPABASE.getClient();
    if (!supabase) return;
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      window.location.href = 'employee-login.html';
      return;
    }
    const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    if (error) throw error;
    
    if (profile) {
      const parts = (profile.full_name || "Employee").trim().split(' ').filter(Boolean);
      let initials = "HE";
      if (parts.length > 1) {
        initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      } else if (parts[0]) {
        initials = parts[0].substring(0, 2).toUpperCase();
      }
      
      CURRENT_EMPLOYEE = {
        id: profile.employee_id || profile.id,
        uid: profile.id,
        name: profile.full_name,
        email: profile.email,
        role: profile.role,
        position: profile.position,
        department: profile.department,
        joiningDate: profile.joined_at,
        phone: profile.phone || "",
        status: profile.status,
        initials: initials,
        avatarUrl: profile.avatar_url || null
      };
    }
  } catch (err) {
    console.error("Session initialization failed:", err);
  }
}
// Page Lifecycle Initialization
document.addEventListener('DOMContentLoaded', async () => {
  await initializeEmployeeSession();

  // 1. Verify Employee Access Security
  await verifyEmployeeAccess();

  // 2. Initialize Navigation Router
  initNavigation();

  // 3. Render Scoped Workspace Views
  renderMyTasks();
  renderMyProjects();
  renderMyWorkLogs();
  renderMyLeaves();
  renderMyProfile();
  updateEmployeeDashboardStatCards();

  // 4. Initialize Forms & Listeners
  initForms();

  // 5. Initialize Lucide Icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});

/**
 * Verify Employee Security Access
 */
async function verifyEmployeeAccess() {
  const { getClient, isDemoMode } = window.HYNAOS_SUPABASE || {};

  if (isDemoMode() || !getClient()) {
    console.log("⚡ Employee Panel: Authorized (Demo Mode).");
    return;
  }

  try {
    const supabase = getClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      window.location.href = 'employee-login.html';
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || profile.role !== 'employee') {
      alert("Unauthorized Access: Employee credentials required.");
      window.location.href = 'employee-login.html';
    }
  } catch (err) {
    console.error("Security check failed:", err);
  }
}

/**
 * Navigation Router & Sidebar Controls
 */
function initNavigation() {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebarToggleBtn');
  const closeBtn = document.getElementById('sidebarCloseBtn');
  const deckOverlay = document.getElementById('mobileDeckOverlay');
  const navLinks = document.querySelectorAll('.sidebar-link');
  const tabContents = document.querySelectorAll('.tab-content');

  function closeMobileMenu() {
    document.body.classList.remove('mobile-menu-active');
    if (sidebar) sidebar.classList.remove('mobile-open');
  }

  // Sidebar Collapse Toggle & Mobile 3D Drawer Toggle
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      if (window.innerWidth <= 1024) {
        document.body.classList.toggle('mobile-menu-active');
        sidebar.classList.toggle('mobile-open');
      } else {
        sidebar.classList.toggle('collapsed');
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeMobileMenu);
  }

  if (deckOverlay) {
    deckOverlay.addEventListener('click', closeMobileMenu);
  }

  // Tab Switching
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTabId = link.getAttribute('data-tab');

      if (!targetTabId) return;

      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      tabContents.forEach(tab => {
        tab.classList.remove('active');
        if (tab.id === `${targetTabId}Tab`) {
          tab.classList.add('active');
        }
      });

      closeMobileMenu();
    });
  });

  // Notifications Toggle
  const notifBtn = document.getElementById('notifBtn');
  const notifDropdown = document.getElementById('notifDropdown');

  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      notifDropdown.classList.remove('show');
    });
  }
}

/**
 * Attendance Check In / Check Out Handler
 */
function toggleCheckIn() {
  const checkInBtn = document.getElementById('checkInBtn');
  const checkOutBtn = document.getElementById('checkOutBtn');
  const statusBadge = document.getElementById('attendanceStatusBadge');
  const timerBadge = document.getElementById('workingTimerBadge');
  const checkInTimeEl = document.getElementById('checkInTimeDisplay');
  const checkOutTimeEl = document.getElementById('checkOutTimeDisplay');

  if (!attendanceState.isCheckedIn) {
    // Perform Check In
    const now = new Date();
    attendanceState.isCheckedIn = true;
    attendanceState.checkInTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (checkInBtn) checkInBtn.disabled = true;
    if (checkOutBtn) checkOutBtn.disabled = false;
    if (statusBadge) {
      statusBadge.textContent = '🟢 Checked In';
      statusBadge.className = 'badge-status badge-active';
    }
    if (checkInTimeEl) checkInTimeEl.textContent = attendanceState.checkInTime;

    // Start Live Timer
    attendanceState.timerInterval = setInterval(() => {
      attendanceState.workingSeconds++;
      const hrs = String(Math.floor(attendanceState.workingSeconds / 3600)).padStart(2, '0');
      const mins = String(Math.floor((attendanceState.workingSeconds % 3600) / 60)).padStart(2, '0');
      const secs = String(attendanceState.workingSeconds % 60).padStart(2, '0');
      if (timerBadge) timerBadge.textContent = `${hrs}:${mins}:${secs}`;
    }, 1000);

  } else {
    // Perform Check Out
    const now = new Date();
    attendanceState.isCheckedIn = false;
    attendanceState.checkOutTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    clearInterval(attendanceState.timerInterval);

    if (checkInBtn) checkInBtn.disabled = true;
    if (checkOutBtn) checkOutBtn.disabled = true;
    if (statusBadge) {
      statusBadge.textContent = '🔴 Checked Out';
      statusBadge.className = 'badge-status badge-delayed';
    }
    if (checkOutTimeEl) checkOutTimeEl.textContent = attendanceState.checkOutTime;
  }
}

/**
 * Render Scoped Tasks
 */

async function renderMyTasks() {
  const container = document.getElementById('myTasksContainer');
  if (!container) return;
  
  try {
    const supabase = window.HYNAOS_SUPABASE.getClient();
    if (!supabase) return;
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) throw new Error("No active session.");

    const profileRes = await supabase.from('profiles').select('full_name').eq('id', session.user.id).single();
    const fullName = profileRes.data ? profileRes.data.full_name : '';

    const { data: tasks, error } = await supabase.from('tasks').select('*').eq('assignee_id', fullName);
    if (error) throw error;
    
    myTasksList = tasks;


    container.innerHTML = '';
    
    if (!tasks || tasks.length === 0) {
      container.innerHTML = '<div class="text-center text-muted p-4">No tasks assigned to you.</div>';
      return;
    }

    tasks.forEach(t => {
      let badge = 'badge-primary';
      if(t.priority === 'urgent') badge = 'badge-danger';
      if(t.priority === 'high') badge = 'badge-warning';
      
      const html = `
        <div class="glass-card mb-3 p-3">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <span class="badge ${badge} me-2">${t.priority}</span>
              <strong>${t.task_title}</strong>
            </div>
            <span class="text-muted small">${t.status}</span>
          </div>
          <p class="text-muted small mb-2">${t.description}</p>
          <div class="d-flex justify-content-between align-items-center">
            <div class="small text-primary fw-bold"><i data-lucide="clock" class="me-1"></i> ${t.due_date || 'No deadline'}</div>
          </div>
        </div>
      `;
      container.innerHTML += html;
    });

  } catch (err) {
    console.error("Supabase RLS/Fetch Error [my tasks]:", err);
    container.innerHTML = `<div class="text-center text-danger p-4"><i data-lucide="shield-alert"></i> Access Denied / Data Unavailable</div>`;
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}


function updateTaskStatus(taskId, newStatus) {
  const task = myTasksList.find(t => t.id === taskId);
  if (task) {
    task.status = newStatus;
    saveEmployeeDataToStorage();
    renderMyTasks();
    if (typeof updateEmployeeDashboardStatCards === 'function') updateEmployeeDashboardStatCards();
  }
}

function submitTaskForReview(taskId) {
  updateTaskStatus(taskId, 'Review');
  alert('Task submitted for Administrator Review successfully!');
}


/**
 * Render Scoped Assigned Projects
 */

async function renderMyProjects() {
  const container = document.getElementById('myProjectsContainer');
  if (!container) return;
  
  try {
    const supabase = window.HYNAOS_SUPABASE.getClient();
    if (!supabase) return;
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) throw new Error("No active session.");

    // Technically projects are readable by all authenticated users
    const { data: projects, error } = await supabase.from('projects').select('*');
    if (error) throw error;

    container.innerHTML = '';
    
    if (!projects || projects.length === 0) {
      container.innerHTML = '<div class="text-center text-muted p-4">No projects available.</div>';
      return;
    }

    projects.forEach(p => {
      const prog = p.progress || 0;
      const html = `
        <div class="glass-card mb-3 p-3">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h6 class="mb-0">${p.project_name}</h6>
            <span class="badge bg-secondary">${p.status}</span>
          </div>
          <p class="text-muted small mb-3">Manager: ${p.manager_id}</p>
          <div class="d-flex justify-content-between text-muted small mb-1">
            <span>Progress</span>
            <span>${prog}%</span>
          </div>
          <div class="progress" style="height: 5px;">
            <div class="progress-bar bg-primary" style="width: ${prog}%"></div>
          </div>
        </div>
      `;
      container.innerHTML += html;
    });

  } catch (err) {
    console.error("Supabase RLS/Fetch Error [my projects]:", err);
    container.innerHTML = `<div class="text-center text-danger p-4"><i data-lucide="shield-alert"></i> Access Denied / Data Unavailable</div>`;
  }
}


/**
 * Render Work Log Submissions
 */

async function renderMyWorkLogs() {
  const tbody = document.getElementById('workLogsTableBody');
  if (!tbody) return;
  
  try {
    const supabase = window.HYNAOS_SUPABASE.getClient();
    if (!supabase) return;
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) throw new Error("No active session.");

    const { data: logs, error } = await supabase.from('work_logs').select('*');
    if (error) throw error;
    
    myWorkLogs = logs;


    if (!logs || logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No work logs found.</td></tr>';
      return;
    }

    tbody.innerHTML = logs.map(l => {
      return `
        <tr>
          <td><strong>${l.date}</strong></td>
          <td>${l.hours_worked}</td>
          <td>${l.description}</td>
          <td><span class="status-badge ${l.status === 'Approved' ? 'status-active' : 'status-pending'}">${l.status}</span></td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    console.error("Supabase RLS/Fetch Error [my logs]:", err);
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger"><i data-lucide="shield-alert"></i> Access Denied / Data Unavailable</td></tr>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}


/**
 * Render Leave Requests
 */

async function renderMyLeaves() {
  const tbody = document.getElementById('leaveTableBody');
  if (!tbody) return;
  
  try {
    const supabase = window.HYNAOS_SUPABASE.getClient();
    if (!supabase) return;
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) throw new Error("No active session.");

    const { data: leaves, error } = await supabase.from('leave_requests').select('*');
    if (error) throw error;
    
    myLeaveRequests = leaves;


    if (!leaves || leaves.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No leave requests found.</td></tr>';
      return;
    }

    tbody.innerHTML = leaves.map(l => {
      const statusClass = l.status === 'Approved' ? 'status-active' : (l.status === 'Rejected' ? 'status-inactive' : 'status-pending');
      return `
        <tr>
          <td><strong>${l.type}</strong></td>
          <td>${l.start_date} to ${l.end_date}</td>
          <td>${l.reason}</td>
          <td><span class="status-badge ${statusClass}">${l.status}</span></td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    console.error("Supabase RLS/Fetch Error [my leaves]:", err);
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger"><i data-lucide="shield-alert"></i> Access Denied / Data Unavailable</td></tr>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}


/**
 * Render Personal Profile Details
 */

async function renderMyProfile() {
  try {
    const supabase = window.HYNAOS_SUPABASE.getClient();
    if (!supabase) return;
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) return;

    const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    if (error) throw error;

    // Assuming we have fields to update on employee-dashboard.html
    const nameElems = document.querySelectorAll('.user-name-display');
    const roleElems = document.querySelectorAll('.user-role-display');
    
    nameElems.forEach(el => el.textContent = profile.full_name || 'Employee');
    roleElems.forEach(el => el.textContent = profile.position || 'Team Member');

  } catch (err) {
    console.error("Supabase RLS/Fetch Error [my profile]:", err);
  }
}


/**
 * Handle Profile Image Upload
 */
function handleProfileImageUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('Please select a valid image file (PNG, JPG, JPEG, WebP).');
    return;
  }

  // Limit file size to 5MB
  if (file.size > 5 * 1024 * 1024) {
    alert('Image file size should be less than 5MB.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    CURRENT_EMPLOYEE.avatarUrl = dataUrl;

    // Update in Supabase
    try {
      const supabase = window.HYNAOS_SUPABASE.getClient();
      if (supabase) {
        supabase.from('profiles').update({ avatar_url: dataUrl }).eq('id', CURRENT_EMPLOYEE.uid).then();
      }
    } catch (err) {
      console.warn('Could not save avatar to Supabase:', err);
    }

    renderMyProfile();
    try {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('hynaos_employees_updated'));
    } catch(err) {}
    if (typeof showHynaToast === 'function') {
      showHynaToast('Profile photo updated successfully!', 'image');
    }
    console.log('✅ Profile image uploaded and updated!');
  };
  reader.readAsDataURL(file);
}

/**
 * Remove Custom Profile Image
 */
function removeProfileImage() {
  CURRENT_EMPLOYEE.avatarUrl = null;

  try {
    const supabase = window.HYNAOS_SUPABASE.getClient();
    if (supabase) {
      supabase.from('profiles').update({ avatar_url: null }).eq('id', CURRENT_EMPLOYEE.uid).then();
    }
  } catch (err) {
    console.warn('Could not remove avatar from Supabase:', err);
  }

  const fileInput = document.getElementById('profileImageInput');
  if (fileInput) fileInput.value = '';

  renderMyProfile();
  try {
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('hynaos_employees_updated'));
  } catch(err) {}
  if (typeof showHynaToast === 'function') {
    showHynaToast('Profile photo removed', 'trash-2');
  }
  console.log('🗑️ Profile image removed.');
}

/**
 * Forms Event Listeners
 */
function initForms() {
  // Add Daily Work Log Form
  const workForm = document.getElementById('addWorkLogForm');
  if (workForm) {
    workForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('workTitleInput').value.trim();
      const project = document.getElementById('workProjectSelect').value;

      if (!title) return;

      const newLog = {
        id: `WLOG-${myWorkLogs.length + 1}`,
        title,
        project,
        task: "Daily Update",
        date: "Today, Just now",
        status: "Submitted for Review"
      };

      myWorkLogs.unshift(newLog);
      saveEmployeeDataToStorage();
      renderMyWorkLogs();
      workForm.reset();
      if (typeof showHynaToast === 'function') {
        showHynaToast('Work update log submitted successfully!', 'file-check');
      } else {
        alert('Work update log submitted successfully!');
      }
    });
  }

  // Submit Leave Request Form
  const leaveForm = document.getElementById('submitLeaveForm');
  if (leaveForm) {
    leaveForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const type = document.getElementById('leaveTypeSelect').value;
      const start = document.getElementById('leaveStartDate').value;
      const end = document.getElementById('leaveEndDate').value;
      const reason = document.getElementById('leaveReasonInput').value.trim();

      if (!start || !end || !reason) return;

      const newLeave = {
        id: `LV-${myLeaveRequests.length + 1}`,
        type,
        dates: `${start} to ${end}`,
        reason,
        status: "Pending",
        comments: "Awaiting HR review"
      };

      myLeaveRequests.unshift(newLeave);
      saveEmployeeDataToStorage();
      renderMyLeaves();
      leaveForm.reset();
      if (typeof showHynaToast === 'function') {
        showHynaToast('Leave request submitted to HR!', 'calendar');
      } else {
        alert('Leave request submitted to HR successfully!');
      }
    });
  }
}

// Global functions exports
window.toggleCheckIn = toggleCheckIn;
window.updateTaskStatus = updateTaskStatus;
window.submitTaskForReview = submitTaskForReview;
window.handleProfileImageUpload = handleProfileImageUpload;
window.removeProfileImage = removeProfileImage;
window.openEditSelfModal = openEditSelfModal;
window.closeEditSelfModal = closeEditSelfModal;
window.saveSelfProfile = saveSelfProfile;

/**
 * Open Edit Self Profile Modal
 */
function openEditSelfModal() {
  const modal = document.getElementById('editEmployeeSelfModal');
  const nameInput = document.getElementById('editSelfName');
  const emailInput = document.getElementById('editSelfEmail');
  const phoneInput = document.getElementById('editSelfPhone');
  const deptInput = document.getElementById('editSelfDept');
  const posInput = document.getElementById('editSelfPos');

  if (nameInput) nameInput.value = CURRENT_EMPLOYEE.name || '';
  if (emailInput) emailInput.value = CURRENT_EMPLOYEE.email || '';
  if (phoneInput) phoneInput.value = CURRENT_EMPLOYEE.phone || '';
  if (deptInput) deptInput.value = CURRENT_EMPLOYEE.department || '';
  if (posInput) posInput.value = CURRENT_EMPLOYEE.position || '';

  if (modal) modal.classList.add('show');
}

/**
 * Close Edit Self Profile Modal
 */
function closeEditSelfModal() {
  const modal = document.getElementById('editEmployeeSelfModal');
  if (modal) modal.classList.remove('show');
}

/**
 * Save Self Profile Changes
 */
function saveSelfProfile(e) {
  if (e) e.preventDefault();
  const nameInput = document.getElementById('editSelfName');
  const emailInput = document.getElementById('editSelfEmail');
  const phoneInput = document.getElementById('editSelfPhone');
  const deptInput = document.getElementById('editSelfDept');
  const posInput = document.getElementById('editSelfPos');

  if (!nameInput || !emailInput) return;

  const newName = nameInput.value.trim();
  const newEmail = emailInput.value.trim();
  const newPhone = phoneInput ? phoneInput.value.trim() : CURRENT_EMPLOYEE.phone;
  const newDept = deptInput ? deptInput.value.trim() : CURRENT_EMPLOYEE.department;
  const newPos = posInput ? posInput.value.trim() : CURRENT_EMPLOYEE.position;

  if (!newName || !newEmail) {
    alert("Please enter full name and email address.");
    return;
  }

  const parts = newName.split(' ').filter(Boolean);
  let initials = "HE";
  if (parts.length > 1) {
    initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  } else if (parts[0]) {
    initials = parts[0].substring(0, 2).toUpperCase();
  }

  CURRENT_EMPLOYEE = {
    ...CURRENT_EMPLOYEE,
    name: newName,
    email: newEmail,
    phone: newPhone,
    department: newDept,
    position: newPos,
    initials: initials
  };

    try {
    const supabase = window.HYNAOS_SUPABASE.getClient();
    if (supabase) {
      supabase.from('profiles').update({
        full_name: newName,
        email: newEmail,
        phone: newPhone,
        department: newDept,
        position: newPos
      }).eq('id', CURRENT_EMPLOYEE.uid).then();
    }
  } catch (err) {
    console.error("Failed to update profile", err);
  }
  renderMyProfile();
  closeEditSelfModal();

  try {
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('hynaos_employees_updated'));
  } catch(err) {}

  if (typeof showHynaToast === 'function') {
    showHynaToast("Profile changes saved successfully!", "check-circle");
  } else {
    alert("Profile updated successfully!");
  }
}

/**
 * Update Employee Dashboard Stat Cards dynamically
 */

async function updateEmployeeDashboardStatCards() {
  try {
    const supabase = window.HYNAOS_SUPABASE.getClient();
    if (!supabase) return;
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) return;

    // Gracefully update task count for the employee
    const profileRes = await supabase.from('profiles').select('full_name').eq('id', session.user.id).single();
    if (profileRes.data) {
      const { count: tasksCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('assignee_id', profileRes.data.full_name);
      
      const tskElem = document.getElementById('statActiveTasks');
      if (tskElem && tasksCount !== null) tskElem.textContent = tasksCount;
    }
  } catch (err) {
    console.error("Supabase RLS/Fetch Error [employee stats]:", err);
  }
}

/**
 * FETCH BENTO STATS
 */
async function fetchBentoStats() {
  try {
    const supabase = window.HYNAOS_SUPABASE.getClient();
    if (!supabase) return;
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) return;
    
    // 1. Total Hours Logged this Month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    
    const { data: workLogs } = await supabase
      .from('work_logs')
      .select('hours_worked')
      .gte('date', firstDay);

    if (workLogs) {
      const totalHours = workLogs.reduce((sum, log) => sum + (parseFloat(log.hours_worked) || 0), 0);
      const wholeHours = Math.floor(totalHours);
      const fraction = (totalHours - wholeHours).toFixed(1).substring(1);
      
      const hoursEl = document.getElementById('bento-total-hours');
      if (hoursEl) {
        hoursEl.innerHTML = `${wholeHours}<span style="font-size: 1.5rem; color: var(--text-muted);">${fraction}</span>`;
      }
    }

    // 2. Task Completion Percentage
    const profileRes = await supabase.from('profiles').select('full_name').eq('id', session.user.id).single();
    if (profileRes.data) {
      const { data: tasks } = await supabase
        .from('tasks')
        .select('status')
        .eq('assignee_id', profileRes.data.full_name);
        
      if (tasks) {
        const totalTasks = tasks.length;
        const doneTasks = tasks.filter(t => t.status === 'Done' || t.status === 'Completed').length;
        const percent = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);
        
        const percentEl = document.getElementById('bento-task-percent');
        const descEl = document.getElementById('bento-task-desc');
        const progressEl = document.getElementById('bento-progress-fill');
        
        if (percentEl) percentEl.textContent = `${percent}%`;
        if (descEl) descEl.textContent = `${doneTasks} of ${totalTasks} tasks completed`;
        if (progressEl) progressEl.style.width = `${percent}%`;
      }
    }
  } catch (err) {
    console.error("Supabase RLS/Fetch Error [bento stats]:", err);
  }
}

/**
 * Toast Notification Alert Helper
 */
function showHynaToast(message, iconName = 'check-circle') {
  let toastContainer = document.getElementById('hynaToastNotice');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'hynaToastNotice';
    toastContainer.className = 'hyna-toast';
    document.body.appendChild(toastContainer);
  }
  toastContainer.innerHTML = `<i data-lucide="${iconName}" size="18"></i><span>${message}</span>`;
  if (typeof lucide !== 'undefined') lucide.createIcons();
  
  toastContainer.classList.add('show');
  setTimeout(() => {
    toastContainer.classList.remove('show');
  }, 3000);
}

/**
 * REFRESH ALL DASHBOARD DATA
 */
function refreshAllDashboardData(showToast = true) {
  console.log("🔄 Refreshing all Employee Dashboard data...");

  // Trigger spin animation on refresh button icons
  const refreshIcons = document.querySelectorAll('#navRefreshBtn i, #pageRefreshBtn i');
  refreshIcons.forEach(icon => icon.classList.add('spin-icon'));

  // 1. Reload User Profile & Projects from Storage
    
  // 2. Re-render all view tables and components
  if (typeof renderMyTasks === 'function') renderMyTasks();
  if (typeof renderKanbanBoard === 'function') renderKanbanBoard();
  if (typeof renderMyProjects === 'function') renderMyProjects();
  if (typeof renderMyWorkLogs === 'function') renderMyWorkLogs();
  if (typeof renderMyLeaves === 'function') renderMyLeaves();
  if (typeof renderMyProfile === 'function') renderMyProfile();

  // 3. Update Stat Cards
  updateEmployeeDashboardStatCards();
  fetchBentoStats();

  // 4. Re-initialize Lucide Icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // 5. Complete animation & show toast
  setTimeout(() => {
    refreshIcons.forEach(icon => icon.classList.remove('spin-icon'));
    if (showToast) {
      showHynaToast("Dashboard refreshed successfully!", "refresh-cw");
    }
  }, 600);
}

window.refreshAllDashboardData = refreshAllDashboardData;
window.refreshAll = refreshAllDashboardData;
window.showHynaToast = showHynaToast;

// Auto-sync projects on storage update
window.addEventListener('storage', (e) => {
  if (!e.key || e.key === 'hynaos_projects_list') {
    if (typeof renderMyProjects === 'function') renderMyProjects();
    if (typeof updateEmployeeDashboardStatCards === 'function') updateEmployeeDashboardStatCards();
  }
});
window.addEventListener('hynaos_projects_updated', () => {
  if (typeof renderMyProjects === 'function') renderMyProjects();
  if (typeof updateEmployeeDashboardStatCards === 'function') updateEmployeeDashboardStatCards();
});




/**
 * RENDER KANBAN BOARD
 */
async function renderKanbanBoard() {
  const todoCol = document.getElementById('kanban-todo');
  const inprogCol = document.getElementById('kanban-inprogress');
  const doneCol = document.getElementById('kanban-done');
  
  if (!todoCol || !inprogCol || !doneCol) return;
  
  try {
    const supabase = window.HYNAOS_SUPABASE.getClient();
    if (!supabase) return;
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) throw new Error("No active session.");

    const profileRes = await supabase.from('profiles').select('full_name').eq('id', session.user.id).single();
    const fullName = profileRes.data ? profileRes.data.full_name : '';

    const { data: tasks, error } = await supabase.from('tasks').select('*').eq('assignee_id', fullName);
    if (error) throw error;
    
    // Clear columns (preserve headers)
    todoCol.innerHTML = '<div class="kanban-column-header">To Do</div>';
    inprogCol.innerHTML = '<div class="kanban-column-header">In Progress</div>';
    doneCol.innerHTML = '<div class="kanban-column-header">Done</div>';
    
    if (!tasks || tasks.length === 0) return;
    
    tasks.forEach(t => {
      let badgeClass = 'low';
      let priorityText = 'Low';
      
      const prio = (t.priority || '').toLowerCase();
      if(prio === 'urgent' || prio === 'high') {
        badgeClass = 'high';
        priorityText = 'High';
      } else if (prio === 'medium') {
        badgeClass = 'medium';
        priorityText = 'Medium';
      }
      
      const cardHtml = `
        <div class="kanban-card" draggable="true" data-task-id="${t.id}">
          <span class="badge-priority ${badgeClass}">${priorityText}</span>
          <div class="kanban-task-title">${t.title || 'Untitled Task'}</div>
          <div class="kanban-task-desc">${t.description || ''}</div>
        </div>
      `;
      
      const status = (t.status || '').toLowerCase();
      if (status === 'done' || status === 'completed') {
        doneCol.innerHTML += cardHtml;
      } else if (status === 'in progress' || status === 'inprogress' || status === 'review') {
        inprogCol.innerHTML += cardHtml;
      } else {
        todoCol.innerHTML += cardHtml;
      }
    });

    initializeKanbanDragAndDrop();


  } catch (err) {
    console.error("Supabase Error [Kanban]:", err);
    const errorHtml = `<div class="kanban-card"><div class="kanban-task-title text-danger" style="color:var(--rose-danger);">Error Loading Tasks</div></div>`;
    todoCol.innerHTML = '<div class="kanban-column-header">To Do</div>' + errorHtml;
    inprogCol.innerHTML = '<div class="kanban-column-header">In Progress</div>' + errorHtml;
    doneCol.innerHTML = '<div class="kanban-column-header">Done</div>' + errorHtml;
  }
}

/**
 * INITIALIZE KANBAN DRAG AND DROP
 */
function initializeKanbanDragAndDrop() {
  const cards = document.querySelectorAll('.kanban-card');
  const columns = document.querySelectorAll('.kanban-column');

  cards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      card.classList.add('is-dragging');
      e.dataTransfer.setData('text/plain', card.dataset.taskId);
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('is-dragging');
    });
  });

  columns.forEach(column => {
    column.addEventListener('dragover', (e) => {
      e.preventDefault(); // Necessary to allow dropping
    });

    column.addEventListener('drop', async (e) => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData('text/plain');
      if (!taskId) return;
      
      const draggingCard = document.querySelector(`.kanban-card[data-task-id="${taskId}"]`);
      
      if (draggingCard && column !== draggingCard.parentElement) {
        // Optimistically update the UI by moving the card
        column.appendChild(draggingCard);
        
        let newStatus = 'To Do';
        if (column.id === 'kanban-inprogress') newStatus = 'In Progress';
        else if (column.id === 'kanban-done') newStatus = 'Done';

        try {
          const supabase = window.HYNAOS_SUPABASE.getClient();
          const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
          
          if (error) {
            console.error("Error updating task status:", error);
          } else {
            // Update stats when task status changes
            if (typeof updateEmployeeDashboardStatCards === 'function') updateEmployeeDashboardStatCards();
            if (typeof fetchBentoStats === 'function') fetchBentoStats();
          }
        } catch (err) {
          console.error("Drag and drop update failed:", err);
        }
      }
    });
  });
}


/**
 * NEW TASK MODAL LOGIC
 */
function openNewTaskModal() {
  const modal = document.getElementById('newTaskModal');
  if (modal) {
    modal.classList.add('active');
  }
}

function closeNewTaskModal() {
  const modal = document.getElementById('newTaskModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// Attach Form Submit Listener
const newTaskForm = document.getElementById('newTaskForm');
if (newTaskForm) {
  newTaskForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('newTaskTitle').value;
    const desc = document.getElementById('newTaskDesc').value;
    const priority = document.getElementById('newTaskPriority').value;

    try {
      const supabase = window.HYNAOS_SUPABASE.getClient();
      if (!supabase) throw new Error("Supabase not initialized");

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) throw new Error("No active session");

      // Get authenticated user's full name to assign the task to themselves
      const profileRes = await supabase.from('profiles').select('full_name').eq('id', session.user.id).single();
      const fullName = profileRes.data ? profileRes.data.full_name : 'Unknown Employee';

      const newTask = {
        title: title,
        description: desc,
        priority: priority,
        status: 'To Do',
        assignee_id: fullName,
        project_id: 'Personal/Ad-Hoc', // Default fallback or can be omitted if nullable
      };

      const { error: insertError } = await supabase.from('tasks').insert([newTask]);
      if (insertError) throw insertError;

      // Reset & Close
      newTaskForm.reset();
      closeNewTaskModal();

      // Refresh Kanban to show new card
      if (typeof renderKanbanBoard === 'function') renderKanbanBoard();
      
      // Update Stats
      if (typeof updateEmployeeDashboardStatCards === 'function') updateEmployeeDashboardStatCards();
      if (typeof fetchBentoStats === 'function') fetchBentoStats();

      // Show toast if available
      if (typeof showToast === 'function') showToast('Task created successfully!', 'success');

    } catch (err) {
      console.error("Error creating new task:", err);
      if (typeof showToast === 'function') showToast('Failed to create task.', 'error');
    }
  });
}
