import re
import os

def replace_function(file_path, func_name, new_func_code):
    with open(file_path, 'r') as f:
        content = f.read()

    # Find the function definition
    pattern = r'(?:async\s+)?function\s+' + func_name + r'\s*\([^)]*\)\s*\{'
    match = re.search(pattern, content)
    if not match:
        print(f"Function {func_name} not found in {file_path}")
        return False

    start_idx = match.start()
    
    # Find the matching closing brace
    brace_count = 0
    end_idx = -1
    for i in range(match.end() - 1, len(content)):
        if content[i] == '{':
            brace_count += 1
        elif content[i] == '}':
            brace_count -= 1
            if brace_count == 0:
                end_idx = i + 1
                break

    if end_idx == -1:
        print(f"Could not find matching brace for {func_name} in {file_path}")
        return False

    # Replace the chunk
    new_content = content[:start_idx] + new_func_code + content[end_idx:]
    
    with open(file_path, 'w') as f:
        f.write(new_content)
    
    print(f"Successfully replaced {func_name} in {file_path}")
    return True

# Now we will define the new functions and replace them!

# ==========================================
# ADMIN PANEL FUNCTIONS
# ==========================================

render_salaries_admin = """
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
"""

render_perf_admin = """
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
"""

render_leaves_admin = """
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
"""

render_kanban_admin = """
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
"""

render_projects_admin = """
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
"""

render_employees_admin = """
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
"""

update_dash_admin = """
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
"""


replace_function("js/admin-panel.js", "renderSalariesTable", render_salaries_admin)
replace_function("js/admin-panel.js", "renderPerformanceTable", render_perf_admin)
replace_function("js/admin-panel.js", "renderLeavesTable", render_leaves_admin)
replace_function("js/admin-panel.js", "renderKanbanBoard", render_kanban_admin)
replace_function("js/admin-panel.js", "renderProjectsList", render_projects_admin)
replace_function("js/admin-panel.js", "renderEmployeesTable", render_employees_admin)
replace_function("js/admin-panel.js", "updateDashboardStatCards", update_dash_admin)

# ==========================================
# EMPLOYEE PANEL FUNCTIONS
# ==========================================

render_tasks_emp = """
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
"""

render_proj_emp = """
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
"""

render_worklogs_emp = """
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
"""

render_leaves_emp = """
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
"""

render_profile_emp = """
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
"""

update_dash_emp = """
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
"""

replace_function("js/employee-panel.js", "renderMyTasks", render_tasks_emp)
replace_function("js/employee-panel.js", "renderMyProjects", render_proj_emp)
replace_function("js/employee-panel.js", "renderMyWorkLogs", render_worklogs_emp)
replace_function("js/employee-panel.js", "renderMyLeaves", render_leaves_emp)
replace_function("js/employee-panel.js", "renderMyProfile", render_profile_emp)
replace_function("js/employee-panel.js", "updateEmployeeDashboardStatCards", update_dash_emp)
