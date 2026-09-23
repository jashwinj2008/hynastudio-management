/**
 * HYNAOS — Admin Panel Main Controller
 * Hyna Studio Management System
 */



// State Holders
let employeesList = [];
let projectsList = [];






let tasksList = [];
let leavesList = [];

// Page Lifecycle Initialization
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Verify Admin Access Security
  await verifyAdminAccess();

  // 2. Initialize Navigation & Sidebar Toggle
  initNavigation();

  // 3. Render Dashboard Stat Cards & Tables
      populateProjectModalOptions();
  renderEmployeesTable();
  renderProjectsList();
  renderKanbanBoard();
  renderLeavesTable();
  renderSalariesTable();
  renderPerformanceTable();
  updateDashboardStatCards();
  fetchAdminBentoStats();

  // 4. Initialize Modals & Forms
  initModals();

  // 5. Initialize Lucide Icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});

/**
 * Verify Admin Security Access
 */
async function verifyAdminAccess() {
  const { getClient, isDemoMode } = window.HYNAOS_SUPABASE || {};

  // Check demo mode or real Supabase auth
  if (!isDemoMode || isDemoMode() || !getClient || !getClient()) {
    console.log("⚡ Admin Panel: Authorized (Demo Mode).");
    return;
  }

  try {
    const supabase = getClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      window.location.href = 'admin-login.html';
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      alert("Unauthorized Access: Administrator credentials required.");
      window.location.href = 'admin-login.html';
    }
  } catch (err) {
    console.error("Security check failed:", err);
  }
}

/**
 * Navigation Router & Sidebar Toggle
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

  // Sidebar Toggle Collapse & Mobile 3D Drawer Toggle
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

  // Tab Switcher
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTabId = link.getAttribute('data-tab');

      if (!targetTabId) return;

      // Update Nav Active State
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // Update Tab Views
      tabContents.forEach(tab => {
        tab.classList.remove('active');
        if (tab.id === `${targetTabId}Tab`) {
          tab.classList.add('active');
        }
      });

      // Close Mobile Drawer on selection
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
 * Render Employee Management Roster Table
 */

async function renderEmployeesTable() {
  const tbody = document.getElementById('employeeTableBody');
  if (!tbody) return;

  try {
    const supabase = window.HYNAOS_SUPABASE.getClient();
    if (!supabase) return;
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) throw new Error("No active session.");

    const { data: profiles, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    
    employeesList = profiles.map(e => ({
      id: e.employee_id || e.id,
      name: e.full_name,
      email: e.email,
      department: e.department,
      position: e.position,
      joiningDate: e.joined_at,
      status: e.status
    }));

    
    if (!profiles || profiles.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No employees found.</td></tr>';
      return;
    }

    tbody.innerHTML = profiles.map(e => {
      const initials = (e.full_name || 'U N').split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
      const statusClass = e.status === 'active' ? 'status-active' : 'status-inactive';
      return `
        <tr>
          <td>
            <div class="d-flex align-items-center">
              <div class="avatar-circle me-3">${initials}</div>
              <div>
                <div class="fw-bold text-white">${e.full_name || 'Unknown'}</div>
                <div class="text-muted small">${e.email}</div>
              </div>
            </div>
          </td>
          <td>${e.employee_id}</td>
          <td>${e.department || '-'}</td>
          <td>${e.position || '-'}</td>
          <td>${e.joined_at ? new Date(e.joined_at).toLocaleDateString() : '-'}</td>
          <td><span class="status-badge ${statusClass}">${e.status}</span></td>
          <td>
            <button class="btn btn-sm btn-outline-secondary me-1"><i data-lucide="edit-2"></i></button>
            <button class="btn btn-sm btn-outline-danger"><i data-lucide="trash-2"></i></button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error("Supabase RLS/Fetch Error [profiles]:", err);
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger"><i data-lucide="shield-alert"></i> Access Denied / Data Unavailable</td></tr>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}


/**
 * Render Projects List & Overview
 */

async function renderProjectsList() {
  const container = document.getElementById('projectsListContainer');
  if (!container) return;

  try {
    const supabase = window.HYNAOS_SUPABASE.getClient();
    if (!supabase) return;
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) throw new Error("No active session.");

    const { data: projects, error } = await supabase.from('projects').select('*');
    if (error) throw error;
    
    projectsList = projects;

    
    container.innerHTML = '';
    
    if (!projects || projects.length === 0) {
      container.innerHTML = '<div class="text-center text-muted p-4">No projects available.</div>';
      return;
    }

    projects.forEach(p => {
      const prog = p.progress || 0;
      const statusBadge = p.status === 'completed' ? 'status-active' : 'status-pending';
      const statusText = p.status === 'completed' ? 'Completed' : 'Active';

      const card = `
        <div class="col-md-6 col-lg-4 mb-4">
          <div class="glass-card h-100 position-relative project-card">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h5 class="mb-1">${p.project_name}</h5>
                <p class="text-muted small mb-0">${p.id}</p>
              </div>
              <span class="status-badge ${statusBadge}">${statusText}</span>
            </div>
            <p class="text-muted small line-clamp-2 mb-4">${p.description || ''}</p>
            <div class="d-flex justify-content-between text-muted small mb-2">
              <span>Progress</span>
              <span>${prog}%</span>
            </div>
            <div class="progress mb-4" style="height: 6px;">
              <div class="progress-bar ${prog === 100 ? 'bg-success' : 'bg-primary'}" role="progressbar" style="width: ${prog}%"></div>
            </div>
            <div class="d-flex justify-content-between align-items-center mt-auto border-top border-white-10 pt-3">
              <div class="small"><i data-lucide="calendar" class="me-1"></i> ${p.deadline || 'No deadline'}</div>
              <div class="small fw-bold text-primary"><i data-lucide="user" class="me-1"></i> ${p.manager_id || 'No manager'}</div>
            </div>
          </div>
        </div>
      `;
      container.innerHTML += card;
    });

  } catch (err) {
    console.error("Supabase RLS/Fetch Error [projects]:", err);
    container.innerHTML = `<div class="text-center text-danger p-4"><i data-lucide="shield-alert"></i> Access Denied / Data Unavailable</div>`;
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}


/**
 * Render Kanban Task Board
 */

async function renderKanbanBoard() {
  const todoCol = document.getElementById('todoTasks');
  const progCol = document.getElementById('progTasks');
  const revCol = document.getElementById('revTasks');
  const compCol = document.getElementById('compTasks');

  if (!todoCol || !progCol || !revCol || !compCol) return;

  try {
    const supabase = window.HYNAOS_SUPABASE.getClient();
    if (!supabase) return;
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) throw new Error("No active session.");

    const { data: tasks, error } = await supabase.from('tasks').select('*');
    if (error) throw error;
    
    tasksList = tasks;

    
    todoCol.innerHTML = '';
    progCol.innerHTML = '';
    revCol.innerHTML = '';
    compCol.innerHTML = '';

    if (!tasks || tasks.length === 0) {
      todoCol.innerHTML = '<p class="text-muted small">No tasks</p>';
      return;
    }

    tasks.forEach(t => {
      let badge = 'badge-primary';
      if(t.priority === 'urgent') badge = 'badge-danger';
      if(t.priority === 'high') badge = 'badge-warning';

      const html = `
        <div class="kanban-card" draggable="true" data-id="${t.id}">
          <div class="d-flex justify-content-between mb-2">
            <span class="badge ${badge}">${t.priority}</span>
            <span class="text-muted small">${t.id}</span>
          </div>
          <h6 class="mb-1">${t.task_title}</h6>
          <p class="text-muted small mb-2">${t.description}</p>
          <div class="d-flex align-items-center justify-content-between">
            <div class="text-primary small fw-bold"><i data-lucide="user" class="me-1"></i> ${t.assignee_id || 'Unassigned'}</div>
          </div>
        </div>
      `;

      if (t.status === 'todo') todoCol.innerHTML += html;
      else if (t.status === 'in_progress') progCol.innerHTML += html;
      else if (t.status === 'review') revCol.innerHTML += html;
      else if (t.status === 'completed') compCol.innerHTML += html;
      else todoCol.innerHTML += html; // Default
    });

  } catch (err) {
    console.error("Supabase RLS/Fetch Error [tasks]:", err);
    todoCol.innerHTML = `<div class="text-danger small"><i data-lucide="shield-alert"></i> Access Denied</div>`;
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}


/**
 * Advance Task Status on Click
 */
function advanceTaskStatus(taskId) {
  const task = tasksList.find(t => t.id === taskId);
  if (!task) return;

  const flow = ['todo', 'in_progress', 'review', 'completed'];
  const currentIndex = flow.indexOf(task.col);
  const nextIndex = (currentIndex + 1) % flow.length;
  task.col = flow[nextIndex];

  renderKanbanBoard();
}

/**
 * Render Leave Requests Table
 */

async function renderLeavesTable() {
  const tbody = document.getElementById('leaveTableBody');
  if (!tbody) return;

  try {
    const supabase = window.HYNAOS_SUPABASE.getClient();
    if (!supabase) return;
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) throw new Error("No active session.");

    const { data: leaves, error } = await supabase.from('leave_requests').select('*');
    if (error) throw error;
    
    leavesList = leaves;

    
    if (!leaves || leaves.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No leave requests available.</td></tr>';
      return;
    }

    tbody.innerHTML = leaves.map(l => {
      const statusClass = l.status === 'Approved' ? 'status-active' : (l.status === 'Rejected' ? 'status-inactive' : 'status-pending');
      return `
        <tr>
          <td><strong>${l.employee_id}</strong></td>
          <td>${l.type}</td>
          <td>${l.start_date} to ${l.end_date}</td>
          <td>${l.reason}</td>
          <td><span class="status-badge ${statusClass}">${l.status}</span></td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error("Supabase RLS/Fetch Error [leaves]:", err);
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger"><i data-lucide="shield-alert"></i> Access Denied / Data Unavailable</td></tr>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}


function updateLeaveStatus(leaveId, newStatus) {
  const leave = leavesList.find(l => l.id === leaveId);
  if (leave) {
    leave.status = newStatus;
    renderLeavesTable();
  }
}

/**
 * Render Salary Table
 */

async function renderSalariesTable() {
  const tbody = document.getElementById('salaryTableBody');
  if (!tbody) return;

  try {
    const supabase = window.HYNAOS_SUPABASE.getClient();
    if (!supabase) return;
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) throw new Error("No active session.");

    const { data: salaries, error } = await supabase.from('salaries').select('*');
    if (error) throw error;
    
    if (!salaries || salaries.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No salary data available.</td></tr>';
      return;
    }

    tbody.innerHTML = salaries.map(s => {
      const net = (s.basic_salary || 0) + (s.bonus || 0) - (s.deductions || 0);
      return `
        <tr>
          <td><strong>${s.employee_id}</strong></td>
          <td>₹ ${(s.basic_salary || 0).toLocaleString()}</td>
          <td>₹ ${(s.bonus || 0).toLocaleString()}</td>
          <td>₹ ${(s.deductions || 0).toLocaleString()}</td>
          <td><span class="status-badge ${s.status === 'Paid' ? 'status-active' : 'status-pending'}">${s.status || 'Pending'}</span></td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error("Supabase RLS/Fetch Error [salaries]:", err);
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger"><i data-lucide="shield-alert"></i> Access Denied / Data Unavailable</td></tr>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}


/**
 * Render Employee Performance Table
 */

async function renderPerformanceTable() {
  const tbody = document.getElementById('perfTableBody');
  if (!tbody) return;

  try {
    const supabase = window.HYNAOS_SUPABASE.getClient();
    if (!supabase) return;
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) throw new Error("No active session.");

    const { data: reviews, error } = await supabase.from('performance_reviews').select('*');
    if (error) throw error;
    
    if (!reviews || reviews.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No performance data available.</td></tr>';
      return;
    }

    tbody.innerHTML = reviews.map(r => {
      const isTop = r.score >= 4.5;
      return `
        <tr>
          <td><strong>${r.employee_id}</strong></td>
          <td>${r.review_date || 'N/A'}</td>
          <td>
            <div class="rating-stars">
              ${Array(Math.floor(r.score)).fill('<i data-lucide="star" class="text-warning"></i>').join('')}
              ${r.score % 1 !== 0 ? '<i data-lucide="star-half" class="text-warning"></i>' : ''}
              <span class="ms-1 fw-bold">${r.score}</span>
            </div>
          </td>
          <td>${r.comments || ''}</td>
          <td>${isTop ? '<span class="status-badge status-active">Top Performer</span>' : '<span class="status-badge status-pending">Average</span>'}</td>
          <td><button class="btn btn-sm btn-outline-secondary">Review</button></td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error("Supabase RLS/Fetch Error [performance]:", err);
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger"><i data-lucide="shield-alert"></i> Access Denied / Data Unavailable</td></tr>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}


/**
 * Edit Employee Action Handler
 */
function editEmployee(empId) {
  const emp = employeesList.find(e => e.id === empId);
  if (!emp) return;

  const modal = document.getElementById('editEmployeeModal');
  const idInput = document.getElementById('editEmpId');
  const nameInput = document.getElementById('editEmpName');
  const emailInput = document.getElementById('editEmpEmail');
  const deptInput = document.getElementById('editEmpDept');
  const posInput = document.getElementById('editEmpPosition');
  const statusInput = document.getElementById('editEmpStatus');

  if (idInput) idInput.value = emp.id;
  if (nameInput) nameInput.value = emp.name;
  if (emailInput) emailInput.value = emp.email;
  if (deptInput) deptInput.value = emp.department || 'Engineering';
  if (posInput) posInput.value = emp.position || 'Team Member';
  if (statusInput) statusInput.value = emp.status || 'active';

  if (modal) modal.classList.add('show');
}

/**
 * View Employee Profile Action Handler
 */
function viewEmployeeProfile(empId) {
  const emp = employeesList.find(e => e.id === empId);
  if (!emp) return;
  alert(`Employee Profile Details:\n\nName: ${emp.name}\nID: ${emp.id}\nEmail: ${emp.email}\nDepartment: ${emp.department}\nPosition: ${emp.position}\nStatus: ${emp.status}`);
}

/**
 * Dynamically Populate Project Modal Options (Lead Select & Members Checkbox Grid)
 */
function populateProjectModalOptions() {
  const leadSelect = document.getElementById('newProjectLead');
  const membersGrid = document.getElementById('newProjectMembersList');

  if (leadSelect) {
    const currentVal = leadSelect.value;
    leadSelect.innerHTML = `<option value="">-- Select Project Lead --</option>` +
      employeesList.map(emp => `<option value="${emp.name}">${emp.name} (${emp.position || emp.department})</option>`).join('');
    if (currentVal) leadSelect.value = currentVal;
  }

  if (membersGrid) {
    membersGrid.innerHTML = employeesList.map(emp => `
      <label class="checkbox-member-card">
        <input type="checkbox" name="projectMembers" value="${emp.name}" checked>
        <span>
          <strong>${emp.name}</strong>
          <small>${emp.position || emp.department}</small>
        </span>
      </label>
    `).join('');
  }
}

/**
 * Modals & Form Handlers
 */
function initModals() {
  // Add Employee Modal
  const addModal = document.getElementById('addEmployeeModal');
  const openAddBtn = document.getElementById('openAddEmpModalBtn');
  const closeAddBtn = document.getElementById('closeAddEmpModalBtn');
  const addForm = document.getElementById('addEmployeeForm');

  if (openAddBtn && addModal) {
    openAddBtn.addEventListener('click', () => addModal.classList.add('show'));
  }

  if (closeAddBtn && addModal) {
    closeAddBtn.addEventListener('click', () => addModal.classList.remove('show'));
  }

  if (addForm) {
    addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('newEmpName').value.trim();
      const email = document.getElementById('newEmpEmail').value.trim();
      const dept = document.getElementById('newEmpDept').value;
      const pos = document.getElementById('newEmpPosition').value.trim();

      if (!name || !email) return;

      const newEmp = {
        id: `EMP-${String(employeesList.length + 1).padStart(3, '0')}`,
        name,
        email,
        department: dept,
        position: pos || 'Team Member',
        joiningDate: new Date().toISOString().split('T')[0],
        status: 'active',
        initials: name.split(' ').map(n => n[0]).join('').toUpperCase()
      };

      employeesList.push(newEmp);
      saveEmployeesToStorage();
      try {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('hynaos_employees_updated'));
      } catch(err) {}

      populateProjectModalOptions();
      renderEmployeesTable();
      if (typeof updateDashboardStatCards === 'function') updateDashboardStatCards();
      addForm.reset();
      if (addModal) addModal.classList.remove('show');
      if (typeof showHynaToast === 'function') {
        showHynaToast(`Employee ${name} created!`, 'user-plus');
      } else {
        alert(`Employee ${name} created successfully!`);
      }
    });
  }

  // Edit Employee Modal
  const editModal = document.getElementById('editEmployeeModal');
  const closeEditBtn = document.getElementById('closeEditEmpModalBtn');
  const editForm = document.getElementById('editEmployeeForm');

  if (closeEditBtn && editModal) {
    closeEditBtn.addEventListener('click', () => editModal.classList.remove('show'));
  }

  if (editForm) {
    editForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const empId = document.getElementById('editEmpId').value;
      const name = document.getElementById('editEmpName').value.trim();
      const email = document.getElementById('editEmpEmail').value.trim();
      const dept = document.getElementById('editEmpDept').value;
      const pos = document.getElementById('editEmpPosition').value.trim();
      const status = document.getElementById('editEmpStatus').value;

      const empIndex = employeesList.findIndex(e => e.id === empId);
      if (empIndex !== -1) {
        const parts = name.split(' ').filter(Boolean);
        let initials = "HE";
        if (parts.length > 1) {
          initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        } else if (parts[0]) {
          initials = parts[0].substring(0, 2).toUpperCase();
        }

        employeesList[empIndex] = {
          ...employeesList[empIndex],
          name,
          email,
          department: dept,
          position: pos,
          status,
          initials
        };

        saveEmployeesToStorage();

        try {
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new Event('hynaos_employees_updated'));
        } catch(err) {}

        populateProjectModalOptions();
        renderEmployeesTable();
        if (typeof updateDashboardStatCards === 'function') updateDashboardStatCards();
        if (editModal) editModal.classList.remove('show');

        if (typeof showHynaToast === 'function') {
          showHynaToast(`Employee ${name} updated successfully!`, 'user-check');
        } else {
          alert(`Employee ${name} (${empId}) updated successfully!`);
        }
      }
    });
  }

  // Add Project Modal Handler
  const addProjModal = document.getElementById('addProjectModal');
  const openAddProjBtn = document.getElementById('openAddProjectModalBtn');
  const closeAddProjBtn = document.getElementById('closeAddProjectModalBtn');
  const addProjForm = document.getElementById('addProjectForm');

  if (openAddProjBtn && addProjModal) {
    openAddProjBtn.addEventListener('click', () => {
      populateProjectModalOptions();
      addProjModal.classList.add('show');
    });
  }

  if (closeAddProjBtn && addProjModal) {
    closeAddProjBtn.addEventListener('click', () => addProjModal.classList.remove('show'));
  }

  if (addProjForm) {
    addProjForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('newProjectName').value.trim();
      const lead = document.getElementById('newProjectLead').value;
      const deadline = document.getElementById('newProjectDeadline').value;
      const descEl = document.getElementById('newProjectDesc') || document.getElementById('newProjectDescription');
      const description = descEl ? descEl.value.trim() : '';

      const memberCheckboxes = document.querySelectorAll('input[name="projectMembers"]:checked');
      let selectedMembers = Array.from(memberCheckboxes).map(cb => cb.value);

      if (!name || !lead) {
        alert("Please enter project name and select a project lead.");
        return;
      }

      // If no members selected, default to all team members
      if (selectedMembers.length === 0 && Array.isArray(employeesList)) {
        selectedMembers = employeesList.map(emp => emp.name);
      }

      // Ensure Lead is in assignedMembers array
      if (!selectedMembers.includes(lead)) {
        selectedMembers.unshift(lead);
      }

      const newProject = {
        id: `PRJ-${100 + projectsList.length + 1}`,
        name: name,
        manager: lead,
        lead: lead,
        assignedMembers: selectedMembers,
        progress: 0,
        deadline: deadline || "TBD",
        status: "active",
        description: description || "No description provided."
      };

      projectsList.push(newProject);
      saveProjectsToStorage();
      renderProjectsList();
      if (typeof updateDashboardStatCards === 'function') {
        updateDashboardStatCards();
      }

      // Dispatch custom events for cross-tab & live sync
      try {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('hynaos_projects_updated'));
      } catch(err) {}

      addProjForm.reset();
      if (addProjModal) addProjModal.classList.remove('show');

      if (typeof showHynaToast === 'function') {
        showHynaToast(`Project "${name}" created successfully!`, 'folder-plus');
      } else {
        alert(`Project "${name}" created successfully and assigned to team members!`);
      }
    });
  }

  // Edit Project Modal Handler
  const editProjModal = document.getElementById('editProjectModal');
  const closeEditProjBtn = document.getElementById('closeEditProjectModalBtn');
  const editProjForm = document.getElementById('editProjectForm');

  if (closeEditProjBtn && editProjModal) {
    closeEditProjBtn.addEventListener('click', () => editProjModal.classList.remove('show'));
  }

  if (editProjForm) {
    editProjForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('editProjectId').value;
      const name = document.getElementById('editProjectName').value.trim();
      const lead = document.getElementById('editProjectLead').value;
      const status = document.getElementById('editProjectStatus').value;
      const progress = parseInt(document.getElementById('editProjectProgress').value) || 0;
      const deadline = document.getElementById('editProjectDeadline').value;
      const description = document.getElementById('editProjectDesc').value.trim();

      const memberCheckboxes = document.querySelectorAll('input[name="editProjectMembers"]:checked');
      let selectedMembers = Array.from(memberCheckboxes).map(cb => cb.value);

      if (!name || !lead) {
        alert("Please enter project name and select a project lead.");
        return;
      }

      if (!selectedMembers.includes(lead)) {
        selectedMembers.unshift(lead);
      }

      const index = projectsList.findIndex(p => p.id === id);
      if (index !== -1) {
        projectsList[index] = {
          ...projectsList[index],
          name,
          manager: lead,
          lead,
          status,
          progress,
          deadline,
          description,
          assignedMembers: selectedMembers
        };

        saveProjectsToStorage();
        renderProjectsList();
        if (typeof updateDashboardStatCards === 'function') updateDashboardStatCards();

        try {
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new Event('hynaos_projects_updated'));
        } catch(err) {}

        if (editProjModal) editProjModal.classList.remove('show');
        if (typeof showHynaToast === 'function') {
          showHynaToast(`Project "${name}" updated successfully!`, 'edit-3');
        } else {
          alert(`Project "${name}" updated successfully!`);
        }
      }
    });
  }
}

// Global functions exports
window.advanceTaskStatus = advanceTaskStatus;
window.updateLeaveStatus = updateLeaveStatus;
window.renderEmployeesTable = renderEmployeesTable;
window.editEmployee = editEmployee;
window.viewEmployeeProfile = viewEmployeeProfile;
window.populateProjectModalOptions = populateProjectModalOptions;

/**
 * Update Dashboard Stat Cards dynamically
 */

async function updateDashboardStatCards() {
  try {
    const supabase = window.HYNAOS_SUPABASE.getClient();
    if (!supabase) return;
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) return;

    // We can fetch analytics_metrics table or just display counts.
    // Assuming simple counts via RLS for demo if needed, but since it's a UI update, let's gracefully fail if RLS rejects
    const { count: empCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: prjCount } = await supabase.from('projects').select('*', { count: 'exact', head: true });
    
    const empElem = document.getElementById('statTotalEmployees');
    const prjElem = document.getElementById('statActiveProjects');
    
    if (empElem && empCount !== null) empElem.textContent = empCount;
    if (prjElem && prjCount !== null) prjElem.textContent = prjCount;
    
  } catch (err) {
    console.error("Supabase RLS/Fetch Error [stats]:", err);
  }
}

async function fetchAdminBentoStats() {
  try {
    const supabase = window.HYNAOS_SUPABASE.getClient();
    if (!supabase) return;

    const { count: empCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: prjCount } = await supabase.from('projects').select('*', { count: 'exact', head: true });
    const { count: leavesCount } = await supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'Pending');
    
    const empElem = document.getElementById('bento-total-employees');
    const prjElem = document.getElementById('bento-active-projects');
    const leaveElem = document.getElementById('bento-pending-leaves');
    
    if (empElem && empCount !== null) empElem.textContent = empCount;
    if (prjElem && prjCount !== null) prjElem.textContent = prjCount;
    if (leaveElem && leavesCount !== null) leaveElem.textContent = leavesCount;
  } catch (err) {
    console.error("Bento Stats Error:", err);
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
  console.log("🔄 Refreshing all Admin Dashboard data...");

  // Trigger spin animation on refresh button icons
  const refreshIcons = document.querySelectorAll('#navRefreshBtn i, #pageRefreshBtn i');
  refreshIcons.forEach(icon => icon.classList.add('spin-icon'));

  // 1. Reload data state
  
  // 2. Re-render all view tables and components
  if (typeof renderEmployeesTable === 'function') renderEmployeesTable();
  if (typeof renderProjectsList === 'function') renderProjectsList();
  if (typeof renderKanbanBoard === 'function') renderKanbanBoard();
  if (typeof renderLeavesTable === 'function') renderLeavesTable();
  if (typeof renderSalariesTable === 'function') renderSalariesTable();
  if (typeof renderPerformanceTable === 'function') renderPerformanceTable();
  if (typeof populateProjectModalOptions === 'function') populateProjectModalOptions();

  // 3. Update Stat Cards
  updateDashboardStatCards();

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

/**
 * Delete Project Handler
 */
function deleteProject(projectId) {
  const prj = projectsList.find(p => p.id === projectId);
  if (!prj) return;

  const confirmed = confirm(`Are you sure you want to delete project "${prj.name}"?`);
  if (!confirmed) return;

  projectsList = projectsList.filter(p => p.id !== projectId);
  saveProjectsToStorage();
  renderProjectsList();
  if (typeof updateDashboardStatCards === 'function') {
    updateDashboardStatCards();
  }

  try {
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('hynaos_projects_updated'));
  } catch(e) {}

  if (typeof showHynaToast === 'function') {
    showHynaToast(`Project "${prj.name}" deleted successfully`, 'trash-2');
  } else {
    alert(`Project "${prj.name}" deleted successfully.`);
  }
}

/**
 * Edit Project Action Handler
 */
function editProject(projectId) {
  const prj = projectsList.find(p => p.id === projectId);
  if (!prj) return;

  const modal = document.getElementById('editProjectModal');
  const idInput = document.getElementById('editProjectId');
  const nameInput = document.getElementById('editProjectName');
  const leadSelect = document.getElementById('editProjectLead');
  const statusSelect = document.getElementById('editProjectStatus');
  const progressInput = document.getElementById('editProjectProgress');
  const deadlineInput = document.getElementById('editProjectDeadline');
  const descInput = document.getElementById('editProjectDesc');
  const membersGrid = document.getElementById('editProjectMembersList');

  if (idInput) idInput.value = prj.id;
  if (nameInput) nameInput.value = prj.name || '';
  if (statusSelect) statusSelect.value = prj.status || 'active';
  if (progressInput) progressInput.value = prj.progress || 0;
  if (deadlineInput) deadlineInput.value = prj.deadline || '';
  if (descInput) descInput.value = prj.description || '';

  // Populate Leads Select
  if (leadSelect) {
    leadSelect.innerHTML = `<option value="">-- Select Project Lead --</option>` +
      employeesList.map(emp => `<option value="${emp.name}">${emp.name} (${emp.position || emp.department})</option>`).join('');
    leadSelect.value = prj.lead || prj.manager || '';
  }

  // Populate Members Checkbox Grid
  if (membersGrid) {
    const assigned = (prj.assignedMembers || []).map(m => String(m).toLowerCase().trim());
    membersGrid.innerHTML = employeesList.map(emp => {
      const isChecked = assigned.some(a => a === emp.name.toLowerCase().trim());
      return `
        <label class="checkbox-member-card">
          <input type="checkbox" name="editProjectMembers" value="${emp.name}" ${isChecked ? 'checked' : ''}>
          <span>
            <strong>${emp.name}</strong>
            <small>${emp.position || emp.department}</small>
          </span>
        </label>
      `;
    }).join('');
  }

  if (modal) {
    modal.classList.add('show');
  }
}

window.editProject = editProject;
window.deleteProject = deleteProject;
window.refreshAllDashboardData = refreshAllDashboardData;
window.refreshAll = refreshAllDashboardData;
window.showHynaToast = showHynaToast;

// Auto-sync projects on storage update
window.addEventListener('storage', (e) => {
  if (!e.key || e.key === 'hynaos_projects_list') {
        renderProjectsList();
    updateDashboardStatCards();
  }
});
window.addEventListener('hynaos_projects_updated', () => {
    renderProjectsList();
  updateDashboardStatCards();
});



