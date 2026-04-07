// ── App State ──────────────────────────────────────────────────────────────────
const state = {
  screen: 'home',
  adminUnlocked: false,
  date: todayStr(),
  nine1: 'Red', nine2: 'Black',
  groupId: 'Group 1',
  groupPlayers: [],
  scores: {},
  roster: [],
  todayGroups: {},
  saveIndicator: '',
  lastUpdated: null,
  lbListener: null,
};

// ── Local session persistence ──────────────────────────────────────────────────
// Saves the active round to localStorage so reopening the app or visiting the
// leaderboard and coming back doesn't lose the group setup or scores.
const SESSION_KEY = 'gc_active_round';

function saveSession() {
  try {
    const session = {
      date:         state.date,
      nine1:        state.nine1,
      nine2:        state.nine2,
      groupId:      state.groupId,
      groupPlayers: state.groupPlayers,
      scores:       state.scores,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (e) { console.warn('Session save failed:', e); }
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    // Only restore if it's from today
    if (s.date !== todayStr()) {
      localStorage.removeItem(SESSION_KEY);
      return false;
    }
    state.date         = s.date;
    state.nine1        = s.nine1;
    state.nine2        = s.nine2;
    state.groupId      = s.groupId;
    state.groupPlayers = s.groupPlayers || [];
    state.scores       = s.scores || {};
    return state.groupPlayers.length > 0;
  } catch (e) { return false; }
}

function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
}

// ── Firebase helpers ───────────────────────────────────────────────────────────
const FB = {
  rosterKey: () => 'roster',
  groupsKey:  (date) => `rounds/${date}`,
  groupKey:   (date, gid) => `rounds/${date}/${gid.replace(/\s/g,'_')}`,

  async saveRoster(roster) {
    await window._dbSet(window._dbRef(window._db, FB.rosterKey()), roster);
  },
  async loadRoster() {
    const snap = await window._dbGet(window._dbRef(window._db, FB.rosterKey()));
    return snap.exists() ? snap.val() : [];
  },
  async saveGroup(date, groupId, data) {
    await window._dbSet(window._dbRef(window._db, FB.groupKey(date, groupId)), {
      ...data, updatedAt: Date.now()
    });
  },
  async loadGroups(date) {
    const snap = await window._dbGet(window._dbRef(window._db, FB.groupsKey(date)));
    return snap.exists() ? snap.val() : {};
  },
  subscribeGroups(date, callback) {
    const r = window._dbRef(window._db, FB.groupsKey(date));
    return window._dbOnValue(r, snap => callback(snap.exists() ? snap.val() : {}));
  }
};

// ── Render ─────────────────────────────────────────────────────────────────────
function render() {
  const app = document.getElementById('app');
  switch (state.screen) {
    case 'home':
      app.innerHTML = renderHome(state.groupPlayers.length > 0); break;
    case 'admin':
      app.innerHTML = state.adminUnlocked ? renderAdmin(state.roster) : renderAdminLock(); break;
    case 'setup':
      app.innerHTML = renderSetup(state, state.roster); break;
    case 'scoring':
      app.innerHTML = renderScoring(state); break;
    case 'leaderboard':
      app.innerHTML = renderLeaderboard(state.todayGroups, state.groupId, state.lastUpdated);
      startLbListener(); break;
  }
  attachListeners();
}

// ── Firebase live listener for leaderboard ─────────────────────────────────────
function startLbListener() {
  stopLbListener();
  if (!window._firebaseReady) return;
  state.lbListener = FB.subscribeGroups(state.date, (groups) => {
    state.todayGroups = groups || {};
    state.lastUpdated = Date.now();
    if (state.screen === 'leaderboard') {
      const standings = document.getElementById('pane-standings');
      const skinsPane = document.getElementById('pane-skins');
      if (standings) standings.innerHTML = renderStandings(state.todayGroups, state.groupId);
      if (skinsPane) skinsPane.innerHTML = renderSkinsTab(state.todayGroups);
      const p = document.querySelector('.header p');
      if (p) p.innerHTML = `Updated ${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} · auto-refreshing`;
    }
  });
}

function stopLbListener() {
  if (typeof state.lbListener === 'function') { state.lbListener(); state.lbListener = null; }
}

// ── Event Listeners ────────────────────────────────────────────────────────────
function attachListeners() {
  const on = (id, ev, fn) => { const el = document.getElementById(id); if (el) el.addEventListener(ev, fn); };

  // ── Home ────────────────────────────────────────────────────────────────────
  on('btn-score', 'click', () => { stopLbListener(); state.screen = 'setup'; render(); });
  on('btn-resume', 'click', () => { stopLbListener(); state.screen = 'scoring'; render(); });
  on('btn-end-round', 'click', () => {
    if (confirm('End the current round? This will clear your group and scores.')) {
      clearSession();
      state.groupPlayers = [];
      state.scores = {};
      state.groupId = 'Group 1';
      render();
    }
  });
  on('btn-lb', 'click', async () => {
    const prevGroupId = state.groupId;
    state.todayGroups = await FB.loadGroups(state.date);
    state.groupId = prevGroupId;
    state.screen = 'leaderboard'; render();
  });
  on('btn-admin', 'click', () => { stopLbListener(); state.screen = 'admin'; render(); });

  // ── Admin PIN ──────────────────────────────────────────────────────────────
  const doUnlock = () => {
    const pin = document.getElementById('admin-pin')?.value || '';
    if (pin === ADMIN_PIN) { state.adminUnlocked = true; render(); }
    else { showToast('Incorrect PIN'); }
  };
  on('admin-unlock', 'click', doUnlock);
  on('admin-pin', 'keydown', e => { if (e.key === 'Enter') doUnlock(); });
  on('admin-back', 'click', () => { state.screen = 'home'; render(); });
  on('add-player', 'click', () => {
    const name = document.getElementById('new-name')?.value.trim() || '';
    const hdcp = parseInt(document.getElementById('new-hdcp')?.value) || 0;
    const tee  = document.getElementById('new-tee')?.value || 'White';
    if (!name) { showToast('Enter a player name'); return; }
    state.roster.push({ id: Date.now() + '' + Math.random(), name, hdcp, tee });
    render();
  });
  document.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
    state.roster.splice(parseInt(b.dataset.del), 1); render();
  }));
  on('admin-save', 'click', async () => {
    try {
      await FB.saveRoster(state.roster);
      showToast('Roster saved to cloud ✓');
    } catch (e) { showToast('Save failed — check Firebase config'); console.error(e); }
  });

  // ── Setup ───────────────────────────────────────────────────────────────────
  on('setup-back', 'click', () => { state.screen = 'home'; render(); });
  on('date-input', 'change', e => { state.date = e.target.value; });
  on('group-select', 'change', e => { state.groupId = e.target.value; });
  on('add-from-roster', 'click', () => {
    const sel = document.getElementById('roster-pick');
    if (!sel) return;
    const p = state.roster.find(r => r.id === sel.value);
    if (!p || state.groupPlayers.length >= 5) return;
    if (state.groupPlayers.find(gp => gp.rosterId === p.id)) { showToast(`${p.name} already added`); return; }
    state.groupPlayers.push({ rosterId: p.id, name: p.name, hdcp: p.hdcp, tee: p.tee });
    saveSession();
    render();
  });
  document.querySelectorAll('[data-rem]').forEach(b => b.addEventListener('click', () => {
    state.groupPlayers.splice(parseInt(b.dataset.rem), 1);
    saveSession();
    render();
  }));
  document.querySelectorAll('[data-gp][data-field]').forEach(inp => {
    inp.addEventListener('change', e => {
      const i = parseInt(e.target.dataset.gp), f = e.target.dataset.field;
      state.groupPlayers[i][f] = f === 'hdcp' ? parseInt(e.target.value) || 0 : e.target.value;
      saveSession();
    });
  });
  document.querySelectorAll('[data-nine]').forEach(btn => btn.addEventListener('click', () => {
    const n = btn.dataset.nine;
    if ([state.nine1, state.nine2].includes(n)) return;
    state.nine2 = state.nine1; state.nine1 = n;
    saveSession();
    render();
  }));
  on('start-round', 'click', () => {
    state.scores = {};
    saveSession();
    state.screen = 'scoring'; render();
  });

  // ── Scoring ─────────────────────────────────────────────────────────────────
  document.querySelectorAll('.score-input').forEach(inp => {
    inp.addEventListener('input', e => {
      const h = parseInt(e.target.dataset.hole);
      const g = parseInt(e.target.dataset.golfer);
      if (!state.scores[g]) state.scores[g] = [];
      state.scores[g][h] = e.target.value;
      const nine = h < 9 ? state.nine1 : state.nine2;
      const par  = COURSES[nine].par[h % 9];
      const s    = parseInt(e.target.value);
      e.target.className = 'score-input ' + (s ? getScoreClass(s, par) : '');
      // Auto-save session on every score entry
      saveSession();
    });
  });

  const doSave = async (thenGo) => {
    const ind = document.getElementById('save-indicator');
    if (ind) ind.textContent = 'Saving…';
    try {
      await FB.saveGroup(state.date, state.groupId, {
        groupId: state.groupId, nine1: state.nine1, nine2: state.nine2,
        players: state.groupPlayers, scores: state.scores
      });
      state.saveIndicator = 'Saved ✓ ' + new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
      saveSession();
      showToast('Scores saved ✓');
      if (thenGo === 'lb') {
        state.todayGroups = await FB.loadGroups(state.date);
        state.screen = 'leaderboard'; render();
      } else {
        if (ind) ind.textContent = state.saveIndicator;
      }
    } catch (e) {
      showToast('Save failed — check connection'); console.error(e);
      if (ind) ind.textContent = 'Save failed';
    }
  };

  on('save-btn',    'click', () => doSave(null));
  on('save-lb-btn', 'click', () => doSave('lb'));
  on('lb-btn',      'click', async () => {
    state.todayGroups = await FB.loadGroups(state.date);
    state.screen = 'leaderboard'; render();
  });
  on('scoring-back', 'click', () => { state.screen = 'setup'; render(); });

  // ── Leaderboard ──────────────────────────────────────────────────────────────
  on('lb-refresh', 'click', async () => {
    state.todayGroups = await FB.loadGroups(state.date);
    state.lastUpdated = Date.now();
    render();
  });
  on('lb-home', 'click', () => { stopLbListener(); state.screen = 'home'; render(); });
  on('lb-back-scoring', 'click', () => { stopLbListener(); state.screen = 'scoring'; render(); });

  on('tab-standings', 'click', () => {
    document.getElementById('pane-standings').style.display = '';
    document.getElementById('pane-skins').style.display = 'none';
    document.getElementById('tab-standings').classList.add('active');
    document.getElementById('tab-skins').classList.remove('active');
  });
  on('tab-skins', 'click', () => {
    document.getElementById('pane-skins').style.display = '';
    document.getElementById('pane-standings').style.display = 'none';
    document.getElementById('tab-skins').classList.add('active');
    document.getElementById('tab-standings').classList.remove('active');
  });
}

// ── Boot ───────────────────────────────────────────────────────────────────────
async function boot() {
  document.getElementById('app').innerHTML = '<div class="spinner">Loading…</div>';

  const tryBoot = async () => {
    try {
      state.roster = await FB.loadRoster() || [];
      if (!Array.isArray(state.roster)) {
        state.roster = Object.values(state.roster);
      }
    } catch (e) {
      console.warn('Could not load roster:', e);
      state.roster = [];
    }

    // Restore any in-progress round from today
    const hasSession = loadSession();
    if (hasSession) {
      // Show home with a "Resume Round" banner instead of jumping straight
      // into scoring — gives the user control
      state.screen = 'home';
    }

    render();
  };

  if (window._firebaseReady) {
    await tryBoot();
  } else {
    document.addEventListener('firebase-ready', tryBoot, { once: true });
    setTimeout(() => {
      const app = document.getElementById('app');
      if (app && app.innerHTML.includes('spinner')) {
        app.innerHTML =
          '<div class="empty-state" style="padding:40px 24px">' +
          '<p style="font-size:16px;font-weight:600;margin-bottom:8px">Connection error</p>' +
          '<p>Firebase did not load. Please check your config in <code>index.html</code> ' +
          'and make sure your databaseURL is correct.</p>' +
          '<button class="btn btn-primary" style="margin-top:16px" onclick="location.reload()">Retry</button>' +
          '</div>';
      }
    }, 8000);
  }
}

boot();
