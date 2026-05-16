const adminSession = sessionStorage.getItem('gigza_admin_session');

if (!adminSession) {
  window.location.href = 'admin-login.html';
} else {
  const admin = JSON.parse(adminSession);
  console.log(`👋 Welcome back, ${admin.name} (${admin.role})`);

}

// Add logout function
function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    sessionStorage.removeItem('gigza_admin_session');
    window.location.href = 'admin-login.html';
  }
}
// This is just sample data it should be replace with our API calls
let djs = [
  {
    id: 1,
    name: 'DJ Zee',
    email: 'djzee@email.com',
    phone: '+27 81 234 5678',
    genre: 'Amapiano',
    location: 'Sandton, Johannesburg',
    experience: '3 years',
    bio: 'Passionate Amapiano DJ with residency at Club Vibe. Specialized in private events and corporate functions. Known for high-energy sets that keep the crowd moving all night.',
    portfolioUrl: 'https://soundcloud.com/djzee',
    idDocument: 'id_djzee.pdf',
    appliedDate: '2025-04-10',
    status: 'pending',
    reports: 0
  },
  {
    id: 2,
    name: 'DJ Khusta',
    email: 'khusta@email.com',
    phone: '+27 72 345 6789',
    genre: 'Deep House',
    location: 'Cape Town CBD',
    experience: '5 years',
    bio: 'Deep House specialist with 5 years of experience. Played at major festivals including Ultra SA and CTEMF. Available for club residencies and private events.',
    portfolioUrl: 'https://mixcloud.com/khusta',
    idDocument: 'id_khusta.pdf',
    appliedDate: '2025-04-08',
    status: 'pending',
    reports: 1,
    reportedBy: 'User #42',
    reportReason: 'Late to event',
    reportDate: '2025-04-12'
  },
  {
    id: 3,
    name: 'DJ Melody',
    email: 'melody@email.com',
    phone: '+27 63 456 7890',
    genre: 'Afro Tech',
    location: 'Pretoria East',
    experience: '2 years',
    bio: 'Upcoming Afro Tech DJ building a solid reputation in the Pretoria scene. Regular at Sunday rooftop sessions and private functions.',
    portfolioUrl: 'https://soundcloud.com/melody-za',
    idDocument: 'id_melody.pdf',
    appliedDate: '2025-04-05',
    status: 'verified',
    reports: 0
  },
  {
    id: 4,
    name: 'DJ Sipho',
    email: 'sipho@email.com',
    phone: '+27 84 567 8901',
    genre: 'Gqom',
    location: 'Durban Central',
    experience: '1 year',
    bio: 'New to the scene. Eager to learn and grow as a DJ.',
    portfolioUrl: '',
    idDocument: '',
    appliedDate: '2025-04-01',
    status: 'rejected',
    rejectionReason: 'No ID document uploaded. Incomplete portfolio.',
    reports: 0
  },
  {
    id: 5,
    name: 'DJ Thando',
    email: 'thando@email.com',
    phone: '+27 79 123 4567',
    genre: 'Amapiano',
    location: 'Soweto, Johannesburg',
    experience: '4 years',
    bio: 'Amapiano specialist from Soweto. Built a loyal following through community events and local clubs.',
    portfolioUrl: 'https://soundcloud.com/thando-za',
    idDocument: 'id_thando.pdf',
    appliedDate: '2025-04-11',
    status: 'pending',
    reports: 0
  }
];

let currentPage = 'dashboard';
let pendingAction = null;

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initSearch();
  initMobileMenu();
  renderAll();
  console.log('🎛️ GIGZA Admin Panel Ready');
  console.log('📡 Sample data loaded — replace with API calls in admin.js');
});
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
  
  // This updates nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });
  
  // This updates pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`${page}-page`)?.classList.add('active');
  document.getElementById('sidebar').classList.remove('open');
  renderPage(page);
}

function initMobileMenu() {
  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });
 
  document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('menuToggle');
    if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });
}

function initSearch() {
  const searchPending = document.getElementById('searchPending');
  const searchVerified = document.getElementById('searchVerified');
  const filterGenre = document.getElementById('filterGenre');
  
  if (searchPending) {
    searchPending.addEventListener('input', () => renderPendingDJs());
  }
  if (searchVerified) {
    searchVerified.addEventListener('input', () => renderVerifiedDJs());
  }
  if (filterGenre) {
    filterGenre.addEventListener('change', () => renderPendingDJs());
  }
}

function getFilteredDJs(status) {
  let filtered = djs.filter(dj => dj.status === status);
  
  if (status === 'pending') {
    const searchTerm = document.getElementById('searchPending')?.value.toLowerCase() || '';
    const genreFilter = document.getElementById('filterGenre')?.value || '';
    
    if (searchTerm) {
      filtered = filtered.filter(dj => 
        dj.name.toLowerCase().includes(searchTerm) ||
        dj.location.toLowerCase().includes(searchTerm) ||
        dj.genre.toLowerCase().includes(searchTerm)
      );
    }
    if (genreFilter) {
      filtered = filtered.filter(dj => dj.genre.toLowerCase() === genreFilter.toLowerCase());
    }
  }
  
  if (status === 'verified') {
    const searchTerm = document.getElementById('searchVerified')?.value.toLowerCase() || '';
    if (searchTerm) {
      filtered = filtered.filter(dj => 
        dj.name.toLowerCase().includes(searchTerm) ||
        dj.location.toLowerCase().includes(searchTerm) ||
        dj.genre.toLowerCase().includes(searchTerm)
      );
    }
  }
  
  return filtered;
}

function renderAll() {
  updateStats();
  renderRecentApplications();
  renderPendingDJs();
  renderVerifiedDJs();
  renderRejectedDJs();
  renderReportedDJs();
}

function renderPage(page) {
  switch(page) {
    case 'dashboard':
      updateStats();
      renderRecentApplications();
      break;
    case 'pending':
      renderPendingDJs();
      break;
    case 'verified':
      renderVerifiedDJs();
      break;
    case 'rejected':
      renderRejectedDJs();
      break;
    case 'reported':
      renderReportedDJs();
      break;
  }
}

function updateStats() {
  const pending = djs.filter(dj => dj.status === 'pending').length;
  const verified = djs.filter(dj => dj.status === 'verified').length;
  const rejected = djs.filter(dj => dj.status === 'rejected').length;
  const reported = djs.filter(dj => dj.reports > 0).length;
  
  document.getElementById('statPending').textContent = pending;
  document.getElementById('statVerified').textContent = verified;
  document.getElementById('statRejected').textContent = rejected;
  document.getElementById('statReported').textContent = reported;
  
  const pendingCountEl = document.getElementById('pendingCount');
  if (pendingCountEl) {
    pendingCountEl.textContent = pending;
    pendingCountEl.style.display = pending > 0 ? 'inline' : 'none';
  }
}

function renderRecentApplications() {
  const tbody = document.getElementById('recentApplications');
  const recent = [...djs]
    .sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate))
    .slice(0, 5);
  
  if (recent.length === 0) {
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
  
  tbody.innerHTML = recent.map(dj => `
    <tr>
      <td><strong>${dj.name}</strong></td>
      <td>${dj.genre}</td>
      <td>${dj.location}</td>
      <td>${formatDate(dj.appliedDate)}</td>
      <td><span class="status-badge ${dj.status}">${dj.status}</span></td>
      <td>
        <button class="btn btn-sm btn-view" onclick="viewDJ(${dj.id})">
          <i class="fas fa-eye"></i> View
        </button>
      </td>
    </tr>
  `).join('');
}

//  Pending DJs
function renderPendingDJs() {
  const grid = document.getElementById('pendingGrid');
  const pending = getFilteredDJs('pending');
  
  if (pending.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-inbox"></i>
        <p>No pending applications</p>
        <span>New DJ applications will appear here for review</span>
      </div>`;
    return;
  }
  
  grid.innerHTML = pending.map(dj => createDJCard(dj)).join('');
  pending.forEach(dj => {
    const card = document.getElementById(`dj-card-${dj.id}`);
    if (card) {
      card.querySelector('.btn-approve')?.addEventListener('click', () => confirmAction('approve', dj.id));
      card.querySelector('.btn-reject')?.addEventListener('click', () => confirmAction('reject', dj.id));
      card.querySelector('.btn-view')?.addEventListener('click', () => viewDJ(dj.id));
    }
  });
}

// Veriefied DJs
function renderVerifiedDJs() {
  const grid = document.getElementById('verifiedGrid');
  const verified = getFilteredDJs('verified');
  
  if (verified.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-users"></i>
        <p>No verified DJs yet</p>
        <span>Approved DJs will appear here</span>
      </div>`;
    return;
  }
  
  grid.innerHTML = verified.map(dj => createDJCard(dj, true)).join('');
  
  verified.forEach(dj => {
    const card = document.getElementById(`dj-card-${dj.id}`);
    if (card) {
      card.querySelector('.btn-view')?.addEventListener('click', () => viewDJ(dj.id));
      card.querySelector('.btn-remove')?.addEventListener('click', () => confirmAction('remove', dj.id));
    }
  });
}

//  Rejected DJs 
function renderRejectedDJs() {
  const tbody = document.getElementById('rejectedTable');
  const rejected = djs.filter(dj => dj.status === 'rejected');
  
  if (rejected.length === 0) {
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
  
  tbody.innerHTML = rejected.map(dj => `
    <tr>
      <td><strong>${dj.name}</strong></td>
      <td>${dj.genre}</td>
      <td>${dj.rejectionReason || 'Application rejected'}</td>
      <td>${formatDate(dj.appliedDate)}</td>
      <td>
        <button class="btn btn-sm btn-view" onclick="viewDJ(${dj.id})">
          <i class="fas fa-eye"></i> View
        </button>
        <button class="btn btn-sm btn-approve" onclick="confirmAction('approve', ${dj.id})" style="margin-left: 6px;">
          <i class="fas fa-undo"></i> Reconsider
        </button>
      </td>
    </tr>
  `).join('');
}

// Reported DJs 
function renderReportedDJs() {
  const tbody = document.getElementById('reportedTable');
  const reported = djs.filter(dj => dj.reports > 0);
  
  if (reported.length === 0) {
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
  
  tbody.innerHTML = reported.map(dj => `
    <tr>
      <td><strong>${dj.name}</strong></td>
      <td>
        <span class="status-badge rejected" style="font-size: 0.7rem;">${dj.reports} report${dj.reports > 1 ? 's' : ''}</span>
      </td>
      <td>${dj.reportedBy || 'Unknown'}</td>
      <td>${dj.reportReason || 'Violation reported'}</td>
      <td>
        <button class="btn btn-sm btn-view" onclick="viewDJ(${dj.id})">
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
}

function createDJCard(dj, isVerified = false) {
  const initials = dj.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  
  return `
    <div class="dj-card" id="dj-card-${dj.id}">
      <div class="dj-card-header">
        <div class="dj-avatar">${initials}</div>
        <div class="dj-card-info">
          <h4>${dj.name}</h4>
          <span>Applied ${formatDate(dj.appliedDate)}</span>
        </div>
      </div>
      <div class="dj-card-details">
        <span class="dj-tag"><i class="fas fa-music"></i> ${dj.genre}</span>
        <span class="dj-tag"><i class="fas fa-map-marker-alt"></i> ${dj.location}</span>
        <span class="dj-tag"><i class="fas fa-briefcase"></i> ${dj.experience}</span>
        ${dj.reports > 0 ? `<span class="dj-tag warning"><i class="fas fa-flag"></i> ${dj.reports} report${dj.reports > 1 ? 's' : ''}</span>` : ''}
      </div>
      <div class="dj-card-actions">
        ${isVerified ? `
          <button class="btn btn-sm btn-view">
            <i class="fas fa-eye"></i> View Profile
          </button>
          <button class="btn btn-sm btn-reject btn-remove">
            <i class="fas fa-user-slash"></i> Remove
          </button>
        ` : `
          <button class="btn btn-sm btn-view">
            <i class="fas fa-eye"></i> View Details
          </button>
          <button class="btn btn-sm btn-approve">
            <i class="fas fa-check"></i> Approve
          </button>
          <button class="btn btn-sm btn-reject">
            <i class="fas fa-times"></i> Reject
          </button>
        `}
      </div>
    </div>
  `;
}
function viewDJ(djId) {
  const dj = djs.find(d => d.id === djId);
  if (!dj) return;
  
  document.getElementById('modalDJName').textContent = dj.name;
  
  document.getElementById('modalBody').innerHTML = `
    <div class="detail-row">
      <i class="fas fa-envelope"></i>
      <span><strong>Email:</strong> ${dj.email}</span>
    </div>
    <div class="detail-row">
      <i class="fas fa-phone"></i>
      <span><strong>Phone:</strong> ${dj.phone}</span>
    </div>
    <div class="detail-row">
      <i class="fas fa-music"></i>
      <span><strong>Genre:</strong> ${dj.genre}</span>
    </div>
    <div class="detail-row">
      <i class="fas fa-map-marker-alt"></i>
      <span><strong>Location:</strong> ${dj.location}</span>
    </div>
    <div class="detail-row">
      <i class="fas fa-briefcase"></i>
      <span><strong>Experience:</strong> ${dj.experience}</span>
    </div>
    ${dj.portfolioUrl ? `
    <div class="detail-row">
      <i class="fas fa-link"></i>
      <span><strong>Portfolio:</strong> <a href="${dj.portfolioUrl}" target="_blank">${dj.portfolioUrl}</a></span>
    </div>` : ''}
    <h4>Bio</h4>
    <p>${dj.bio}</p>
    ${dj.idDocument ? `
      <h4>ID Document</h4>
      <p style="color: var(--success-green);">📄 ${dj.idDocument} — Uploaded</p>
    ` : `
      <h4>ID Document</h4>
      <p style="color: var(--danger-red);">⚠️ No ID document uploaded — this is required for verification</p>
    `}
    <h4>Application Status</h4>
    <span class="status-badge ${dj.status}">${dj.status}</span>
    ${dj.rejectionReason ? `<p style="margin-top: 0.5rem; color: var(--text-gray);"><strong>Reason:</strong> ${dj.rejectionReason}</p>` : ''}
  `;

  let footerHTML = '<button class="btn btn-cancel" onclick="closeModal(\'detailsModal\')">Close</button>';
  
  if (dj.status === 'pending') {
    footerHTML += `
      <button class="btn btn-reject" onclick="closeModal('detailsModal'); confirmAction('reject', ${dj.id})">
        <i class="fas fa-times"></i> Reject
      </button>
      <button class="btn btn-approve" onclick="closeModal('detailsModal'); confirmAction('approve', ${dj.id})">
        <i class="fas fa-check"></i> Approve DJ
      </button>
    `;
  } else if (dj.status === 'verified') {
    footerHTML += `
      <button class="btn btn-reject" onclick="closeModal('detailsModal'); confirmAction('remove', ${dj.id})">
        <i class="fas fa-user-slash"></i> Remove DJ
      </button>
    `;
  } else if (dj.status === 'rejected') {
    footerHTML += `
      <button class="btn btn-approve" onclick="closeModal('detailsModal'); confirmAction('approve', ${dj.id})">
        <i class="fas fa-undo"></i> Reconsider
      </button>
    `;
  }
  
  document.getElementById('modalFooter').innerHTML = footerHTML;
  openModal('detailsModal');
}

function confirmAction(action, djId) {
  const dj = djs.find(d => d.id === djId);
  if (!dj) return;
  
  pendingAction = { action, dj };
  
  const titles = {
    'approve': 'Approve DJ',
    'reject': 'Reject Application',
    'remove': 'Remove DJ',
    'clear-report': 'Clear Report'
  };
  
  const messages = {
    'approve': `Are you sure you want to approve <strong>${dj.name}</strong>? They will be listed as a verified DJ on the platform immediately.`,
    'reject': `Are you sure you want to reject <strong>${dj.name}</strong>'s application? This can be undone later if needed.`,
    'remove': `Are you sure you want to remove <strong>${dj.name}</strong> from verified DJs? This action can be reversed.`,
    'clear-report': `Clear all reports for <strong>${dj.name}</strong>? This will remove all flags from their profile.`
  };
  
  document.getElementById('confirmTitle').textContent = titles[action] || 'Confirm';
  document.getElementById('confirmMessage').innerHTML = messages[action] || 'Are you sure?';
  
  document.getElementById('confirmActionBtn').onclick = () => executeAction();
  
  openModal('confirmModal');
}

function executeAction() {
  if (!pendingAction) return;
  
  const { action, dj } = pendingAction;
  
  switch(action) {
    case 'approve':
      dj.status = 'verified';
      dj.rejectionReason = null;
      showToast(`${dj.name} approved successfully!`, 'success');
      break;
    case 'reject':
      dj.status = 'rejected';
      dj.rejectionReason = 'Application rejected by admin';
      showToast(`${dj.name}'s application rejected.`, 'error');
      break;
    case 'remove':
      dj.status = 'rejected';
      dj.rejectionReason = 'Removed from verified list by admin';
      showToast(`${dj.name} removed from verified DJs.`, 'error');
      break;
    case 'clear-report':
      dj.reports = 0;
      dj.reportedBy = null;
      dj.reportReason = null;
      dj.reportDate = null;
      showToast(`Reports cleared for ${dj.name}.`, 'success');
      break;
  }
  
  // Pls replace with your endpoint 
  // Example:
  // fetch(`https://your-api.com/api/admin/djs/${dj.id}`, {
  //   method: 'PATCH',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ status: dj.status })
  // })
  // .then(res => res.json())
  // .then(data => console.log('Updated:', data))
  // .catch(err => console.error('Error:', err));
  
  console.log(`[API Placeholder] ${action.toUpperCase()} — DJ #${dj.id} (${dj.name})`);
  
  closeModal('confirmModal');
  pendingAction = null;
  renderAll();
}

function openModal(id) {
  document.getElementById(id).classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
  document.body.style.overflow = '';
}

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(modal => {
      modal.classList.remove('active');
    });
    document.body.style.overflow = '';
  }
});

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

function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-ZA', options);
}

console.log('✅ Admin panel initialized — no login required');
console.log('🔌 Ready for API endpoint integration');