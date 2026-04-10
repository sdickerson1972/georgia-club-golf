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
  lbDate: null,   // date shown on leaderboard (defaults to today on open)
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
  groupKey:   (date, gid) => `rounds/${date.replace(/\//g,'-')}/${gid.replace(/[\s.#$\[\]\/]/g,'_')}`,

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
  async deleteGroup(date, groupId) {
    await window._dbRemove(window._dbRef(window._db, FB.groupKey(date, groupId)));
  },
  async saveGroupData(date, groupId, data) {
    await window._dbSet(window._dbRef(window._db, FB.groupKey(date, groupId)), data);
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
      app.innerHTML = state.adminUnlocked ? renderAdmin(state.roster, state.todayGroups) : renderAdminLock(); break;
    case 'setup':
      app.innerHTML = renderSetup(state, state.roster); break;
    case 'scoring':
      app.innerHTML = renderScoring(state); break;
    case 'leaderboard':
      app.innerHTML = renderLeaderboard(state.todayGroups, state.groupId, state.lastUpdated, state.lbDate || todayStr());
      startLbListener(); break;
  }
  attachListeners();
}

// ── Firebase live listener for leaderboard ─────────────────────────────────────
function startLbListener() {
  stopLbListener();
  if (!window._firebaseReady) return;
  // Only auto-subscribe for live updates when viewing today's round
  const viewDate = state.lbDate || todayStr();
  if (viewDate !== todayStr()) return;
  state.lbListener = FB.subscribeGroups(viewDate, (groups) => {
    state.todayGroups = groups || {};
    state.lastUpdated = Date.now();
    if (state.screen === 'leaderboard') {
      try {
        const standings = document.getElementById('pane-standings');
        const skinsPane = document.getElementById('pane-skins');
        if (standings) standings.innerHTML = renderStandings(state.todayGroups, state.groupId);
        if (skinsPane)  skinsPane.innerHTML = renderSkinsTab(state.todayGroups);
        const p = document.querySelector('.header p');
        if (p) p.innerHTML = `Updated ${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} · auto-refreshing`;
      } catch(e) { console.error('Leaderboard live update error:', e); }
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
  on('btn-score', 'click', async () => {
    stopLbListener();
    // Load today's groups so we can filter out already-assigned players and groups
    try { state.todayGroups = await FB.loadGroups(state.date); } catch(e) { state.todayGroups = {}; }
    // Auto-assign first available group name if current is already taken
    const takenGroups = new Set(
      Object.values(state.todayGroups)
        .filter(g => g.groupId !== state.groupId)
        .map(g => g.groupId)
    );
    if (takenGroups.has(state.groupId)) {
      const allGroups = ['Group 1','Group 2','Group 3','Group 4','Group 5','Group 6','Group 7','Group 8'];
      const firstFree = allGroups.find(g => !takenGroups.has(g));
      if (firstFree) state.groupId = firstFree;
    }
    state.screen = 'setup'; render();
  });
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
    const hasRound = state.groupPlayers.length > 0;
    const prevGroupId = hasRound ? state.groupId : '';
    state.lbDate = todayStr();  // always reset to today when opening from home
    try { state.todayGroups = await FB.loadGroups(state.lbDate); } catch(e) { state.todayGroups = {}; }
    state.groupId = prevGroupId;
    state.screen = 'leaderboard'; render();
  });
  on('btn-admin', 'click', async () => {
    stopLbListener();
    try { state.todayGroups = await FB.loadGroups(state.date); } catch(e) { state.todayGroups = {}; }
    state.screen = 'admin'; render();
  });

  // ── Admin PIN ──────────────────────────────────────────────────────────────
  const doUnlock = async () => {
    const pin = document.getElementById('admin-pin')?.value || '';
    if (pin !== ADMIN_PIN) { showToast('Incorrect PIN'); return; }
    const btn = document.getElementById('admin-unlock');
    if (btn) { btn.textContent = 'Signing in…'; btn.disabled = true; }
    try {
      await window._authSignIn(window._auth, window._adminEmail, window._adminPassword);
      state.adminUnlocked = true;
      render();
    } catch (e) {
      showToast('PIN correct but Firebase sign-in failed — check admin credentials in index.html');
      console.error('Admin auth error:', e);
      if (btn) { btn.textContent = 'Unlock'; btn.disabled = false; }
    }
  };
  on('admin-unlock', 'click', doUnlock);
  on('admin-pin', 'keydown', e => { if (e.key === 'Enter') doUnlock(); });
  on('admin-back', 'click', async () => {
    // Sign out when leaving admin so roster write access is revoked
    try { await window._authSignOut(window._auth); } catch(e) {}
    state.adminUnlocked = false;
    state.screen = 'home'; render();
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
    const user = window._auth?.currentUser;
    if (!user) { showToast('Not signed in — unlock admin first'); return; }
    try {
      await FB.saveRoster(state.roster);
      showToast('Roster saved to cloud ✓');
    } catch (e) {
      showToast('Save failed — check Firebase rules and admin credentials');
      console.error(e);
    }
  });

  // ── Delete entire group — uses Firebase key directly ──────────────────────
  document.querySelectorAll('[data-delete-fb-key]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const fbKey = btn.dataset.deleteFbKey;
      const group = state.todayGroups[fbKey] || {};
      const label = group.groupId || fbKey || 'this group';
      const path = `${FB.groupsKey(state.date)}/${fbKey}`;
      if (!confirm(`Delete ${label}?\nFirebase path: ${path}\n\nThis cannot be undone.`)) return;
      try {
        // Use FB.groupsKey so path is always consistent with how groups are saved
        const path = `${FB.groupsKey(state.date)}/${fbKey}`;
        console.log('Deleting at path:', path);
        await window._dbSet(window._dbRef(window._db, path), null);
        showToast(`${label} deleted`);
        state.todayGroups = await FB.loadGroups(state.date);
        render();
      } catch(e) {
        const msg = e?.message || e?.code || String(e);
        showToast('Delete failed: ' + msg.slice(0, 80));
        console.error('Delete error:', e);
      }
    });
  });

  // ── Remove player from a group — uses Firebase key directly ───────────────
  document.querySelectorAll('[data-remove-player][data-fb-key]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const pIdx  = parseInt(btn.dataset.removePlayer);
      const fbKey = btn.dataset.fbKey;
      const group = state.todayGroups[fbKey];
      if (!group) return;
      const players = Array.isArray(group.players)
        ? group.players
        : Object.keys(group.players||{}).sort((a,b)=>parseInt(a)-parseInt(b)).map(k=>(group.players||{})[k]);
      const playerName = players[pIdx]?.name || 'Player';
      const groupLabel = group.groupId || fbKey;
      if (!confirm(`Remove ${playerName} from ${groupLabel}?`)) return;
      try {
        const newPlayers = players.filter((_, i) => i !== pIdx);
        const newScores = {};
        let newIdx = 0;
        players.forEach((_, oldIdx) => {
          if (oldIdx === pIdx) return;
          newScores[newIdx] = group.scores?.[oldIdx] || group.scores?.[String(oldIdx)] || {};
          newIdx++;
        });
        const path = `${FB.groupsKey(state.date)}/${fbKey}`;
        await window._dbSet(window._dbRef(window._db, path), {
          ...group, players: newPlayers, scores: newScores, updatedAt: Date.now()
        });
        showToast(`${playerName} removed from ${groupLabel}`);
        state.todayGroups = await FB.loadGroups(state.date);
        render();
      } catch(e) { showToast('Remove failed: ' + (e?.message||e)); console.error(e); }
    });
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
    if (n === state.nine1) {
      // Deselect nine1 — promote nine2 to nine1, clear nine2
      state.nine1 = state.nine2;
      state.nine2 = null;
    } else if (n === state.nine2) {
      // Deselect nine2 — just clear it
      state.nine2 = null;
    } else if (!state.nine1) {
      // Nothing selected yet — set as nine1
      state.nine1 = n;
    } else if (!state.nine2) {
      // One already selected — set as nine2 (preserves order)
      state.nine2 = n;
    } else {
      // Both already selected — replace nine2 with new selection
      state.nine2 = n;
    }
    saveSession();
    render();
  }));
  on('start-round', 'click', () => {
    state.scores = {};
    saveSession();
    state.screen = 'scoring'; render();
  });

  // ── Scoring ─────────────────────────────────────────────────────────────────

  // Debounced autosave to Firebase — fires 2s after the last score entry
  let autoSaveTimer = null;
  const scheduleAutoSave = () => {
    clearTimeout(autoSaveTimer);
    const ind = document.getElementById('save-indicator');
    if (ind) ind.textContent = 'Saving…';
    autoSaveTimer = setTimeout(async () => {
      try {
        await FB.saveGroup(state.date, state.groupId, {
          groupId: state.groupId, nine1: state.nine1, nine2: state.nine2,
          players: state.groupPlayers, scores: state.scores
        });
        state.saveIndicator = 'Auto-saved ✓ ' + new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
        const ind2 = document.getElementById('save-indicator');
        if (ind2) ind2.textContent = state.saveIndicator;
      } catch (e) {
        const ind2 = document.getElementById('save-indicator');
        if (ind2) ind2.textContent = 'Auto-save failed';
        console.warn('Autosave failed:', e);
      }
    }, 2000);
  };

  // Build a lookup: [hole][golfer] -> input element
  // Layout is players-left / holes-across, so advance order is:
  //   next player on same hole → when last player done, first player on next hole
  const inputMap = {};
  document.querySelectorAll('.score-input').forEach(inp => {
    const h = parseInt(inp.dataset.hole);
    const g = parseInt(inp.dataset.golfer);
    if (!inputMap[h]) inputMap[h] = {};
    inputMap[h][g] = inp;
  });
  const numPlayers = state.groupPlayers.length;
  const totalHoles = 18;

  function getNextInput(currentHole, currentGolfer) {
    const nextGolfer = currentGolfer + 1;
    if (nextGolfer < numPlayers && inputMap[currentHole]?.[nextGolfer]) {
      // Next player, same hole
      return inputMap[currentHole][nextGolfer];
    }
    // Last player on this hole — move to first player on next hole
    const nextHole = currentHole + 1;
    if (nextHole < totalHoles && inputMap[nextHole]?.[0]) {
      return inputMap[nextHole][0];
    }
    return null; // end of card
  }

  // Live-update Tot and Pts cells for a given player on a given nine
  // without re-rendering the whole table (which would lose focus)
  function updatePlayerTotals(gIdx, nineIdx) {
    const nine = nineIdx === 0 ? state.nine1 : state.nine2;
    const C    = COURSES[nine];

    let total = 0, pts = 0;
    C.par.forEach((par, hIdx) => {
      const s = parseInt((state.scores[gIdx] || [])[nineIdx * 9 + hIdx]) || 0;
      total += s;
      if (s) pts += getPoints(s, par) || 0;
    });

    const totCell = document.getElementById(`tot-${nineIdx}-${gIdx}`);
    const ptsCell = document.getElementById(`pts-${nineIdx}-${gIdx}`);
    if (totCell) totCell.textContent = total || '';
    if (ptsCell) ptsCell.textContent = pts;
  }

  document.querySelectorAll('.score-input').forEach(inp => {
    // Select all text when tapping into a box so it's easy to correct
    inp.addEventListener('focus', e => e.target.select());

    inp.addEventListener('input', e => {
      const h = parseInt(e.target.dataset.hole);
      const g = parseInt(e.target.dataset.golfer);
      if (!state.scores[g]) state.scores[g] = [];
      state.scores[g][h] = e.target.value;
      const nine = h < 9 ? state.nine1 : state.nine2;
      const par  = COURSES[nine].par[h % 9];
      const s    = parseInt(e.target.value);
      e.target.className = 'score-input ' + (s ? getScoreClass(s, par) : '');

      // Update the Tot and Pts columns live in the DOM
      const nineIdx = h < 9 ? 0 : 1;
      updatePlayerTotals(g, nineIdx);

      // Only advance + autosave once a plausible score is entered (1-15)
      if (s >= 1 && s <= 15) {
        // Auto-advance: next player on same hole, then first player on next hole
        const next = getNextInput(h, g);
        if (next) setTimeout(() => next.focus(), 50);
        // Save session locally and schedule Firebase autosave
        saveSession();
        scheduleAutoSave();
      }
    });
  });

  const doSave = async (thenGo) => {
    const ind = document.getElementById('save-indicator');
    if (ind) ind.textContent = 'Saving…';
    try {
      // Sanitize scores — convert all values to integers, remove nulls/empties
      const cleanScores = {};
      Object.keys(state.scores).forEach(gIdx => {
        cleanScores[gIdx] = {};
        (state.scores[gIdx] || []).forEach((val, hIdx) => {
          const n = parseInt(val);
          if (!isNaN(n) && n > 0) cleanScores[gIdx][hIdx] = n;
        });
      });

      const payload = {
        groupId:  state.groupId,
        nine1:    state.nine1,
        nine2:    state.nine2,
        players:  state.groupPlayers,
        scores:   cleanScores,
      };

      console.log('Saving payload:', JSON.stringify(payload));
      await FB.saveGroup(state.date, state.groupId, payload);
      state.saveIndicator = 'Saved ✓ ' + new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
      saveSession();
      showToast('Scores saved ✓');
      if (thenGo === 'lb') {
        try { state.todayGroups = await FB.loadGroups(state.date); } catch(e) { state.todayGroups = {}; }
        state.screen = 'leaderboard'; render();
      } else {
        if (ind) ind.textContent = state.saveIndicator;
      }
    } catch (e) {
      // Show the actual Firebase error message to help diagnose
      const msg = e?.message || e?.code || String(e);
      showToast('Save failed: ' + msg.slice(0, 60));
      console.error('Save error full details:', e);
      if (ind) ind.textContent = 'Save failed';
    }
  };

  on('save-btn',    'click', () => doSave(null));
  on('save-lb-btn', 'click', () => doSave('lb'));
  on('lb-btn', 'click', async () => {
    state.lbDate = todayStr();
    try { state.todayGroups = await FB.loadGroups(state.lbDate); } catch(e) { state.todayGroups = {}; }
    state.screen = 'leaderboard'; render();
  });
  on('scoring-back', 'click', () => { state.screen = 'setup'; render(); });



  // ── Leaderboard ──────────────────────────────────────────────────────────────
  on('lb-refresh', 'click', async () => {
    try { state.todayGroups = await FB.loadGroups(state.lbDate || todayStr()); } catch(e) { state.todayGroups = {}; }
    state.lastUpdated = Date.now();
    render();
  });

  on('lb-date-pick', 'change', async e => {
    const picked = e.target.value;
    if (!picked) return;
    state.lbDate = picked;
    state.lastUpdated = null;
    stopLbListener();
    try { state.todayGroups = await FB.loadGroups(state.lbDate); } catch(e2) { state.todayGroups = {}; }
    state.lastUpdated = Date.now();
    render();
  });

  on('lb-goto-today', 'click', async () => {
    state.lbDate = todayStr();
    state.lastUpdated = null;
    try { state.todayGroups = await FB.loadGroups(state.lbDate); } catch(e) { state.todayGroups = {}; }
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

  // ── Tap a player row to see their group scorecard ──────────────────────────
  // Use event delegation on the app root so it works even after live Firebase
  // updates replace pane-standings innerHTML without re-running attachListeners
  const appEl = document.getElementById('app');
  if (appEl && !appEl._scoreModalDelegated) {
    appEl._scoreModalDelegated = true;
    appEl.addEventListener('click', e => {
      const row = e.target.closest('[data-open-group]');
      if (!row) return;
      const fbKey   = row.dataset.fbKey;
      const groupId = row.dataset.openGroup;
      // Try direct Firebase key lookup first (most reliable), then fall back to groupId match
      const normalize = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
      let group = fbKey ? state.todayGroups[fbKey] : null;
      if (!group) {
        group = Object.values(state.todayGroups).find(g =>
          normalize(g.groupId) === normalize(groupId)
        );
      }
      if (group) {
        showGroupModal(group);
      } else {
        console.warn('Group not found. fbKey:', fbKey, 'groupId:', groupId,
          'available keys:', Object.keys(state.todayGroups),
          'available groupIds:', Object.values(state.todayGroups).map(g=>g.groupId));
        showToast('Could not load scorecard — try refreshing the leaderboard');
      }
    });
  }
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
