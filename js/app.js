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
      app.innerHTML = renderHome(); break;
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
  // Firebase onValue returns an unsubscribe function
  if (typeof state.lbListener === 'function') { state.lbListener(); state.lbListener = null; }
}

// ── Event Listeners ────────────────────────────────────────────────────────────
function attachListeners() {
  const on = (id, ev, fn) => { const el = document.getElementById(id); if (el) el.addEventListener(ev, fn); };

  // ── Home ────────────────────────────────────────────────────────────────────
  on('btn-score', 'click', () => { stopLbListener(); state.screen = 'setup'; render(); });
  on('btn-lb',    'click', async () => {
    state.groupId = '';
    state.todayGroups = await FB.loadGroups(state.date);
    state.screen = 'leaderboard'; render();
  });
  on('btn-admin', 'click', () => { stopLbListener(); state.screen = 'admin'; render(); });

  // ── Admin ───────────────────────────────────────────────────────────────────
  on('admin-back', 'click', () => { state.screen = 'home'; render(); });
  on('admin-unlock', 'click', () => {
    const pin = document.getElementById('admin-pin')?.value || '';
    if (pin === ADMIN_PIN) { state.adminUnlocked = true; render(); }
    else { showToast('Incorrect PIN'); }
  });
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
  on('setup-back',       'click', () => { state.screen = 'home'; render(); });
  on('date-input',       'change', e => { state.date = e.target.value; });
  on('group-select',     'change', e => { state.groupId = e.target.value; });
  on('add-from-roster',  'click', () => {
    const sel = document.getElementById('roster-pick');
    if (!sel) return;
    const p = state.roster.find(r => r.id === sel.value);
    if (!p || state.groupPlayers.length >= 5) return;
    if (state.groupPlayers.find(gp => gp.rosterId === p.id)) { showToast(`${p.name} already added`); return; }
    state.groupPlayers.push({ rosterId: p.id, name: p.name, hdcp: p.hdcp, tee: p.tee });
    render();
  });
  document.querySelectorAll('[data-rem]').forEach(b => b.addEventListener('click', () => {
    state.groupPlayers.splice(parseInt(b.dataset.rem), 1); render();
  }));
  document.querySelectorAll('[data-gp][data-field]').forEach(inp => {
    inp.addEventListener('change', e => {
      const i = parseInt(e.target.dataset.gp), f = e.target.dataset.field;
      state.groupPlayers[i][f] = f === 'hdcp' ? parseInt(e.target.value) || 0 : e.target.value;
    });
  });
  document.querySelectorAll('[data-nine]').forEach(btn => btn.addEventListener('click', () => {
    const n = btn.dataset.nine;
    if ([state.nine1, state.nine2].includes(n)) return;
    state.nine2 = state.nine1; state.nine1 = n; render();
  }));
  on('start-round', 'click', () => {
    state.scores = {}; state.screen = 'scoring'; render();
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

  on('save-btn',     'click', () => doSave(null));
  on('save-lb-btn',  'click', () => doSave('lb'));
  on('lb-btn',       'click', async () => {
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
      // Ensure roster is an array (Firebase may return object)
      if (!Array.isArray(state.roster)) {
        state.roster = Object.values(state.roster);
      }
    } catch (e) {
      console.warn('Could not load roster:', e);
      state.roster = [];
    }
    render();
  };

  if (window._firebaseReady) {
    await tryBoot();
  } else {
    document.addEventListener('firebase-ready', tryBoot, { once: true });
    // Fallback if firebase fails to load after 5s
    setTimeout(() => {
      if (state.screen === 'home') return;
      document.getElementById('app').innerHTML =
        '<div class="empty-state">Could not connect to Firebase.<br>Check your config in index.html.</div>';
    }, 5000);
  }
}

boot();
