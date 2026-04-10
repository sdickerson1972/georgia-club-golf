// ── UI helpers ─────────────────────────────────────────────────────────────────

function showToast(msg, duration = 2200) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), duration);
}

function teeDot(tee) {
  return `<span class="tee-dot" style="background:${TEE_COLORS[tee] || '#bbb'}"></span>`;
}

function diffStr(diff) {
  if (diff === 0) return '<span class="even">E</span>';
  return diff > 0
    ? `<span class="pos">+${diff}</span>`
    : `<span class="neg">${diff}</span>`;
}

function rankClass(i) {
  if (i === 0) return 'gold';
  if (i === 1) return 'silver';
  if (i === 2) return 'bronze';
  return '';
}

// ── Home screen ────────────────────────────────────────────────────────────────
function renderHome(hasActiveRound) {
  const resumeBanner = hasActiveRound ? `
    <div style="margin:12px 12px 0;background:#fff3cd;border:1.5px solid #ffc107;border-radius:var(--radius-lg);padding:14px 16px">
      <div style="font-size:13px;font-weight:700;color:#7a5c00;margin-bottom:8px">⛳ Round in progress</div>
      <div style="font-size:13px;color:#7a5c00;margin-bottom:10px">You have an active round saved. Pick up where you left off.</div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary btn-sm" id="btn-resume" style="flex:1">Resume Scoring</button>
        <button class="btn btn-sm btn-danger" id="btn-end-round" style="flex:1">End Round</button>
      </div>
    </div>` : '';

  return `
  <div class="header">
    <h1>The Georgia Club</h1>
    <p>Chancellors Course — Statham, GA</p>
  </div>
  <div class="content" style="padding-top:8px">
    ${resumeBanner}
    <div class="home-card" id="btn-score">
      <div class="home-card-icon">⛳</div>
      <div class="home-card-text">
        <h2>${hasActiveRound ? 'New Round' : 'Score a Round'}</h2>
        <p>${hasActiveRound ? 'Start fresh with a new group setup' : 'Set up your group and enter hole-by-hole scores'}</p>
      </div>
    </div>
    <div class="home-card" id="btn-lb">
      <div class="home-card-icon">🏆</div>
      <div class="home-card-text">
        <h2>Live Leaderboard</h2>
        <p>See standings and skins for today's round</p>
      </div>
    </div>
    <div class="home-card" id="btn-admin">
      <div class="home-card-icon">⚙️</div>
      <div class="home-card-text">
        <h2>Admin — Player Roster</h2>
        <p>Manage the master player list</p>
      </div>
    </div>
    <div class="info-box" style="margin:12px 12px 0">
      <strong>How it works:</strong> The admin loads the player roster once. Each group scorer picks players from the list, enters scores during the round, and saves. The leaderboard updates live for all players.
    </div>
  </div>`;
}

// ── Admin screen ───────────────────────────────────────────────────────────────
function renderAdminLock() {
  return `
  <div class="header">
    <div class="header-row">
      <div><h1>Admin</h1><p>Player Roster</p></div>
      <button class="btn btn-sm" id="admin-back" style="background:rgba(255,255,255,0.15);color:#fff;border-color:transparent">← Back</button>
    </div>
  </div>
  <div class="content">
    <div class="section">
      <div class="field">
        <label class="field-label">Enter Admin PIN</label>
        <input type="password" id="admin-pin" placeholder="PIN" style="max-width:200px"/>
      </div>
      <button class="btn btn-primary" id="admin-unlock">Unlock</button>
    </div>
  </div>`;
}

function renderAdmin(roster, todayGroups) {
  const rosterRows = roster.length === 0
    ? '<p style="color:var(--gray-400);font-size:14px">No players yet. Add some below.</p>'
    : `<div class="col-headers" style="grid-template-columns:1fr 52px 96px 30px;margin-bottom:4px">
         <span>Name</span><span style="text-align:center">Hdcp</span><span>Tees</span><span></span>
       </div>` +
      roster.map((p, i) => `
        <div class="player-setup-row" style="grid-template-columns:1fr 52px 96px 30px">
          <span style="font-size:14px;font-weight:600">${p.name}</span>
          <span style="font-size:13px;text-align:center;color:var(--gray-600)">H${p.hdcp}</span>
          <span style="font-size:13px">${teeDot(p.tee)}${p.tee}</span>
          <button class="btn btn-xs btn-danger" data-del="${i}">✕</button>
        </div>`).join('');

  // Today's active groups — use Object.entries to keep Firebase key for deletion
  const groupEntries = Object.entries(todayGroups || {});
  const groupsHtml = groupEntries.length === 0
    ? '<p style="color:var(--gray-400);font-size:13px">No groups active today.</p>'
    : groupEntries.map(([fbKey, group]) => {
        const players = normalizeArray(group.players);
        const label   = group.groupId || fbKey || 'Unknown';
        const nines   = (group.nine1 && group.nine2) ? `${group.nine1} + ${group.nine2}` : 'No nines set';
        const isValid = group.nine1 && group.nine2 && players.length > 0;

        const playerRows = players.map((p, pIdx) => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:5px 0;border-bottom:0.5px solid var(--gray-100)">
            <span style="font-size:13px">${teeDot(p.tee||'White')}${p.name||'Unknown'} <span style="color:var(--gray-400);font-size:11px">H${p.hdcp||0}</span></span>
            <button class="btn btn-xs btn-danger" data-remove-player="${pIdx}" data-fb-key="${fbKey}">Remove</button>
          </div>`).join('');

        return `
          <div style="margin-bottom:12px;border:1px solid ${isValid?'var(--gray-200)':'#ef9a9a'};border-radius:var(--radius-md);overflow:hidden">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:${isValid?'var(--gray-50)':'var(--red-pale)'}">
              <div>
                <span style="font-weight:700;font-size:14px">${label}</span>
                ${!isValid?`<span style="font-size:11px;color:var(--red-text);margin-left:6px">invalid entry</span>`:''}
              </div>
              <div style="display:flex;gap:6px;align-items:center">
                <span style="font-size:12px;color:var(--gray-400)">${nines}</span>
                <button class="btn btn-xs btn-danger" data-delete-fb-key="${fbKey}">Delete</button>
              </div>
            </div>
            <div style="padding:4px 12px 8px">${playerRows||'<p style="font-size:12px;color:var(--gray-400);padding:4px 0">No players</p>'}</div>
          </div>`;
      }).join('');

  return `
  <div class="header">
    <div class="header-row">
      <div><h1>Admin</h1><p>Roster & Groups</p></div>
      <button class="btn btn-sm" id="admin-back" style="background:rgba(255,255,255,0.15);color:#fff;border-color:transparent">← Back</button>
    </div>
  </div>
  <div class="content">
    <div class="section">
      <div class="section-label">Today's Groups</div>
      ${groupsHtml}
    </div>
    <div class="section">
      <div class="section-label">Add Player to Roster</div>
      <div class="input-row" style="margin-bottom:8px">
        <div class="field"><label class="field-label">Name</label><input type="text" id="new-name" placeholder="Full name"/></div>
        <div class="field" style="max-width:72px"><label class="field-label">Hdcp</label><input type="number" id="new-hdcp" min="0" max="54" placeholder="0"/></div>
        <div class="field" style="max-width:110px">
          <label class="field-label">Tees</label>
          <select id="new-tee"><option>White</option><option>Silver</option><option>Black</option></select>
        </div>
      </div>
      <button class="btn btn-primary" id="add-player">+ Add to Roster</button>
    </div>
    <div class="section">
      <div class="section-label">Current Roster (${roster.length} players)</div>
      ${rosterRows}
    </div>
    <div style="padding:12px">
      <button class="btn btn-primary btn-block" id="admin-save">Save Roster to Cloud</button>
    </div>
  </div>`;
}

// ── Setup screen ───────────────────────────────────────────────────────────────
function renderSetup(state, roster) {
  const { nine1, nine2, groupId, groupPlayers, date, todayGroups } = state;
  const totalPar = (nine1 ? COURSES[nine1].par.reduce((a,b)=>a+b,0) : 0)
                 + (nine2 ? COURSES[nine2].par.reduce((a,b)=>a+b,0) : 0);

  // Build set of roster IDs already in OTHER groups today
  const takenIds = new Set();
  const takenByGroup = {}; // rosterId -> groupId
  Object.values(todayGroups || {}).forEach(group => {
    if (group.groupId === groupId) return; // skip our own group
    (group.players || []).forEach(p => {
      if (p.rosterId) {
        takenIds.add(p.rosterId);
        takenByGroup[p.rosterId] = group.groupId;
      }
    });
  });

  const addedIds = new Set(groupPlayers.map(p => p.rosterId));
  const availableRoster = roster
    .filter(p => !addedIds.has(p.id) && !takenIds.has(p.id))
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  // Players already taken — shown greyed out so scorer knows
  const takenRoster = roster
    .filter(p => takenIds.has(p.id))
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  const takenNote = takenRoster.length > 0
    ? `<p style="font-size:12px;color:var(--gray-400);margin-top:8px">
         Already in another group: ${takenRoster.map(p => `${p.name} (${takenByGroup[p.id]})`).join(', ')}
       </p>`
    : '';

  const rosterOpts = availableRoster.length === 0
    ? '<option disabled>No available players</option>'
    : availableRoster.map(p => `<option value="${p.id}">${p.name} (H${p.hdcp}, ${p.tee})</option>`).join('');

  const playerRows = groupPlayers.map((p, i) => `
    <div class="player-setup-row">
      <span style="font-size:14px;font-weight:600">${p.name}</span>
      <input type="number" min="0" max="54" value="${p.hdcp}" data-gp="${i}" data-field="hdcp" style="height:36px;font-size:13px"/>
      <select data-gp="${i}" data-field="tee" style="height:36px;font-size:13px">
        ${['White','Silver','Black'].map(t=>`<option ${p.tee===t?'selected':''}>${t}</option>`).join('')}
      </select>
      <button class="btn btn-xs btn-danger" data-rem="${i}">✕</button>
    </div>`).join('');

  // Nine button label shows order badge if selected
  const nineBtnLabel = (n) => {
    if (n === nine1) return `${n} <span style="font-size:10px;background:#fff;color:var(--green);border-radius:10px;padding:1px 5px;margin-left:2px">1st</span>`;
    if (n === nine2) return `${n} <span style="font-size:10px;background:#fff;color:var(--green);border-radius:10px;padding:1px 5px;margin-left:2px">2nd</span>`;
    return n;
  };

  const summaryLine = nine1 && nine2
    ? `<strong>${nine1}</strong> (par ${COURSES[nine1].par.reduce((a,b)=>a+b,0)})
       + <strong>${nine2}</strong> (par ${COURSES[nine2].par.reduce((a,b)=>a+b,0)})
       = par <strong>${totalPar}</strong>`
    : nine1
    ? `<strong>${nine1}</strong> selected — tap a second nine`
    : `Tap to select the first nine`;

  return `
  <div class="header">
    <div class="header-row">
      <div><h1>New Round</h1><p>Set up your group</p></div>
      <button class="btn btn-sm" id="setup-back" style="background:rgba(255,255,255,0.15);color:#fff;border-color:transparent">← Home</button>
    </div>
  </div>
  <div class="content">
    <div class="section">
      <div class="input-row">
        <div class="field">
          <label class="field-label">Date</label>
          <input type="date" id="date-input" value="${date}"/>
        </div>
        <div class="field" style="max-width:150px">
          <label class="field-label">Group</label>
          <select id="group-select">
            ${(() => {
              // Build set of group names already taken by OTHER active groups today
              const takenGroups = new Set(
                Object.values(todayGroups || {})
                  .filter(g => g.groupId !== groupId)
                  .map(g => g.groupId)
              );
              const allGroups = ['Group 1','Group 2','Group 3','Group 4','Group 5','Group 6','Group 7','Group 8'];
              // Auto-select first available group if current groupId is taken
              const available = allGroups.filter(g => !takenGroups.has(g));
              return allGroups.map(g => {
                const taken = takenGroups.has(g);
                const selected = groupId === g || (!takenGroups.has(groupId) ? groupId === g : g === available[0]);
                return `<option ${selected?'selected':''} ${taken?'disabled':''} style="${taken?'color:var(--gray-400)':''}">${g}${taken?' (taken)':''}</option>`;
              }).join('');
            })()}
          </select>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-label">Select Two Nines to Play (tap in order)</div>
      <div class="nine-selector">
        ${['Red','Black','Silver'].map(n=>`<button class="nine-btn ${n===nine1||n===nine2?'active':''}" data-nine="${n}">${nineBtnLabel(n)}</button>`).join('')}
      </div>
      <p style="margin-top:8px;font-size:13px;color:var(--gray-600)">${summaryLine}</p>
    </div>

    <div class="section">
      <div class="section-label">Add Players from Roster</div>
      ${roster.length === 0
        ? `<p style="font-size:13px;color:#c62828">No roster loaded — go to Admin to add players first.</p>`
        : `<div class="input-row">
             <select id="roster-pick" style="flex:1">${rosterOpts}</select>
             <button class="btn btn-primary btn-sm" id="add-from-roster" ${groupPlayers.length>=5||availableRoster.length===0?'disabled':''}>Add</button>
           </div>
           ${takenNote}`}
    </div>

    ${groupPlayers.length > 0 ? `
    <div class="section">
      <div class="section-label">Group Players (${groupPlayers.length}/5) — adjust hdcp/tees if needed</div>
      <div class="col-headers"><span>Name</span><span style="text-align:center">Hdcp</span><span>Tees</span><span></span></div>
      ${playerRows}
    </div>` : ''}

    <div style="padding:12px">
      <button class="btn btn-primary btn-block" id="start-round" ${groupPlayers.length===0||!nine1||!nine2?'disabled':''} style="height:48px;font-size:15px">
        Start Scoring →
      </button>
    </div>
  </div>`;
}

// ── Scorecard nine table ───────────────────────────────────────────────────────
// Layout: players down LEFT, all 9 holes across TOP, horizontally scrollable
function renderNineTable(nine, nineIdx, groupPlayers, scores) {
  const C = COURSES[nine];
  const overallHdcps = C.hdcp.map(h => getOverallHdcp(nineIdx, h));

  // ── Column headers — all 9 holes
  const holeHeaders = C.par.map((par, hIdx) => {
    const gh = nineIdx * 9 + hIdx;
    const oh = overallHdcps[hIdx];
    return `<th>
      <div style="font-size:16px;font-weight:700">${gh + 1}</div>
      <div style="font-size:12px;color:var(--gray-400);font-weight:500">P${par}</div>
      <div style="font-size:12px;color:var(--gray-400)">H${oh}</div>
    </th>`;
  }).join('');

  // ── One row per player
  const playerRows = groupPlayers.map((p, gIdx) => {
    const firstName = (p.name || '?').split(' ')[0];

    const scoreCells = C.par.map((par, hIdx) => {
      const gh  = nineIdx * 9 + hIdx;
      const oh  = overallHdcps[hIdx];
      const s   = parseInt((scores[gIdx] || [])[gh]) || 0;
      const cls = s ? getScoreClass(s, par) : '';
      const hasStroke = playerGetsStroke(p.hdcp, oh);
      return `<td style="padding:4px 3px">
        <div class="score-cell-wrap">
          <input class="score-input ${cls}" type="number" inputmode="numeric" min="1" max="15"
            value="${s||''}" data-hole="${gh}" data-golfer="${gIdx}"/>
          ${hasStroke
            ? '<span class="stroke-dot"></span>'
            : '<span style="display:block;height:6px"></span>'}
        </div>
      </td>`;
    }).join('');

    let nineTotal = 0, ninePts = 0;
    C.par.forEach((par, hIdx) => {
      const s = parseInt((scores[gIdx]||[])[nineIdx*9+hIdx]);
      if (s) { nineTotal += s; ninePts += getPoints(s, par) || 0; }
    });

    return `
      <tr>
        <td style="text-align:left;padding-left:8px;white-space:nowrap;min-width:80px">
          <div style="display:flex;align-items:center;gap:5px">
            ${teeDot(p.tee)}
            <span style="font-size:14px;font-weight:700">${firstName}</span>
          </div>
          <div style="font-size:11px;color:var(--gray-400);padding-left:13px">H${p.hdcp}</div>
        </td>
        ${scoreCells}
        <td id="tot-${nineIdx}-${gIdx}" style="font-weight:700;font-size:14px;background:var(--gray-50);padding:4px 5px">${nineTotal||''}</td>
        <td id="pts-${nineIdx}-${gIdx}" style="font-weight:700;font-size:14px;color:var(--green);background:var(--green-pale);padding:4px 5px">${ninePts}</td>
      </tr>`;
  }).join('');

  return `
  <div class="sc-nine-header">
    <span class="sc-nine-stripe" style="background:${C.color}"></span>
    <span style="font-size:14px;font-weight:700;color:${C.color}">${C.name}</span>
    <span style="font-size:12px;color:var(--gray-400);margin-left:4px">par ${C.par.reduce((a,b)=>a+b,0)}</span>
  </div>
  <div class="sc-wrap">
    <table class="scorecard">
      <thead>
        <tr>
          <th style="text-align:left;padding-left:8px;min-width:80px">Player</th>
          ${holeHeaders}
          <th style="min-width:40px">Tot</th>
          <th style="min-width:40px">Pts</th>
        </tr>
      </thead>
      <tbody>${playerRows}</tbody>
    </table>
  </div>`;
}

// ── Scoring screen ─────────────────────────────────────────────────────────────
function renderScoring(state) {
  const { nine1, nine2, groupId, groupPlayers, scores, date, saveIndicator } = state;
  return `
  <div class="header">
    <div class="header-row">
      <div>
        <h1>${groupId}</h1>
        <p>${nine1} + ${nine2} — ${date}</p>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="btn btn-sm" id="save-btn" style="background:rgba(255,255,255,0.15);color:#fff;border-color:rgba(255,255,255,0.3)">Save</button>
        <button class="btn btn-sm" id="lb-btn" style="background:var(--gold);color:#fff;border-color:var(--gold)">Board</button>
      </div>
    </div>
    <div class="save-indicator" id="save-indicator">${saveIndicator||''}</div>
  </div>
  <div class="content">
    ${renderNineTable(nine1, 0, groupPlayers, scores)}
    <div class="divider" style="margin:8px 12px"></div>
    ${renderNineTable(nine2, 1, groupPlayers, scores)}
    <div style="padding:12px;display:flex;gap:8px">
      <button class="btn" id="scoring-back" style="flex:1">← Setup</button>
      <button class="btn btn-primary" id="save-lb-btn" style="flex:2">Save & View Leaderboard</button>
    </div>
    <p style="text-align:center;font-size:12px;color:var(--gray-400);padding:0 16px 8px">
      Blue dot = player gets a stroke on this hole
    </p>
  </div>`;
}

// ── Leaderboard ────────────────────────────────────────────────────────────────
function normalizeArray(val) {
  // Firebase returns arrays as objects {"0":{...},"1":{...}} — convert back to array
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return Object.keys(val).sort((a,b)=>parseInt(a)-parseInt(b)).map(k => val[k]);
}

function computePlayerResults(group) {
  try {
  const { nine1, nine2, groupId } = group;
  const players = normalizeArray(group.players);
  const scores  = group.scores || {};
  if (!players || !nine1 || !nine2 || !COURSES[nine1] || !COURSES[nine2]) return [];
  const { pars, hdcps } = getRoundArrays(nine1, nine2);
  const totalPar = pars.reduce((a,b)=>a+b,0);

  return players.map((p, gIdx) => {
    // scores may be an array (local) or object with string keys (from Firebase)
    const playerScores = scores[gIdx] || scores[String(gIdx)] || {};
    let total = 0, pts = 0, playedPar = 0;
    const hScores = pars.map((par, hIdx) => {
      const s = parseInt(playerScores[hIdx] ?? playerScores[String(hIdx)]) || 0;
      total += s;
      if (s) {
        pts += getPoints(s, par) || 0;
        playedPar += par;
      }
      return s;
    });
    const holesPlayed = hScores.filter(s => s > 0).length;
    const target = Math.max(0, 36 - p.hdcp);
    return {
      name: p.name, hdcp: p.hdcp, tee: p.tee,
      total, pts, target, diff: pts - target,
      holesPlayed, playedPar, totalPar, groupId,
      hScores, pars, hdcps
    };
  });
  } catch(e) { console.error('computePlayerResults error:', e); return []; }
}

function renderStandings(allGroups, myGroupId) {
  // Skip invalid/corrupt groups — must have groupId, nine1, nine2 and players
  const validGroups = Object.values(allGroups || {}).filter(g =>
    g && g.groupId && g.nine1 && g.nine2 && g.players && COURSES[g.nine1] && COURSES[g.nine2]
  );
  const allResults = validGroups.flatMap(g => { try { return computePlayerResults(g); } catch(e) { return []; } });
  allResults.sort((a, b) => b.diff - a.diff || b.pts - a.pts);

  if (allResults.length === 0) {
    return `<div class="empty-state">No scores posted yet for today.<br>Check back once groups start saving scores.</div>`;
  }

  const headerRow = `
    <div class="lb-header-row">
      <span>#</span><span>Player</span>
      <span style="text-align:center">Pts</span>
      <span style="text-align:center">Score</span>
      <span style="text-align:right">vs Target</span>
    </div>`;

  const rows = allResults.map((p, i) => {
    const scoreDiff = p.total > 0 ? p.total - p.playedPar : null;
    const scoreStr  = scoreDiff === null ? '—' : scoreDiff === 0 ? 'E' : scoreDiff > 0 ? `+${scoreDiff}` : `${scoreDiff}`;
    const isMine    = p.groupId === myGroupId;
    const holesStr  = p.holesPlayed < 18 ? ` (${p.holesPlayed}H)` : '';
    const gidSafe   = (p.groupId || '').replace(/"/g, '&quot;');
    return `
      <div class="lb-row ${isMine ? 'lb-mine' : ''}" data-open-group="${gidSafe}"
           style="cursor:pointer">
        <div class="lb-rank ${rankClass(i)}">${i+1}</div>
        <div>
          <div class="lb-name">${p.name}${holesStr} <span style="font-size:11px;color:var(--gray-400)">▶</span></div>
          <div class="lb-sub">${p.groupId} · ${teeDot(p.tee)}${p.tee} · H${p.hdcp} · Target ${p.target}</div>
        </div>
        <div class="lb-num"><div class="val">${p.pts}</div><div class="lbl">pts</div></div>
        <div class="lb-num"><div class="val">${p.total||'—'}</div><div class="lbl">${scoreStr}</div></div>
        <div class="lb-diff">${diffStr(p.diff)}<div class="lbl">vs target</div></div>
      </div>`;
  }).join('');

  return headerRow + rows;
}

// ── Group scorecard modal ──────────────────────────────────────────────────────
function renderGroupScorecard(group) {
  if (!group || !group.nine1 || !group.nine2) return '<p>No data.</p>';
  const { nine1, nine2 } = group;
  const players = normalizeArray(group.players);
  const scores  = group.scores || {};
  if (!players.length) return '<p>No players.</p>';
  if (!COURSES[nine1] || !COURSES[nine2]) return '<p>Unknown course.</p>';

  const nines = [nine1, nine2];
  const overallHdcps = [
    COURSES[nine1].hdcp.map(h => getOverallHdcp(0, h)),
    COURSES[nine2].hdcp.map(h => getOverallHdcp(1, h))
  ];

  const tables = nines.map((nine, nineIdx) => {
    const C = COURSES[nine];
    // Header row — hole numbers
    const holeHeaders = C.par.map((par, hIdx) => {
      const gh = nineIdx * 9 + hIdx;
      const oh = overallHdcps[nineIdx][hIdx];
      return `<th style="min-width:28px;font-size:11px">
        <div style="font-weight:700">${gh+1}</div>
        <div style="color:var(--gray-400);font-size:10px">P${par}</div>
        <div style="color:var(--gray-400);font-size:10px">H${oh}</div>
      </th>`;
    }).join('');

    // One row per player
    const playerRows = players.map((p, gIdx) => {
      const firstName = (p.name||'?').split(' ')[0];
      const playerScores = scores[gIdx] || scores[String(gIdx)] || {};
      let nineTotal = 0, ninePts = 0;

      const scoreCells = C.par.map((par, hIdx) => {
        const gh = nineIdx * 9 + hIdx;
        const s  = parseInt(playerScores[gh] ?? playerScores[String(gh)]) || 0;
        const oh = overallHdcps[nineIdx][hIdx];
        const cls = s ? getScoreClass(s, par) : '';
        const hasStroke = playerGetsStroke(p.hdcp, oh);
        if (s) { nineTotal += s; ninePts += getPoints(s, par) || 0; }
        return `<td style="padding:2px;text-align:center">
          <div class="score-badge ${cls}" style="
            display:inline-block;width:26px;height:26px;line-height:26px;
            border-radius:4px;font-size:13px;font-weight:700;text-align:center;
            border:1px solid var(--gray-200);background:var(--white)">
            ${s||''}
          </div>
          ${hasStroke ? '<div style="width:5px;height:5px;border-radius:50%;background:var(--blue-text);margin:1px auto 0"></div>'
                      : '<div style="height:6px"></div>'}
        </td>`;
      }).join('');

      return `<tr>
        <td style="padding:4px 6px;white-space:nowrap;position:sticky;left:0;background:var(--white);z-index:2">
          <div style="display:flex;align-items:center;gap:4px">
            ${teeDot(p.tee)}
            <span style="font-size:13px;font-weight:700">${firstName}</span>
          </div>
          <div style="font-size:10px;color:var(--gray-400);padding-left:13px">H${p.hdcp}</div>
        </td>
        ${scoreCells}
        <td style="text-align:center;font-weight:700;font-size:13px;background:var(--gray-50);padding:2px 4px">${nineTotal||''}</td>
        <td style="text-align:center;font-weight:700;font-size:13px;color:var(--green);background:var(--green-pale);padding:2px 4px">${ninePts}</td>
      </tr>`;
    }).join('');

    return `
      <div style="display:flex;align-items:center;gap:6px;padding:8px 0 4px">
        <span style="display:inline-block;width:4px;height:18px;border-radius:2px;background:${C.color}"></span>
        <span style="font-size:13px;font-weight:700;color:${C.color}">${C.name}</span>
        <span style="font-size:11px;color:var(--gray-400)">par ${C.par.reduce((a,b)=>a+b,0)}</span>
      </div>
      <div style="overflow-x:auto;-webkit-overflow-scrolling:touch">
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead>
            <tr style="background:var(--gray-50)">
              <th style="text-align:left;padding:4px 6px;min-width:72px;position:sticky;left:0;background:var(--gray-50);z-index:3">Player</th>
              ${holeHeaders}
              <th style="min-width:28px;font-size:11px">Tot</th>
              <th style="min-width:28px;font-size:11px">Pts</th>
            </tr>
          </thead>
          <tbody>${playerRows}</tbody>
        </table>
      </div>`;
  }).join('<div style="height:1px;background:var(--gray-200);margin:8px 0"></div>');

  // Points legend
  const legend = `<div style="display:flex;gap:8px;flex-wrap:wrap;padding:8px 0 2px;font-size:11px;color:var(--gray-400)">
    <span>Eagle=8</span><span>Birdie=4</span><span>Par=2</span><span>Bogey=1</span><span>Double+=0</span>
    <span style="margin-left:4px">● = stroke hole</span>
  </div>`;

  return tables + legend;
}

function showGroupModal(group) {
  // Remove any existing modal
  const existing = document.getElementById('group-modal');
  if (existing) existing.remove();

  // Count total holes played across all players (use max across players)
  let holesPlayed = 0;
  try {
    const { pars } = getRoundArrays(group.nine1, group.nine2);
    const modalPlayers = normalizeArray(group.players);
    if (modalPlayers.length && group.scores) {
      holesPlayed = modalPlayers.reduce((maxH, _, gIdx) => {
        const ps = group.scores[gIdx] || group.scores[String(gIdx)] || {};
        const played = pars.filter((_, hIdx) =>
          parseInt(ps[hIdx] ?? ps[String(hIdx)]) > 0
        ).length;
        return Math.max(maxH, played);
      }, 0);
    }
  } catch(e) {}

  const inner = renderGroupScorecard(group);
  const modal = document.createElement('div');
  modal.id = 'group-modal';
  modal.style.cssText = `
    position:fixed;inset:0;z-index:999;
    background:rgba(0,0,0,0.55);
    display:flex;align-items:flex-end;justify-content:center;
  `;
  modal.innerHTML = `
    <div style="
      background:var(--white);width:100%;max-width:520px;
      border-radius:16px 16px 0 0;
      max-height:88vh;overflow-y:auto;
      padding:0 0 24px;
    ">
      <div style="
        display:flex;justify-content:space-between;align-items:center;
        padding:14px 16px 10px;
        border-bottom:1px solid var(--gray-200);
        position:sticky;top:0;background:var(--white);z-index:4;
      ">
        <div>
          <div style="font-size:16px;font-weight:700">${group.groupId}
            ${holesPlayed < 18 && holesPlayed > 0
              ? `<span style="font-size:11px;font-weight:500;color:var(--green);margin-left:6px;background:var(--green-pale);padding:2px 7px;border-radius:20px">${holesPlayed}H in progress</span>`
              : holesPlayed === 18
              ? `<span style="font-size:11px;font-weight:500;color:var(--gray-400);margin-left:6px;background:var(--gray-100);padding:2px 7px;border-radius:20px">Complete</span>`
              : ''}
          </div>
          <div style="font-size:12px;color:var(--gray-400)">${group.nine1} + ${group.nine2}</div>
        </div>
        <button id="close-modal" style="
          width:32px;height:32px;border-radius:50%;border:1.5px solid var(--gray-200);
          background:var(--gray-50);font-size:18px;cursor:pointer;
          display:flex;align-items:center;justify-content:center;font-weight:300;
        ">✕</button>
      </div>
      <div style="padding:0 12px">${inner}</div>
    </div>`;

  document.body.appendChild(modal);

  // Close on X button or backdrop tap
  document.getElementById('close-modal').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

function renderSkinsTab(allGroups) {
  const entries = Object.values(allGroups || {});
  if (entries.length === 0) return `<div class="empty-state">No groups posted yet.</div>`;

  // Merge all groups playing the same nines combination
  let mergedGroups = [];
  try { mergedGroups = mergeGroupsByNines(allGroups); } catch(e) { console.error('Merge error:', e); return `<div class="empty-state">Error computing skins.</div>`; }
  if (mergedGroups.length === 0) return `<div class="empty-state">No valid groups found.</div>`;

  return mergedGroups.map(merged => {
    if (!merged.players || merged.players.length < 2) return '';
    let skins = [];
    try { skins = computeSkins(merged); } catch(e) { console.error('Skins error:', e); }
    const summary = skinsSummary(skins);
    const summaryStr = Object.keys(summary).length > 0
      ? Object.entries(summary).sort((a,b)=>b[1]-a[1]).map(([n,c])=>`${n}: ${c}`).join(' · ')
      : '';

    // Sort by overall handicap (hardest hole first)
    const sortedSkins = skins.slice().sort((a, b) => a.overallHdcp - b.overallHdcp);

    // List all player names and groups in this nines combo
    const groupNames = [...new Set(merged.players.map(p => p.groupId).filter(Boolean))].join(', ');

    const skinRows = sortedSkins.length === 0
      ? `<div class="no-skins">No skins yet — ties or incomplete scores</div>`
      : sortedSkins.map(s => `
          <div class="skin-row">
            <div>
              <div class="skin-hole">Hole ${s.hole} <span style="font-size:12px;font-weight:400;color:var(--gray-400)">Par ${s.par} · Hcp ${s.overallHdcp} · ${s.nineLabel}</span></div>
              <div class="skin-info">${s.usedStroke ? 'Net score used' : 'Outright win'}${s.groupId ? ` · <span style="color:var(--gray-400)">${s.groupId}</span>` : ''}</div>
            </div>
            <div class="skin-winner">
              <div class="name">${s.winner}</div>
              <div class="score">${s.raw}${s.usedStroke?`<span class="badge-net">net ${s.raw - 1}</span>`:''}</div>
            </div>
          </div>`).join('');

    return `
      <div class="skins-group-header">
        ${merged.nine1} + ${merged.nine2}
        <span style="font-weight:400;text-transform:none;font-size:11px;margin-left:6px;color:var(--gray-400)">${groupNames}</span>
        ${summaryStr ? `<div style="font-size:11px;font-weight:400;text-transform:none;margin-top:2px">${summaryStr}</div>` : ''}
      </div>
      ${skinRows}`;
  }).join('');
}

function renderLeaderboard(allGroups, myGroupId, lastUpdated, lbDate) {
  const isToday  = lbDate === todayStr();
  const timeStr  = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
    : 'not yet';
  const subtitle = isToday
    ? `Today · Updated ${timeStr}`
    : `${lbDate} · historical`;

  // Guard against render errors crashing the whole screen
  let standingsHtml = '';
  let skinsHtml = '';
  try { standingsHtml = renderStandings(allGroups || {}, myGroupId); }
  catch(e) { console.error('Standings render error:', e); standingsHtml = `<div class="empty-state">Error loading standings</div>`; }
  try { skinsHtml = renderSkinsTab(allGroups || {}); }
  catch(e) { console.error('Skins render error:', e); skinsHtml = `<div class="empty-state">Error loading skins</div>`; }

  // Back to Scoring only if this device has an active round and we're viewing today
  const hasActiveRound = myGroupId && myGroupId.length > 0 && isToday;

  return `
  <div class="header">
    <div class="header-row">
      <div><h1>Leaderboard</h1><p>${subtitle}</p></div>
      <button class="btn btn-sm" id="lb-refresh" style="background:rgba(255,255,255,0.15);color:#fff;border-color:rgba(255,255,255,0.3)">Refresh</button>
    </div>
  </div>
  <div class="tab-bar">
    <button class="tab-btn active" id="tab-standings">Standings</button>
    <button class="tab-btn" id="tab-skins">Skins</button>
  </div>
  <div class="content">
    <div style="padding:10px 12px 0">
      <div style="display:flex;align-items:center;gap:10px">
        <label style="font-size:12px;font-weight:600;color:var(--gray-600);white-space:nowrap">Round date</label>
        <input type="date" id="lb-date-pick" value="${lbDate}"
          style="height:36px;border:1.5px solid var(--gray-200);border-radius:var(--radius-md);
                 background:var(--white);color:var(--gray-800);padding:0 10px;font-size:13px;flex:1"/>
        ${!isToday ? `<button class="btn btn-sm" id="lb-goto-today">Today</button>` : ''}
      </div>
    </div>
    <div id="pane-standings">${standingsHtml}</div>
    <div id="pane-skins" style="display:none">${skinsHtml}</div>
    <div style="padding:12px;display:flex;gap:8px">
      <button class="btn" id="lb-home" style="flex:1">← Home</button>
      ${hasActiveRound ? `<button class="btn btn-primary" id="lb-back-scoring" style="flex:1">Back to Scoring</button>` : ''}
    </div>
  </div>`;
}
