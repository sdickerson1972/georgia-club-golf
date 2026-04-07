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

function renderAdmin(roster) {
  const rows = roster.length === 0
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

  return `
  <div class="header">
    <div class="header-row">
      <div><h1>Admin</h1><p>Player Roster (${roster.length} players)</p></div>
      <button class="btn btn-sm" id="admin-back" style="background:rgba(255,255,255,0.15);color:#fff;border-color:transparent">← Back</button>
    </div>
  </div>
  <div class="content">
    <div class="section">
      <div class="section-label">Add Player</div>
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
      <div class="section-label">Current Roster</div>
      ${rows}
    </div>
    <div style="padding:12px">
      <button class="btn btn-primary btn-block" id="admin-save">Save Roster to Cloud</button>
    </div>
  </div>`;
}

// ── Setup screen ───────────────────────────────────────────────────────────────
function renderSetup(state, roster) {
  const { nine1, nine2, groupId, groupPlayers, date } = state;
  const totalPar = (nine1 ? COURSES[nine1].par.reduce((a,b)=>a+b,0) : 0)
                 + (nine2 ? COURSES[nine2].par.reduce((a,b)=>a+b,0) : 0);

  const addedIds = new Set(groupPlayers.map(p => p.rosterId));
  const availableRoster = roster
    .filter(p => !addedIds.has(p.id))
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  const rosterOpts = availableRoster.length === 0
    ? '<option disabled>All players added</option>'
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
            ${['Group 1','Group 2','Group 3','Group 4','Group 5','Group 6','Group 7','Group 8']
              .map(g=>`<option ${groupId===g?'selected':''}>${g}</option>`).join('')}
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
             <button class="btn btn-primary btn-sm" id="add-from-roster" ${groupPlayers.length>=5?'disabled':''}>Add</button>
           </div>`}
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
function computePlayerResults(group) {
  const { nine1, nine2, players, scores, groupId } = group;
  if (!players || !nine1 || !nine2) return [];
  const { pars, hdcps } = getRoundArrays(nine1, nine2);
  const totalPar = pars.reduce((a,b)=>a+b,0);

  return players.map((p, gIdx) => {
    let total = 0, pts = 0, playedPar = 0;
    const hScores = pars.map((par, hIdx) => {
      const s = parseInt((scores[gIdx]||[])[hIdx]) || 0;
      total += s;
      if (s) {
        pts += getPoints(s, par) || 0;
        playedPar += par;  // only add par for holes that have a score
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
}

function renderStandings(allGroups, myGroupId) {
  const allResults = Object.values(allGroups).flatMap(g => computePlayerResults(g));
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
    return `
      <div class="lb-row ${isMine ? 'lb-mine' : ''}">
        <div class="lb-rank ${rankClass(i)}">${i+1}</div>
        <div>
          <div class="lb-name">${p.name}${holesStr}</div>
          <div class="lb-sub">${p.groupId} · ${teeDot(p.tee)}${p.tee} · H${p.hdcp} · Target ${p.target}</div>
        </div>
        <div class="lb-num"><div class="val">${p.pts}</div><div class="lbl">pts</div></div>
        <div class="lb-num"><div class="val">${p.total||'—'}</div><div class="lbl">${scoreStr}</div></div>
        <div class="lb-diff">${diffStr(p.diff)}<div class="lbl">vs target</div></div>
      </div>`;
  }).join('');

  return headerRow + rows;
}

function renderSkinsTab(allGroups) {
  const entries = Object.values(allGroups);
  if (entries.length === 0) return `<div class="empty-state">No groups posted yet.</div>`;

  return entries.map(group => {
    if (!group.players || group.players.length < 2) return '';
    const skins = computeSkins(group);
    const summary = skinsSummary(skins);
    const summaryStr = Object.keys(summary).length > 0
      ? Object.entries(summary).sort((a,b)=>b[1]-a[1]).map(([n,c])=>`${n}: ${c}`).join(' · ')
      : '';

    // Sort skins by hole handicap (1 = hardest = first)
    const sortedSkins = skins.slice().sort((a, b) => a.hole - b.hole);

    const skinRows = sortedSkins.length === 0
      ? `<div class="no-skins">No skins yet — tied holes or incomplete scores</div>`
      : sortedSkins.map(s => `
          <div class="skin-row">
            <div>
              <div class="skin-hole">Hole ${s.hole} <span style="font-size:12px;font-weight:400;color:var(--gray-400)">Par ${s.par} · Hcp ${s.overallHdcp} · ${s.nineLabel}</span></div>
              <div class="skin-info">${s.usedStroke ? 'Net score used' : 'Outright win'}</div>
            </div>
            <div class="skin-winner">
              <div class="name">${s.winner}</div>
              <div class="score">${s.raw}${s.usedStroke?`<span class="badge-net">net ${s.raw - 1}</span>`:''}</div>
            </div>
          </div>`).join('');

    return `
      <div class="skins-group-header">
        ${group.groupId} — ${group.nine1} + ${group.nine2}
        ${summaryStr ? `<span style="font-weight:400;text-transform:none;font-size:11px;margin-left:8px">${summaryStr}</span>` : ''}
      </div>
      ${skinRows}`;
  }).join('');
}

function renderLeaderboard(allGroups, myGroupId, lastUpdated) {
  const timeStr = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
    : 'not yet';

  return `
  <div class="header">
    <div class="header-row">
      <div><h1>Leaderboard</h1><p>Updated ${timeStr} · tap Refresh for latest</p></div>
      <button class="btn btn-sm" id="lb-refresh" style="background:rgba(255,255,255,0.15);color:#fff;border-color:rgba(255,255,255,0.3)">Refresh</button>
    </div>
  </div>
  <div class="tab-bar">
    <button class="tab-btn active" id="tab-standings">Standings</button>
    <button class="tab-btn" id="tab-skins">Skins</button>
  </div>
  <div class="content">
    <div id="pane-standings">${renderStandings(allGroups, myGroupId)}</div>
    <div id="pane-skins" style="display:none">${renderSkinsTab(allGroups)}</div>
    <div style="padding:12px;display:flex;gap:8px">
      <button class="btn" id="lb-home" style="flex:1">← Home</button>
      ${myGroupId ? `<button class="btn btn-primary" id="lb-back-scoring" style="flex:1">Back to Scoring</button>` : ''}
    </div>
  </div>`;
}
