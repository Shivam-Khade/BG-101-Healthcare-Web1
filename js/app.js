/* ============================================================
   MediConnect — Patient Portal JavaScript
   ============================================================

   BASE URL: http://localhost:8000/api   (update as needed)

   All API endpoints are documented below for backend teams.
   Frontend calls these endpoints — implement them accordingly.
   ============================================================ */

const API = 'http://localhost:8000/api';

/* ============================================================
   API ENDPOINT REFERENCE
   ============================================================

   AUTH
   POST   /api/auth/register          Body: { name, email, password, phone, dob, blood_group, gender }
   POST   /api/auth/login             Body: { email, password }  →  { token, user }
   POST   /api/auth/logout
   GET    /api/auth/me                Header: Authorization: Bearer <token>

   DOCTORS
   GET    /api/doctors                Query: ?search=&specialty=&location=&available=
   GET    /api/doctors/:id
   GET    /api/doctors/specialties    → list of specialties

   APPOINTMENTS
   GET    /api/appointments           Query: ?status=upcoming|past|cancelled
   POST   /api/appointments           Body: { doctor_id, date, time, reason, type }
   GET    /api/appointments/:id
   PUT    /api/appointments/:id       Body: { date, time, reason }  (reschedule)
   DELETE /api/appointments/:id       (cancel)

   MEDICAL RECORDS
   GET    /api/records                Query: ?type=
   POST   /api/records                Body: FormData { title, type, date, file, notes }
   GET    /api/records/:id
   DELETE /api/records/:id

   PRESCRIPTIONS
   GET    /api/prescriptions          Query: ?status=active|expired
   GET    /api/prescriptions/:id

   LAB REPORTS
   GET    /api/lab-reports            Query: ?status=
   GET    /api/lab-reports/:id

   PHARMACY
   GET    /api/medicines              Query: ?search=&category=
   POST   /api/orders                 Body: { items: [{medicine_id, qty}], address, payment_method }
   GET    /api/orders

   BILLING
   GET    /api/bills                  Query: ?status=paid|pending
   GET    /api/bills/:id
   POST   /api/bills/:id/pay          Body: { payment_method }

   PROFILE
   GET    /api/profile
   PUT    /api/profile                Body: { name, phone, dob, address, blood_group, allergies, conditions }
   PUT    /api/profile/password       Body: { current_password, new_password }

   NOTIFICATIONS
   GET    /api/notifications          Query: ?unread_only=true
   PUT    /api/notifications/:id/read
   PUT    /api/notifications/read-all
   DELETE /api/notifications/:id

   EMERGENCY
   GET    /api/emergency/contacts
   POST   /api/emergency/contacts     Body: { name, relation, phone, is_primary }
   PUT    /api/emergency/contacts/:id
   DELETE /api/emergency/contacts/:id
   POST   /api/emergency/sos          Body: { latitude, longitude, message }
   GET    /api/emergency/hospitals    Query: ?lat=&lng=&radius=
   ============================================================ */

/* ---- Token Helper ---- */
const auth = {
  setToken: (token) => localStorage.setItem('patient_token', token),
  getToken: () => localStorage.getItem('patient_token'),
  clear: () => { localStorage.removeItem('patient_token'); localStorage.removeItem('patient_user'); },
  setUser: (user) => localStorage.setItem('patient_user', JSON.stringify(user)),
  getUser: () => { try { return JSON.parse(localStorage.getItem('patient_user')); } catch { return null; } }
};

/* ---- HTTP Helper ---- */
async function api(method, endpoint, body = null, isForm = false) {
  const headers = { 'Authorization': `Bearer ${auth.getToken()}` };
  if (!isForm) headers['Content-Type'] = 'application/json';

  const opts = { method, headers };
  if (body) opts.body = isForm ? body : JSON.stringify(body);

  try {
    const res = await fetch(API + endpoint, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  } catch (err) {
    console.error(`[API] ${method} ${endpoint}:`, err.message);
    throw err;
  }
}

const GET  = (ep)      => api('GET', ep);
const POST = (ep, b, f) => api('POST', ep, b, f);
const PUT  = (ep, b)   => api('PUT', ep, b);
const DEL  = (ep)      => api('DELETE', ep);

/* ---- Toast Notifications ---- */
function toast(msg, type = 'default', duration = 3500) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = `toast toast-${type} show`;
  setTimeout(() => el.classList.remove('show'), duration);
}

/* ---- Modal Helpers ---- */
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

/* ---- Tabs ---- */
function initTabs(containerSel) {
  document.querySelectorAll(containerSel + ' .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      document.querySelectorAll(containerSel + ' .tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll(containerSel + ' .tab-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const pane = document.getElementById(target);
      if (pane) pane.classList.add('active');
    });
  });
}

/* ---- Auth Tabs (Login/Register) ---- */
function initAuthTabs() {
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.form;
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.auth-form-pane').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const pane = document.getElementById(target);
      if (pane) pane.classList.add('active');
    });
  });
}

/* ---- Guard: redirect to login if no token ---- */
function requireAuth() {
  const path = window.location.pathname;
  const onAuthPage = path.endsWith('index.html') || path.endsWith('/');
  if (!auth.getToken() && !onAuthPage) {
    window.location.href = 'index.html';
  }
}

/* ---- Demo mode: skip API call if using demo token ---- */
function isDemoMode() {
  return auth.getToken() === 'demo-token';
}

/* ---- Populate user info in sidebar ---- */
function populateSidebarUser() {
  const user = auth.getUser();
  if (!user) return;
  const nameEl = document.getElementById('sidebar-user-name');
  const avatarEl = document.getElementById('sidebar-avatar');
  if (nameEl) nameEl.textContent = user.name || 'Patient';
  if (avatarEl) avatarEl.textContent = (user.name || 'P').charAt(0).toUpperCase();
}

/* ---- Format date ---- */
function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ---- Close modals on overlay click ---- */
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

/* ---- Init on load ---- */
document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  populateSidebarUser();
  initTabs('.page-tabs');
});
