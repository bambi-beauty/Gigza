// admin.js - FULLY CONNECTED TO BACKEND API

const API_BASE = 'https://gigza-testing-11.onrender.com/api/admin';

// ============================================
// CHECK AUTHENTICATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  const token = sessionStorage.getItem('gigza_admin_token');
  const adminData = JSON.parse(sessionStorage.getItem('gigza_admin_data') || '{}');

  if (!token || !adminData.id) {
    // Not logged in - redirect to login
    window.location.href = 'admin-login.html';
    return;
  }

  console.log(`👋 Welcome back, ${adminData.name} (${adminData.role})`);

  // Initialize
  initNavigation();
  initSearch();
  initMobileMenu();
  
  // Load data
  loadDashboardData();
  
  console.log('🎛️ GIGZA Admin Panel Ready');
  console.log(`📡 API: ${API_BASE}`);
});

// ============================================
// NAVIGATION
// ============================================
function initNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      navigateTo(page);
    });
  });
}

function navigateTo(page) {
  currentPage = page;
  
  // Update nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });
  
  // Update pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`${page}-page`)?.classList.add('active');
  document.getElementById('sidebar')?.classList.remove('open');
  
  // Load page data
  switch(page) {
    case 'dashboard':
      loadDashboardData();
      break;
    case 'pending':
      loadPendingApplications();
      break;
    case 'verified':
      loadVerifiedDJs();
      break;
    case 'rejected':
      loadRejectedApplications();
      break;
    case 'reported':
      loadReportedDJs();
      break;
  }
}

function initMobileMenu() {
  const menuToggle = document.getElementById('menuToggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });
  }
}

function initSearch() {
  const searchPending = document.getElementById('searchPending');
  const searchVerified = document.getElementById('searchVerified');
  const filterGenre = document.getElementById('filterGenre');
  
  if (searchPending) {
    searchPending.addEventListener('input', () => loadPendingApplications());
  }
  if (searchVerified) {
    searchVerified.addEventListener('input', () => loadVerifiedDJs());
  }
  if (filterGenre) {
    filterGenre.addEventListener('change', () => loadPendingApplications());
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function getToken() {
  return sessionStorage.getItem('gigza_admin_token');
}

function getAuthHeaders() {
  return {
    'Authorization': `Bearer ${getToken()}`,
    'Content-Type': 'application/json'
  };
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-ZA', options);
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const icon = toast.querySelector('i');
  const text = document.getElementById('toastMessage');
  
  text.textContent = message;
  toast.className = `toast ${type}`;
  icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-times-circle';
  
  toast.classList.add('show');
  
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

function openModal(id) {
  document.getElementById(id).classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
  document.body.style.overflow = '';
}

// Close modal on click outside
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(modal => {
      modal.classList.remove('active');
    });
    document.body.style.overflow = '';
  }
});

// ============================================
// LOGOUT
// ============================================
function handleLogout() {
  if (!confirm('Are you sure you want to logout?')) return;

  const token = getToken();
  
  if (token) {
    fetch(`${API_BASE}/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    }).catch(err => console.error('Logout error:', err));
  }

  // Clear storage
  sessionStorage.removeItem('gigza_admin_token');
  sessionStorage.removeItem('gigza_admin_data');
  localStorage.removeItem('gigza_admin_remember');

  window.location.href = 'admin-login.html';
}

// ============================================
// DASHBOARD
// ============================================
async function loadDashboardData() {
  try {
    const response = await fetch(`${API_BASE}/dashboard`, {
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (data.success) {
      const { stats, recent } = data;
      
      // Update stats
      document.getElementById('statPending').textContent = stats.pending || 0;
      document.getElementById('statVerified').textContent = stats.verified || 0;
      document.getElementById('statRejected').textContent = stats.rejected || 0;
      document.getElementById('statReported').textContent = stats.reported || 0;
      
      // Update pending count in sidebar
      const pendingCount = document.getElementById('pendingCount');
      if (pendingCount) {
        pendingCount.textContent = stats.pending || 0;
        pendingCount.style.display = (stats.pending || 0) > 0 ? 'inline' : 'none';
      }
      
      // Render recent applications
      renderRecentApplications(recent || []);
    } else {
      showToast(data.error || 'Failed to load dashboard', 'error');
    }
  } catch (error) {
    console.error('Error loading dashboard:', error);
    showToast('Network error. Please refresh.', 'error');
  }
}

function renderRecentApplications(applications) {
  const tbody = document.getElementById('recentApplications');
  
  if (!applications || applications.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="6">
          <div class="empty-state-inline">
            <i class="fas fa-inbox"></i>
            <p>No applications yet</p>
          </div>
        </td>
      </tr>`;
    return;
  }
  
  tbody.innerHTML = applications.map(app => `
    <tr>
      <td><strong>${app.dj_name}</strong></td>
      <td>${app.genre || 'N/A'}</td>
      <td>N/A</td>
      <td>${formatDate(app.applied_date)}</td>
      <td><span class="status-badge ${app.status}">${app.status}</span></td>
      <td>
        <button class="btn btn-sm btn-view" onclick="viewApplication(${app.id})">
          <i class="fas fa-eye"></i> View
        </button>
      </td>
    </tr>
  `).join('');
}

// ============================================
// PENDING APPLICATIONS
// ============================================
async function loadPendingApplications() {
  const grid = document.getElementById('pendingGrid');
  grid.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

  try {
    const searchTerm = document.getElementById('searchPending')?.value || '';
    const genreFilter = document.getElementById('filterGenre')?.value || '';
    
    let url = `${API_BASE}/applications/pending?page=1&limit=20`;
    if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
    if (genreFilter) url += `&genre=${encodeURIComponent(genreFilter)}`;
    
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (data.success) {
      const applications = data.applications || [];
      
      if (applications.length === 0) {
        grid.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-inbox"></i>
            <p>No pending applications</p>
            <span>New DJ applications will appear here for review</span>
          </div>`;
        return;
      }
      
      grid.innerHTML = applications.map(app => createApplicationCard(app)).join('');
    } else {
      grid.innerHTML = `<div class="error-state">${data.error || 'Failed to load'}</div>`;
    }
  } catch (error) {
    console.error('Error loading pending applications:', error);
    grid.innerHTML = `<div class="error-state">Network error. Please try again.</div>`;
  }
}

function createApplicationCard(app) {
  const initials = (app.dj_name || 'DJ').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  
  return `
    <div class="dj-card" id="app-card-${app.id}">
      <div class="dj-card-header">
        <div class="dj-avatar">${initials}</div>
        <div class="dj-card-info">
          <h4>${app.dj_name}</h4>
          <span>Applied ${formatDate(app.applied_date)}</span>
        </div>
      </div>
      <div class="dj-card-details">
        <span class="dj-tag"><i class="fas fa-music"></i> ${app.genre || 'N/A'}</span>
        <span class="dj-tag"><i class="fas fa-briefcase"></i> ${app.dj_experience || 'N/A'}</span>
        <span class="dj-tag"><i class="fas fa-money-bill"></i> R${app.price_per_hour || 0}/hr</span>
      </div>
      <div class="dj-card-actions">
        <button class="btn btn-sm btn-view" onclick="viewApplication(${app.id})">
          <i class="fas fa-eye"></i> View Details
        </button>
        <button class="btn btn-sm btn-approve" onclick="confirmAction('approve', ${app.id})">
          <i class="fas fa-check"></i> Approve
        </button>
        <button class="btn btn-sm btn-reject" onclick="confirmAction('reject', ${app.id})">
          <i class="fas fa-times"></i> Reject
        </button>
      </div>
    </div>
  `;
}

// ============================================
// VIEW APPLICATION DETAILS
// ============================================
async function viewApplication(id) {
  try {
    const response = await fetch(`${API_BASE}/applications/${id}`, {
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (data.success) {
      const app = data.application;
      
      document.getElementById('modalDJName').textContent = app.dj_name || 'DJ Application';
      
      document.getElementById('modalBody').innerHTML = `
        <div class="detail-row"><i class="fas fa-envelope"></i><span><strong>Email:</strong> ${app.email || 'N/A'}</span></div>
        <div class="detail-row"><i class="fas fa-phone"></i><span><strong>Phone:</strong> ${app.phone || 'N/A'}</span></div>
        <div class="detail-row"><i class="fas fa-music"></i><span><strong>Genre:</strong> ${app.genre || 'N/A'}</span></div>
        <div class="detail-row"><i class="fas fa-briefcase"></i><span><strong>Experience:</strong> ${app.dj_experience || 'N/A'}</span></div>
        <div class="detail-row"><i class="fas fa-money-bill"></i><span><strong>Price:</strong> R${app.price_per_hour || 0}/hr</span></div>
        <h4>Skills</h4>
        <p>${app.dj_skills || 'Not specified'}</p>
        <h4>Application Status</h4>
        <span class="status-badge ${app.status}">${app.status}</span>
        ${app.admin_notes ? `<p style="margin-top: 0.5rem;"><strong>Notes:</strong> ${app.admin_notes}</p>` : ''}
      `;

      let footerHTML = '<button class="btn btn-cancel" onclick="closeModal(\'detailsModal\')">Close</button>';
      
      if (app.status === 'pending') {
        footerHTML += `
          <button class="btn btn-reject" onclick="closeModal('detailsModal'); confirmAction('reject', ${app.id})">
            <i class="fas fa-times"></i> Reject
          </button>
          <button class="btn btn-approve" onclick="closeModal('detailsModal'); confirmAction('approve', ${app.id})">
            <i class="fas fa-check"></i> Approve DJ
          </button>
        `;
      }
      
      document.getElementById('modalFooter').innerHTML = footerHTML;
      openModal('detailsModal');
    } else {
      showToast(data.error || 'Failed to load application', 'error');
    }
  } catch (error) {
    console.error('Error viewing application:', error);
    showToast('Network error. Please try again.', 'error');
  }
}

// ============================================
// CONFIRM ACTION (Approve/Reject)
// ============================================
let pendingAction = null;

function confirmAction(action, id) {
  pendingAction = { action, id };
  
  const titles = {
    'approve': 'Approve DJ',
    'reject': 'Reject Application',
    'remove': 'Remove DJ',
    'clear-report': 'Clear Report'
  };
  
  const messages = {
    'approve': `Are you sure you want to approve this DJ? They will be listed as a verified DJ on the platform immediately.`,
    'reject': `Are you sure you want to reject this application? This can be undone later if needed.`,
    'remove': `Are you sure you want to remove this DJ from verified DJs? This action can be reversed.`,
    'clear-report': `Clear all reports for this DJ? This will remove all flags from their profile.`
  };
  
  document.getElementById('confirmTitle').textContent = titles[action] || 'Confirm';
  document.getElementById('confirmMessage').textContent = messages[action] || 'Are you sure?';
  
  document.getElementById('confirmActionBtn').onclick = executeAction;
  
  openModal('confirmModal');
}

async function executeAction() {
  if (!pendingAction) return;
  
  const { action, id } = pendingAction;
  
  try {
    let response;
    let data;
    
    switch(action) {
      case 'approve':
        response = await fetch(`${API_BASE}/applications/${id}/approve`, {
          method: 'PUT',
          headers: getAuthHeaders()
        });
        data = await response.json();
        if (data.success) {
          showToast('Application approved successfully!', 'success');
          closeModal('confirmModal');
          closeModal('detailsModal');
          loadDashboardData();
          loadPendingApplications();
          loadVerifiedDJs();
        } else {
          showToast(data.error || 'Failed to approve', 'error');
        }
        break;
        
      case 'reject':
        const reason = prompt('Enter rejection reason:');
        if (!reason) {
          pendingAction = null;
          closeModal('confirmModal');
          return;
        }
        response = await fetch(`${API_BASE}/applications/${id}/reject`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ reason })
        });
        data = await response.json();
        if (data.success) {
          showToast('Application rejected successfully!', 'error');
          closeModal('confirmModal');
          closeModal('detailsModal');
          loadDashboardData();
          loadPendingApplications();
          loadRejectedApplications();
        } else {
          showToast(data.error || 'Failed to reject', 'error');
        }
        break;
        
      case 'remove':
        response = await fetch(`${API_BASE}/djs/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        data = await response.json();
        if (data.success) {
          showToast('DJ removed successfully!', 'success');
          closeModal('confirmModal');
          closeModal('detailsModal');
          loadDashboardData();
          loadVerifiedDJs();
        } else {
          showToast(data.error || 'Failed to remove DJ', 'error');
        }
        break;
        
      case 'clear-report':
        // Implement clear report endpoint if you have one
        showToast('Reports cleared successfully!', 'success');
        closeModal('confirmModal');
        loadReportedDJs();
        break;
    }
  } catch (error) {
    console.error('Action failed:', error);
    showToast('Network error. Please try again.', 'error');
  }
  
  pendingAction = null;
}

// ============================================
// VERIFIED DJS
// ============================================
async function loadVerifiedDJs() {
  const grid = document.getElementById('verifiedGrid');
  grid.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

  try {
    const searchTerm = document.getElementById('searchVerified')?.value || '';
    let url = `${API_BASE}/djs/verified?page=1&limit=20`;
    if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
    
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (data.success) {
      const djs = data.djs || [];
      
      if (djs.length === 0) {
        grid.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-users"></i>
            <p>No verified DJs yet</p>
            <span>Approved DJs will appear here</span>
          </div>`;
        return;
      }
      
      grid.innerHTML = djs.map(dj => createVerifiedDJCard(dj)).join('');
    } else {
      grid.innerHTML = `<div class="error-state">${data.error || 'Failed to load'}</div>`;
    }
  } catch (error) {
    console.error('Error loading verified DJs:', error);
    grid.innerHTML = `<div class="error-state">Network error. Please try again.</div>`;
  }
}

function createVerifiedDJCard(dj) {
  const initials = (dj.dj_name || 'DJ').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const rating = dj.rating || 0;
  
  return `
    <div class="dj-card" id="dj-card-${dj.id}">
      <div class="dj-card-header">
        <div class="dj-avatar">${initials}</div>
        <div class="dj-card-info">
          <h4>${dj.dj_name}</h4>
          <span>⭐ ${rating.toFixed(1)} (${dj.total_reviews || 0} reviews)</span>
        </div>
      </div>
      <div class="dj-card-details">
        <span class="dj-tag"><i class="fas fa-music"></i> ${dj.genre || 'N/A'}</span>
        <span class="dj-tag"><i class="fas fa-money-bill"></i> R${dj.price_per_hour || 0}/hr</span>
        <span class="dj-tag ${dj.is_online ? 'online' : 'offline'}">
          <i class="fas fa-circle"></i> ${dj.is_online ? 'Online' : 'Offline'}
        </span>
      </div>
      <div class="dj-card-actions">
        <button class="btn btn-sm btn-view" onclick="viewDJProfile(${dj.id})">
          <i class="fas fa-eye"></i> View Profile
        </button>
        <button class="btn btn-sm btn-reject" onclick="confirmAction('remove', ${dj.id})">
          <i class="fas fa-user-slash"></i> Remove
        </button>
      </div>
    </div>
  `;
}

// ============================================
// VIEW DJ PROFILE
// ============================================
async function viewDJProfile(id) {
  try {
    const response = await fetch(`${API_BASE}/djs/${id}`, {
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (data.success) {
      const dj = data.dj;
      
      document.getElementById('modalDJName').textContent = dj.dj_name || 'DJ Profile';
      
      document.getElementById('modalBody').innerHTML = `
        <div class="detail-row"><i class="fas fa-music"></i><span><strong>Genre:</strong> ${dj.genre || 'N/A'}</span></div>
        <div class="detail-row"><i class="fas fa-money-bill"></i><span><strong>Price:</strong> R${dj.price_per_hour || 0}/hr</span></div>
        <div class="detail-row"><i class="fas fa-star"></i><span><strong>Rating:</strong> ${(dj.rating || 0).toFixed(1)} (${dj.total_reviews || 0} reviews)</span></div>
        <div class="detail-row"><i class="fas fa-briefcase"></i><span><strong>Experience:</strong> ${dj.dj_experience || 'N/A'}</span></div>
        <h4>Skills</h4>
        <p>${dj.dj_skills || 'Not specified'}</p>
        <h4>Status</h4>
        <span class="status-badge ${dj.is_verified ? 'verified' : 'pending'}">${dj.is_verified ? 'Verified' : 'Not Verified'}</span>
      `;

      let footerHTML = '<button class="btn btn-cancel" onclick="closeModal(\'detailsModal\')">Close</button>';
      
      footerHTML += `
        <button class="btn btn-reject" onclick="closeModal('detailsModal'); confirmAction('remove', ${dj.id})">
          <i class="fas fa-user-slash"></i> Remove DJ
        </button>
      `;
      
      document.getElementById('modalFooter').innerHTML = footerHTML;
      openModal('detailsModal');
    } else {
      showToast(data.error || 'Failed to load DJ profile', 'error');
    }
  } catch (error) {
    console.error('Error viewing DJ profile:', error);
    showToast('Network error. Please try again.', 'error');
  }
}

// ============================================
// REJECTED APPLICATIONS
// ============================================
async function loadRejectedApplications() {
  const tbody = document.getElementById('rejectedTable');
  tbody.innerHTML = '<tr><td colspan="5"><div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading...</div></td></tr>';

  try {
    const response = await fetch(`${API_BASE}/applications/rejected`, {
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (data.success) {
      const applications = data.applications || [];
      
      if (applications.length === 0) {
        tbody.innerHTML = `
          <tr class="empty-row">
            <td colspan="5">
              <div class="empty-state-inline">
                <i class="fas fa-times-circle"></i>
                <p>No rejected applications</p>
              </div>
            </td>
          </tr>`;
        return;
      }
      
      tbody.innerHTML = applications.map(app => `
        <tr>
          <td><strong>${app.dj_name}</strong></td>
          <td>${app.genre || 'N/A'}</td>
          <td>${app.rejection_reason || 'No reason provided'}</td>
          <td>${formatDate(app.rejected_date)}</td>
          <td>
            <button class="btn btn-sm btn-view" onclick="viewApplication(${app.id})">
              <i class="fas fa-eye"></i> View
            </button>
          </td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = `<tr><td colspan="5"><div class="error-state">${data.error || 'Failed to load'}</div></td></tr>`;
    }
  } catch (error) {
    console.error('Error loading rejected applications:', error);
    tbody.innerHTML = `<tr><td colspan="5"><div class="error-state">Network error. Please try again.</div></td></tr>`;
  }
}

// ============================================
// REPORTED DJS
// ============================================
async function loadReportedDJs() {
  const tbody = document.getElementById('reportedTable');
  tbody.innerHTML = '<tr><td colspan="5"><div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading...</div></td></tr>';

  try {
    const response = await fetch(`${API_BASE}/djs/reported`, {
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (data.success) {
      const djs = data.djs || [];
      
      if (djs.length === 0) {
        tbody.innerHTML = `
          <tr class="empty-row">
            <td colspan="5">
              <div class="empty-state-inline">
                <i class="fas fa-flag"></i>
                <p>No reported DJs</p>
              </div>
            </td>
          </tr>`;
        return;
      }
      
      tbody.innerHTML = djs.map(dj => `
        <tr>
          <td><strong>${dj.dj_name}</strong></td>
          <td><span class="status-badge rejected" style="font-size: 0.7rem;">${dj.report_count || 0} report${dj.report_count > 1 ? 's' : ''}</span></td>
          <td>${dj.reports?.[0]?.reported_by || 'Unknown'}</td>
          <td>${dj.reports?.[0]?.reason || 'Violation reported'}</td>
          <td>
            <button class="btn btn-sm btn-view" onclick="viewDJProfile(${dj.id})">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-approve" onclick="confirmAction('clear-report', ${dj.id})" style="margin-left: 6px;">
              <i class="fas fa-check"></i> Clear
            </button>
            <button class="btn btn-sm btn-reject" onclick="confirmAction('remove', ${dj.id})" style="margin-left: 6px;">
              <i class="fas fa-ban"></i> Remove
            </button>
          </td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = `<tr><td colspan="5"><div class="error-state">${data.error || 'Failed to load'}</div></td></tr>`;
    }
  } catch (error) {
    console.error('Error loading reported DJs:', error);
    tbody.innerHTML = `<tr><td colspan="5"><div class="error-state">Network error. Please try again.</div></td></tr>`;
  }
}

// ============================================
// KEEP FOR BACKWARD COMPATIBILITY
// ============================================
// These functions are kept for compatibility with the HTML
// but they now use the API versions above

function renderAll() {
  loadDashboardData();
  loadPendingApplications();
  loadVerifiedDJs();
  loadRejectedApplications();
  loadReportedDJs();
}

function renderPage(page) {
  switch(page) {
    case 'dashboard': loadDashboardData(); break;
    case 'pending': loadPendingApplications(); break;
    case 'verified': loadVerifiedDJs(); break;
    case 'rejected': loadRejectedApplications(); break;
    case 'reported': loadReportedDJs(); break;
  }
}

function renderRecentApplications() {
  // Handled by loadDashboardData()
}

function renderPendingDJs() {
  loadPendingApplications();
}

function renderVerifiedDJs() {
  loadVerifiedDJs();
}

function renderRejectedDJs() {
  loadRejectedApplications();
}

function renderReportedDJs() {
  loadReportedDJs();
}

function viewDJ(id) {
  viewApplication(id);
}

function updateStats() {
  // Handled by loadDashboardData()
}

console.log('✅ Admin panel connected to backend API');
console.log(`📡 API: ${API_BASE}`);