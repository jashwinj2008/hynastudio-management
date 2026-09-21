// Logged In Employee Personal Scoped Profile (Default fallback)
let CURRENT_EMPLOYEE = {
  id: "EMP-008",
  name: "Rohit V",
  email: "rohit@hynastudio.com",
  role: "employee",
  position: "Full Stack Developer",
  department: "Engineering",
  joiningDate: "2024-03-10",
  phone: "+91 98765 43210",
  status: "active",
  initials: "RV"
};

// Dynamically Load User Profile from Session / LocalStorage
function loadUserFromStorage() {
  try {
    const stored = localStorage.getItem('hynaos_current_user');
    if (stored) {
      const u = JSON.parse(stored);
      const name = u.full_name || u.name || "Employee";
      const parts = name.trim().split(' ').filter(Boolean);
      let initials = "HE";
      if (parts.length > 1) {
        initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      } else if (parts[0]) {
        initials = parts[0].substring(0, 2).toUpperCase();
      }

      const empId = u.employee_id || u.id || "EMP-008";
      const savedAvatar = localStorage.getItem('hynaos_profile_avatar_' + empId) || u.avatar_url || u.avatar || null;

      CURRENT_EMPLOYEE = {
        id: empId,
        name: name,
        email: u.email || "",
        role: u.role || "employee",
        position: u.position || "Team Member",
        department: u.department || "Hyna Studio",
        joiningDate: u.joining_date || u.joiningDate || "2024-03-10",
        phone: u.phone || "+91 98765 43210",
        status: u.status || "active",
        initials: initials,
        avatarUrl: savedAvatar
      };
    }
  } catch(e) {
    console.warn("Failed to parse stored user profile:", e);
  }

  // Also check if profile was updated by admin in hynaos_employees_list
  try {
    const empListStr = localStorage.getItem('hynaos_employees_list');
    if (empListStr) {
      const list = JSON.parse(empListStr);
      const match = list.find(e => e.id === CURRENT_EMPLOYEE.id || (e.email && e.email.toLowerCase() === CURRENT_EMPLOYEE.email.toLowerCase()));
      if (match) {
        CURRENT_EMPLOYEE.name = match.name || CURRENT_EMPLOYEE.name;
        CURRENT_EMPLOYEE.email = match.email || CURRENT_EMPLOYEE.email;
        CURRENT_EMPLOYEE.position = match.position || CURRENT_EMPLOYEE.position;
        CURRENT_EMPLOYEE.department = match.department || CURRENT_EMPLOYEE.department;
        CURRENT_EMPLOYEE.status = match.status || CURRENT_EMPLOYEE.status;
        if (match.phone) CURRENT_EMPLOYEE.phone = match.phone;

        const parts = CURRENT_EMPLOYEE.name.trim().split(' ').filter(Boolean);
        if (parts.length > 1) {
          CURRENT_EMPLOYEE.initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        } else if (parts[0]) {
          CURRENT_EMPLOYEE.initials = parts[0].substring(0, 2).toUpperCase();
        }
      }
    }
  } catch(e) {}
}

function saveUserToStorage() {
  try {
    const stored = localStorage.getItem('hynaos_current_user');
    let u = stored ? JSON.parse(stored) : {};
    u.full_name = CURRENT_EMPLOYEE.name;
    u.name = CURRENT_EMPLOYEE.name;
    u.email = CURRENT_EMPLOYEE.email;
    u.position = CURRENT_EMPLOYEE.position;
    u.department = CURRENT_EMPLOYEE.department;
    u.phone = CURRENT_EMPLOYEE.phone;
    if (CURRENT_EMPLOYEE.avatarUrl) u.avatar_url = CURRENT_EMPLOYEE.avatarUrl;

    localStorage.setItem('hynaos_current_user', JSON.stringify(u));

    // Also update in hynaos_employees_list
    const empListStr = localStorage.getItem('hynaos_employees_list');
    let list = empListStr ? JSON.parse(empListStr) : [];
    const idx = list.findIndex(e => e.id === CURRENT_EMPLOYEE.id || (e.email && e.email.toLowerCase() === CURRENT_EMPLOYEE.email.toLowerCase()));
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        name: CURRENT_EMPLOYEE.name,
        email: CURRENT_EMPLOYEE.email,
        position: CURRENT_EMPLOYEE.position,
        department: CURRENT_EMPLOYEE.department,
        phone: CURRENT_EMPLOYEE.phone
      };
      localStorage.setItem('hynaos_employees_list', JSON.stringify(list));
    }
  } catch(e) {
    console.warn("Failed to save user to storage:", e);
  }
}

// Scoped Personal Assigned Projects
const MY_PROJECTS = [
  { id: "PRJ-101", name: "HYNAOS Core Platform", manager: "Dharshan J M", progress: 85, deadline: "2026-09-30", status: "active" },
  { id: "PRJ-102", name: "Hyna Studio Rebrand", manager: "Tharun Krishna", progress: 95, deadline: "2026-09-15", status: "active" },
  { id: "PRJ-105", name: "Mobile Workspace App", manager: "Rohit V", progress: 40, deadline: "2026-11-01", status: "active" }
];

// Scoped Personal Assigned Tasks
let myTasksList = [
  {
    id: "TSK-03",
    title: "Kanban Board Drag & Drop",
    project: "HYNAOS Core Platform",
    priority: "urgent",
    deadline: "2026-09-12",
    status: "In Progress",
    progress: 75,
    desc: "Build interactive task movement for Admin & Employee panels."
  },
  {
    id: "TSK-08",
    title: "Mobile Workspace Navigation",
    project: "Mobile Workspace App",
    priority: "high",
    deadline: "2026-09-20",
    status: "To Do",
    progress: 10,
    desc: "Implement responsive bottom navigation bar for mobile layout."
  },
  {
    id: "TSK-09",
    title: "Supabase Client Error Handling",
    project: "HYNAOS Core Platform",
    priority: "medium",
    deadline: "2026-09-14",
    status: "Review",
    progress: 90,
    desc: "Wrap auth exceptions and present clean toast alerts."
  }
];

// Scoped Personal Work Logs
let myWorkLogs = [
  { id: "WLOG-1", title: "Configured Employee Panel Security Scoping", project: "HYNAOS Core Platform", task: "Security Validation", date: "Today, 10:30 AM", status: "Submitted for Review" },
  { id: "WLOG-2", title: "Built Check-In Attendance Counter", project: "HYNAOS Core Platform", task: "Attendance Module", date: "Yesterday, 04:45 PM", status: "Approved" }
];

// Scoped Personal Leave Requests
let myLeaveRequests = [
  { id: "LV-1", type: "Sick Leave", dates: "Sep 10 - Sep 11", reason: "Medical Appointment", status: "Pending", comments: "Awaiting HR review" },
  { id: "LV-4", type: "Casual Leave", dates: "Aug 05 - Aug 06", reason: "Personal Work", status: "Approved", comments: "Approved by Asthamil" }
];

// Scoped Personal Attendance State
let attendanceState = {
  isCheckedIn: false,
  checkInTime: null,
  checkOutTime: null,
  workingSeconds: 0,
  timerInterval: null
};

function loadEmployeeDataFromStorage() {
  const empId = CURRENT_EMPLOYEE.id || "EMP-008";
  
  // 1. Tasks
  try {
    const savedTasks = localStorage.getItem(`hynaos_tasks_${empId}`);
    if (savedTasks) {
      myTasksList = JSON.parse(savedTasks);
    }
  } catch(e) {}

  // 2. Work Logs
  try {
    const savedLogs = localStorage.getItem(`hynaos_worklogs_${empId}`);
    if (savedLogs) {
      myWorkLogs = JSON.parse(savedLogs);
    }
  } catch(e) {}

  // 3. Leave Requests
  try {
    const savedLeaves = localStorage.getItem(`hynaos_leaves_${empId}`);
    if (savedLeaves) {
      myLeaveRequests = JSON.parse(savedLeaves);
    }
  } catch(e) {}
}

function saveEmployeeDataToStorage() {
  const empId = CURRENT_EMPLOYEE.id || "EMP-008";
  try {
    localStorage.setItem(`hynaos_tasks_${empId}`, JSON.stringify(myTasksList));
    localStorage.setItem(`hynaos_worklogs_${empId}`, JSON.stringify(myWorkLogs));
    localStorage.setItem(`hynaos_leaves_${empId}`, JSON.stringify(myLeaveRequests));
  } catch(e) {}
}

// Page Lifecycle Initialization
document.addEventListener('DOMContentLoaded', async () => {
  // 0. Load Dynamic Logged In User Profile
  loadUserFromStorage();
  loadEmployeeDataFromStorage();

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

function loadAllProjects() {
  try {
    const stored = localStorage.getItem('hynaos_projects_list');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch(e) {
    console.warn("Failed to load projects from storage:", e);
  }
  return [
    { id: "PRJ-101", name: "HYNAOS Core Platform", manager: "Dharshan J M", lead: "Dharshan J M", assignedMembers: ["Dharshan J M", "Rohit V", "Thivan", "Anzarutheen"], progress: 85, deadline: "2026-09-30", status: "active", description: "Core enterprise platform for Hyna Studio." },
    { id: "PRJ-102", name: "Hyna Studio Rebrand", manager: "Tharun Krishna", lead: "Tharun Krishna", assignedMembers: ["Tharun Krishna", "Linciya", "Mohamed Arshiya"], progress: 95, deadline: "2026-09-15", status: "active", description: "Visual identity design update and brand system." },
    { id: "PRJ-103", name: "Growth Engine & CRM", manager: "Muhammed Zarif", lead: "Muhammed Zarif", assignedMembers: ["Muhammed Zarif", "Linciya", "New Appointment"], progress: 60, deadline: "2026-10-15", status: "active", description: "Generative AI marketing copy suite." },
    { id: "PRJ-104", name: "Product Design System", manager: "Mohamed Arshiya", lead: "Mohamed Arshiya", assignedMembers: ["Mohamed Arshiya", "Tharun Krishna"], progress: 100, deadline: "2026-08-30", status: "completed", description: "Design token library and Web UI assets." },
    { id: "PRJ-105", name: "Mobile Workspace App", manager: "Rohit V", lead: "Rohit V", assignedMembers: ["Rohit V", "Akshaya", "Thivan"], progress: 40, deadline: "2026-11-01", status: "active", description: "Mobile application for field attendance and tasks." }
  ];
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

    // Persist in localStorage
    try {
      localStorage.setItem('hynaos_profile_avatar_' + CURRENT_EMPLOYEE.id, dataUrl);
      
      const stored = localStorage.getItem('hynaos_current_user');
      if (stored) {
        const u = JSON.parse(stored);
        u.avatar_url = dataUrl;
        localStorage.setItem('hynaos_current_user', JSON.stringify(u));
      }
    } catch(err) {
      console.warn('Could not save avatar to localStorage:', err);
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
    localStorage.removeItem('hynaos_profile_avatar_' + CURRENT_EMPLOYEE.id);
    
    const stored = localStorage.getItem('hynaos_current_user');
    if (stored) {
      const u = JSON.parse(stored);
      delete u.avatar_url;
      localStorage.setItem('hynaos_current_user', JSON.stringify(u));
    }
  } catch(err) {
    console.warn('Could not remove avatar from localStorage:', err);
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

  saveUserToStorage();
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
  loadUserFromStorage();
  if (typeof loadAllProjects === 'function') loadAllProjects();

  // 2. Re-render all view tables and components
  if (typeof renderMyTasks === 'function') renderMyTasks();
  if (typeof renderMyProjects === 'function') renderMyProjects();
  if (typeof renderMyWorkLogs === 'function') renderMyWorkLogs();
  if (typeof renderMyLeaves === 'function') renderMyLeaves();
  if (typeof renderMyProfile === 'function') renderMyProfile();

  // 3. Update Stat Cards
  updateEmployeeDashboardStatCards();

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


