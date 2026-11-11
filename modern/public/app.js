// Conscenery modern port — client. Plain fetch, no jQuery.
// Mirrors sys.js: 5-second refresh of the current view, AJAX forms, and a
// Demo Account Login button that fills Demo/Demo and submits.
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

let me = null;
let view = 'about'; // about | login | stream | contacts | profile
let dmUser = null;  // {id, username} when a DM thread is open

async function api(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const data = await res.json().catch(() => ({ ok: false, error: 'Bad response' }));
  if (!res.ok && res.status === 401) { me = null; showLoggedOut(); }
  return data;
}

function setActiveNav(id) {
  $$('.header .active').forEach((a) => a.classList.remove('active'));
  const el = $(id);
  if (el) el.classList.add('active');
}
function hideAll() {
  ['#about_view', '#login_view', '#stream_home', '#messages', '#stream_post', '#direct_view', '#profile_view']
    .forEach((s) => { $(s).style.display = 'none'; });
}
function showLoggedOut() {
  $$('.loggedin').forEach((el) => { el.style.display = 'none'; });
  $$('.loggedout').forEach((el) => { el.style.display = ''; });
  hideAll();
  view = 'about';
  $('#about_view').style.display = '';
  setActiveNav('#about_page');
}
function showLoggedIn() {
  $$('.loggedout').forEach((el) => { el.style.display = 'none'; });
  $$('.loggedin').forEach((el) => { el.style.display = ''; });
  $('#profile_page').textContent = me.username;
  showStream();
}
function showStream() {
  view = 'stream';
  hideAll();
  ['#stream_home', '#messages', '#stream_post'].forEach((s) => { $(s).style.display = ''; });
  $('#head_title').textContent = 'Stream';
  setActiveNav('#stream_page');
  refreshMessages();
}
function showContacts() {
  view = 'contacts';
  hideAll();
  $('#direct_view').style.display = '';
  setActiveNav('#contacts_page');
  refreshContacts();
}
function showProfile() {
  view = 'profile';
  hideAll();
  $('#profile_view').style.display = '';
  $('#profile_info').textContent = `Logged in as ${me.username} (${me.email})`;
}

function messageHtml(m) {
  const cls = m.mine ? 'self' : 'received';
  const actions = m.mine
    ? `<a data-delete="${m.id}">Delete</a>`
    : `<a data-remove-contact="${m.username}">Remove Contact</a>`;
  return `<div class="${cls}"><div class="post_options"><ul>
      <li><a class="active" href="#comment">${m.username}</a></li>
      <li><a href="#" class="dropbtn">Options</a><div class="dropdown-content">${actions}</div></li>
    </ul></div>
    <div class="message_content"><div class="message_margin">
      <p>${m.html}</p>
      <p>${m.posted} &middot; <span class="expiry">${m.expires}</span></p>
      <p class="msg-actions">${actions}</p>
    </div></div></div>`;
}

async function refreshMessages() {
  if (view !== 'stream' || !me) return;
  const data = await api('/api/stream');
  if (data.ok) $('#messages').innerHTML = data.messages.map(messageHtml).join('') || '<p>No messages yet — post one, or add a contact.</p>';
}
async function refreshDirect() {
  if (view !== 'contacts' || !me || !dmUser) return;
  const data = await api(`/api/dm?userId=${dmUser.id}`);
  if (data.ok) $('#direct_messages').innerHTML = data.messages.map(messageHtml).join('') || '<p>No messages yet.</p>';
}
async function refreshContacts() {
  if (view !== 'contacts' || !me) return;
  const data = await api('/api/contacts');
  if (!data.ok) return;
  const list = $('#contacts_sidebar_list');
  list.querySelectorAll('li:not(:first-child)').forEach((li) => li.remove());
  for (const c of data.connected) {
    const li = document.createElement('li');
    li.innerHTML = `<a href="#" data-dm="${c.id}" data-name="${c.username}">${c.username}</a>`;
    list.appendChild(li);
  }
  $('#pending_contacts').innerHTML = data.pending.length === 0
    ? '<div class="user_row"><p>No pending contacts</p></div>'
    : data.pending.map((p) => {
      let links = '';
      if (p.status === '1') {
        if (p.incoming) links += `<a href="#" data-accept="${p.otherId}">Accept request</a> `;
        else links += '(Requested) ';
        links += `<a href="#" data-cancel="${p.otherId}">Cancel</a>`;
      } else if (p.status === '2' && p.blockedByMe) {
        links += `<a href="#" data-unblock="${p.otherId}">Unblock</a>`;
      }
      return `<div class="user_row"><p>${p.other} ${links}</p></div>`;
    }).join('');
}

function randomString(length) {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  let out = '';
  for (let i = length; i > 0; --i) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// Delegated clicks: message actions, contact actions, DM sidebar.
document.addEventListener('click', async (e) => {
  const t = e.target.closest('a');
  if (!t) return;
  if (t.dataset.delete) {
    e.preventDefault();
    const r = await api('/api/delete', { method: 'POST', body: JSON.stringify({ id: Number(t.dataset.delete) }) });
    if (r.ok) { refreshMessages(); refreshDirect(); } else alert(r.error);
  } else if (t.dataset.removeContact) {
    e.preventDefault();
    const contacts = await api('/api/contacts');
    const peer = contacts.connected.find((c) => c.username === t.dataset.removeContact);
    if (peer) {
      const r = await api('/api/contact-action', { method: 'POST', body: JSON.stringify({ userId: peer.id, action: 'remove' }) });
      if (r.ok) refreshMessages(); else alert(r.error);
    }
  } else if (t.dataset.dm) {
    e.preventDefault();
    dmUser = { id: Number(t.dataset.dm), username: t.dataset.name };
    $('#direct_title').textContent = dmUser.username;
    $('#network_view').style.display = 'none';
    $('#direct_post').style.display = '';
    $$('#contacts_sidebar_list a').forEach((a) => a.classList.remove('active'));
    t.classList.add('active');
    refreshDirect();
  } else if (t.dataset.accept || t.dataset.cancel || t.dataset.unblock) {
    e.preventDefault();
    const action = t.dataset.accept ? 'accept' : t.dataset.cancel ? 'remove' : 'unblock';
    const userId = Number(t.dataset.accept || t.dataset.cancel || t.dataset.unblock);
    const r = await api('/api/contact-action', { method: 'POST', body: JSON.stringify({ userId, action }) });
    if (r.ok) refreshContacts(); else alert(r.error);
  }
});

$('#manage_contacts_link').addEventListener('click', (e) => {
  e.preventDefault();
  dmUser = null;
  $('#direct_title').textContent = 'Manage Contacts';
  $('#network_view').style.display = '';
  $('#direct_post').style.display = 'none';
  $$('#contacts_sidebar_list a').forEach((a) => a.classList.remove('active'));
  e.target.classList.add('active');
  refreshContacts();
});

$('#about_page').addEventListener('click', (e) => { e.preventDefault(); hideAll(); $('#about_view').style.display = ''; setActiveNav('#about_page'); });
$('#login_page').addEventListener('click', (e) => { e.preventDefault(); hideAll(); $('#login_view').style.display = ''; setActiveNav('#login_page'); });
$('#get_started').addEventListener('click', (e) => { e.preventDefault(); hideAll(); $('#login_view').style.display = ''; setActiveNav('#login_page'); });
$('#stream_page').addEventListener('click', (e) => { e.preventDefault(); showStream(); });
$('#contacts_page').addEventListener('click', (e) => { e.preventDefault(); showContacts(); });
$('#profile_page').addEventListener('click', (e) => { e.preventDefault(); showProfile(); });
$('#logout_link').addEventListener('click', async (e) => { e.preventDefault(); await api('/api/logout', { method: 'POST' }); showLoggedOut(); });

$('#demo_login').addEventListener('click', () => {
  const f = $('#login_form');
  f.username.value = 'Demo';
  f.password.value = 'Demo';
  f.requestSubmit();
});
$('#demo_register').addEventListener('click', () => {
  const u = randomString(6);
  const f = $('#register_form');
  f.username.value = u;
  f.email.value = `${u}@example.com`;
  f.password.value = u;
  f.password.type = 'text';
});

$('#login_form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  const r = await api('/api/login', { method: 'POST', body: JSON.stringify({ username: f.username.value, password: f.password.value }) });
  if (r.ok) { me = r.user; showLoggedIn(); }
  else $('#login_feedback').textContent = r.error || 'Login failed';
});
$('#register_form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  const r = await api('/api/register', { method: 'POST', body: JSON.stringify({ username: f.username.value, email: f.email.value, password: f.password.value }) });
  if (r.ok) {
    const login = $('#login_form');
    login.username.value = f.username.value;
    login.password.value = f.password.value;
    login.requestSubmit();
  } else $('#register_feedback').textContent = r.error || 'Registration failed';
});
$('#stream_form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  if (!f.text.value.trim()) { f.querySelector('.post_feedback').textContent = 'Empty Submission'; return; }
  const r = await api('/api/post', { method: 'POST', body: JSON.stringify({ text: f.text.value, timeSelection: f.time_selection.value }) });
  if (r.ok) { f.reset(); refreshMessages(); } else f.querySelector('.post_feedback').textContent = r.error;
});
$('#direct_form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  if (!dmUser) return;
  if (!f.text.value.trim()) { f.querySelector('.post_feedback').textContent = 'Empty Submission'; return; }
  const r = await api('/api/post', { method: 'POST', body: JSON.stringify({ text: f.text.value, timeSelection: f.time_selection.value, destId: dmUser.id }) });
  if (r.ok) { f.reset(); refreshDirect(); } else f.querySelector('.post_feedback').textContent = r.error;
});
$('#contact_form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  if (!f.user.value.trim()) { $('#contact_feedback').textContent = 'Empty Submission'; return; }
  const r = await api('/api/contact-request', { method: 'POST', body: JSON.stringify({ username: f.user.value.trim() }) });
  if (r.ok) { $('#contact_feedback').textContent = 'Success'; f.reset(); refreshContacts(); }
  else $('#contact_feedback').textContent = r.error;
});
$('#change_password_form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  const r = await api('/api/change-password', { method: 'POST', body: JSON.stringify({ currentPassword: f.currentPassword.value, newPassword: f.newPassword.value }) });
  if (r.ok) { alert(r.message); showLoggedOut(); }
  else $('#change_password_feedback').textContent = r.error;
});

// 5-second refresh, as sys.js did.
setInterval(() => { refreshMessages(); refreshDirect(); if (view === 'contacts' && !dmUser) refreshContacts(); }, 5000);

// Boot: are we already logged in?
(async () => {
  const r = await api('/api/me');
  if (r.ok) { me = r.user; showLoggedIn(); } else showLoggedOut();
})();
