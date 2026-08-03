/* ── Reset & Base ─────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --green:       #1a472a;
  --green-light: #2d6a4f;
  --green-pale:  #e8f5e9;
  --gold:        #c9a84c;
  --gold-pale:   #fdf6e3;
  --red-pale:    #fdecea;
  --red-text:    #b71c1c;
  --blue-pale:   #e3f2fd;
  --blue-text:   #1565c0;
  --purple-pale: #f3e5f5;
  --purple-text: #6a1b9a;
  --gray-50:     #f9f9f9;
  --gray-100:    #f0f0f0;
  --gray-200:    #e0e0e0;
  --gray-400:    #9e9e9e;
  --gray-600:    #616161;
  --gray-800:    #212121;
  --white:       #ffffff;
  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   14px;
  --shadow-sm:   0 1px 3px rgba(0,0,0,0.08);
  --shadow-md:   0 2px 8px rgba(0,0,0,0.12);
}

html, body {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 16px;
  color: var(--gray-800);
  background: var(--gray-50);
  -webkit-font-smoothing: antialiased;
}

#app { min-height: 100vh; }

/* ── Typography ───────────────────────────────────────────── */
h1 { font-size: 20px; font-weight: 700; color: var(--gray-800); }
h2 { font-size: 16px; font-weight: 600; color: var(--gray-800); }
h3 { font-size: 14px; font-weight: 600; color: var(--gray-600); text-transform: uppercase; letter-spacing: 0.05em; }
p  { font-size: 14px; color: var(--gray-600); line-height: 1.5; }

/* ── Layout ───────────────────────────────────────────────── */
.screen { display: none; flex-direction: column; min-height: 100vh; }
.screen.active { display: flex; }

.header {
  background: var(--green);
  color: var(--white);
  padding: 14px 16px 12px;
  position: sticky; top: 0; z-index: 100;
  box-shadow: var(--shadow-md);
}
.header h1 { color: var(--white); font-size: 18px; }
.header p  { color: rgba(255,255,255,0.75); font-size: 12px; margin-top: 1px; }
.header-row { display: flex; justify-content: space-between; align-items: center; }

.content { flex: 1; overflow-y: auto; padding-bottom: 24px; }

.section {
  background: var(--white);
  margin: 12px 12px 0;
  border-radius: var(--radius-lg);
  padding: 14px 16px;
  box-shadow: var(--shadow-sm);
}
.section + .section { margin-top: 10px; }
.section-label {
  font-size: 11px; font-weight: 700; color: var(--gray-400);
  text-transform: uppercase; letter-spacing: 0.07em;
  margin-bottom: 10px;
}

/* ── Buttons ──────────────────────────────────────────────── */
.btn {
  display: inline-flex; align-items: center; justify-content: center;
  height: 42px; padding: 0 18px;
  border: 1.5px solid var(--gray-200); border-radius: var(--radius-md);
  background: var(--white); color: var(--gray-800);
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  -webkit-tap-highlight-color: transparent;
}
.btn:active { transform: scale(0.97); }
.btn-primary { background: var(--green); border-color: var(--green); color: var(--white); }
.btn-primary:active { background: var(--green-light); }
.btn-gold { background: var(--gold); border-color: var(--gold); color: var(--white); }
.btn-danger { background: var(--red-pale); border-color: #ef9a9a; color: var(--red-text); }
.btn-sm { height: 34px; padding: 0 12px; font-size: 13px; }
.btn-xs { height: 26px; padding: 0 8px; font-size: 12px; }
.btn-block { width: 100%; }
.btn-row { display: flex; gap: 8px; margin-top: 12px; }
.btn-row .btn { flex: 1; }
.btn:disabled { opacity: 0.45; cursor: not-allowed; }

/* ── Inputs ───────────────────────────────────────────────── */
input, select {
  height: 42px; width: 100%;
  border: 1.5px solid var(--gray-200); border-radius: var(--radius-md);
  background: var(--white); color: var(--gray-800);
  font-size: 14px; padding: 0 12px;
  -webkit-appearance: none;
}
input:focus, select:focus { outline: none; border-color: var(--green); }
input[type=number] { text-align: center; }
label.field-label { display: block; font-size: 12px; font-weight: 600; color: var(--gray-600); margin-bottom: 5px; }

.field { margin-bottom: 12px; }
.field:last-child { margin-bottom: 0; }

.input-row { display: flex; gap: 8px; align-items: flex-end; }
.input-row .field { flex: 1; margin-bottom: 0; }

/* ── Nine selector ────────────────────────────────────────── */
.nine-selector { display: flex; gap: 8px; }
.nine-btn {
  flex: 1; height: 44px; border-radius: var(--radius-md);
  border: 2px solid var(--gray-200); background: var(--white);
  font-size: 14px; font-weight: 700; cursor: pointer;
  color: var(--gray-600); transition: all 0.15s;
}
.nine-btn.active { border-color: var(--green); background: var(--green-pale); color: var(--green); }
.nine-btn[data-nine="Red"].active   { border-color: #c0392b; background: #fdecea; color: #c0392b; }
.nine-btn[data-nine="Black"].active { border-color: #2c3e50; background: #eceff1; color: #2c3e50; }
.nine-btn[data-nine="Silver"].active{ border-color: #607d8b; background: #f1f3f4; color: #546e7a; }

/* ── Player rows ──────────────────────────────────────────── */
.player-setup-row {
  display: grid; grid-template-columns: 1fr 52px 96px 30px;
  gap: 6px; align-items: center; margin-bottom: 8px;
}
.player-setup-row input, .player-setup-row select { height: 38px; font-size: 13px; }
.col-headers {
  display: grid; grid-template-columns: 1fr 52px 96px 30px;
  gap: 6px; margin-bottom: 4px;
}
.col-headers span { font-size: 10px; font-weight: 700; color: var(--gray-400); text-transform: uppercase; letter-spacing: 0.05em; padding-left: 2px; }

/* ── Tee dot ──────────────────────────────────────────────── */
.tee-dot {
  display: inline-block; width: 9px; height: 9px;
  border-radius: 50%; margin-right: 4px; vertical-align: middle;
  border: 1px solid rgba(0,0,0,0.15);
}

/* ── Scorecard table ──────────────────────────────────────── */
.sc-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 0; }
.sc-nine-header {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px 8px;
  background: var(--white);
  font-size: 14px; font-weight: 700;
}
.sc-nine-stripe { width: 4px; height: 20px; border-radius: 2px; }

table.scorecard {
  width: 100%; border-collapse: collapse;
  font-size: 13px; background: var(--white);
}
table.scorecard th {
  background: var(--gray-50); font-size: 12px; font-weight: 700;
  color: var(--gray-400); text-transform: uppercase; letter-spacing: 0.03em;
  padding: 6px 4px; text-align: center;
  border-bottom: 1.5px solid var(--gray-200);
}
table.scorecard td {
  padding: 4px 3px; text-align: center;
  border-bottom: 1px solid var(--gray-100); vertical-align: middle;
}
table.scorecard tr.yards-row td { background: var(--gray-50); padding: 2px 3px; }
table.scorecard tr.totals-row td {
  background: var(--gray-100); font-weight: 700;
  padding: 6px 3px; border-top: 1.5px solid var(--gray-200);
}
table.scorecard tr.pts-row td {
  background: var(--green-pale); font-weight: 700; color: var(--green);
  padding: 5px 3px;
}

.score-cell-wrap { position: relative; }
.score-input {
  width: 52px; height: 48px; border-radius: var(--radius-sm);
  border: 1.5px solid var(--gray-200); background: var(--white);
  text-align: center; font-size: 22px; font-weight: 700;
  color: var(--gray-800); padding: 0;
  -webkit-appearance: none; appearance: none;
}
.score-input:focus { outline: none; border-color: var(--green); }
/* Eagle=Green, Birdie=Red, Par=Black(default), Bogey/Double+=Royal Blue */
.score-input.s-eagle  { background: #e8f5e9; color: #1b5e20; border-color: #66bb6a; }
.score-input.s-birdie { background: #ffebee; color: #b71c1c; border-color: #ef9a9a; }
.score-input.s-bogey  { background: #e8eaf6; color: #1a237e; border-color: #7986cb; }
.score-input.s-double { background: #e8eaf6; color: #1a237e; border-color: #5c6bc0; }

.stroke-dot {
  display: block; width: 5px; height: 5px; border-radius: 50%;
  background: var(--blue-text); margin: 1px auto 0;
}

/* ── Leaderboard ──────────────────────────────────────────── */
.tab-bar {
  display: flex; background: var(--white);
  border-bottom: 1.5px solid var(--gray-200);
  position: sticky; top: 60px; z-index: 90;
}
.tab-btn {
  flex: 1; height: 44px; border: none; background: transparent;
  font-size: 13px; font-weight: 600; color: var(--gray-400);
  cursor: pointer; border-bottom: 3px solid transparent;
  transition: color 0.15s;
}
.tab-btn.active { color: var(--green); border-bottom-color: var(--green); }

.lb-header-row {
  display: grid; grid-template-columns: 30px 1fr 52px 52px 64px;
  gap: 4px; padding: 6px 14px;
  background: var(--gray-100);
  font-size: 10px; font-weight: 700; color: var(--gray-400);
  text-transform: uppercase; letter-spacing: 0.05em;
}
.lb-row {
  display: grid; grid-template-columns: 30px 1fr 52px 52px 64px;
  gap: 4px; padding: 11px 14px; align-items: center;
  border-bottom: 1px solid var(--gray-100);
  background: var(--white);
}
.lb-row:nth-child(even) { background: var(--gray-50); }
.lb-row.lb-mine { background: var(--green-pale) !important; }

.lb-rank { font-size: 15px; font-weight: 700; color: var(--gray-400); text-align: center; }
.lb-rank.gold   { color: #c9a84c; }
.lb-rank.silver { color: #9e9e9e; }
.lb-rank.bronze { color: #a1724e; }

.lb-name { font-size: 14px; font-weight: 600; }
.lb-sub  { font-size: 11px; color: var(--gray-400); margin-top: 1px; }
.lb-num  { text-align: center; }
.lb-num .val { font-size: 15px; font-weight: 700; }
.lb-num .lbl { font-size: 10px; color: var(--gray-400); }
.lb-diff { text-align: right; }
.lb-diff .val { font-size: 16px; font-weight: 800; }
.lb-diff .lbl { font-size: 10px; color: var(--gray-400); }
.pos  { color: #2e7d32; }
.neg  { color: #c62828; }
.even { color: var(--gray-600); }

/* Skins */
.skins-group-header {
  padding: 8px 14px; background: var(--gray-100);
  font-size: 12px; font-weight: 700; color: var(--gray-600);
  text-transform: uppercase; letter-spacing: 0.04em;
  border-bottom: 1px solid var(--gray-200);
}
.skin-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 14px; border-bottom: 1px solid var(--gray-100);
  background: var(--white);
}
.skin-hole { font-size: 13px; font-weight: 700; }
.skin-info { font-size: 12px; color: var(--gray-400); margin-top: 1px; }
.skin-winner { text-align: right; }
.skin-winner .name { font-size: 14px; font-weight: 700; color: var(--green); }
.skin-winner .score { font-size: 12px; color: var(--gray-400); }
.badge-net { display:inline-block;background:var(--blue-pale);color:var(--blue-text);font-size:10px;font-weight:700;padding:1px 6px;border-radius:20px;margin-left:4px;vertical-align:middle; }
.no-skins { padding: 20px 16px; text-align: center; font-size: 14px; color: var(--gray-400); }

/* ── Home screen cards ────────────────────────────────────── */
.home-card {
  background: var(--white); border-radius: var(--radius-lg);
  padding: 18px 20px; box-shadow: var(--shadow-sm);
  margin: 10px 12px 0; cursor: pointer;
  display: flex; align-items: center; gap: 16px;
  border: 2px solid transparent; transition: border-color 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.home-card:active { border-color: var(--green); }
.home-card-icon { font-size: 32px; width: 44px; text-align: center; }
.home-card-text h2 { font-size: 16px; }
.home-card-text p  { font-size: 13px; margin-top: 2px; }

/* ── Misc ─────────────────────────────────────────────────── */
.empty-state { padding: 40px 20px; text-align: center; color: var(--gray-400); font-size: 14px; }
.toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(20px);
  background: var(--gray-800); color: var(--white); padding: 10px 20px;
  border-radius: 24px; font-size: 13px; font-weight: 500;
  opacity: 0; transition: opacity 0.25s, transform 0.25s; z-index: 999; white-space: nowrap;
}
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
.spinner { text-align: center; padding: 40px; color: var(--gray-400); font-size: 14px; }
.info-box {
  background: var(--green-pale); border-radius: var(--radius-md);
  padding: 12px 14px; margin-top: 10px;
  font-size: 13px; color: var(--green); line-height: 1.5;
}
.divider { height: 1px; background: var(--gray-200); margin: 10px 0; }

/* ── Saving indicator ─────────────────────────────────────── */
.save-indicator {
  font-size: 11px; color: rgba(255,255,255,0.7);
  margin-top: 2px; min-height: 14px;
}

/* ── Responsive tweaks ────────────────────────────────────── */
@media (max-width: 360px) {
  .score-input { width: 48px; height: 44px; font-size: 20px; }
  table.scorecard { font-size: 12px; }
}

/* ── Horizontal scorecard (players left, holes across top) ────────────────── */
.sc-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* Freeze the player name column while scrolling horizontally */
table.scorecard th:first-child,
table.scorecard td:first-child {
  position: sticky;
  left: 0;
  z-index: 2;
  background: var(--white);
  min-width: 80px;
  max-width: 100px;
}
table.scorecard th:first-child {
  background: var(--gray-50);
  z-index: 3;
}
table.scorecard tr.yards-row td:first-child {
  background: var(--gray-50);
}

/* Hole header columns — wider to show ~4 holes at a time on mobile */
table.scorecard th:not(:first-child),
table.scorecard td:not(:first-child) {
  min-width: 58px;
  max-width: 64px;
}

/* Score inputs fill their cell */
.score-input {
  width: 52px;
  height: 48px;
  font-size: 22px;
}

/* ── Larger score inputs for paged 4-hole view ────────────────────────────── */
.score-input {
  width: 52px !important;
  height: 48px !important;
  font-size: 22px !important;
  border-radius: 8px !important;
}
.stroke-dot {
  width: 7px;
  height: 7px;
  margin: 2px auto 0;
}
table.scorecard th:not(:first-child),
table.scorecard td:not(:first-child) {
  min-width: 58px;
  max-width: 68px;
}

/* ── Birdie circle / Eagle double-circle ──────────────────────────────────── */
.score-input.s-birdie {
  border-radius: 50% !important;
  border-width: 2px !important;
}
.score-input.s-eagle {
  border-radius: 50% !important;
  border-width: 2px !important;
  box-shadow: 0 0 0 3px #66bb6a, 0 0 0 5px #e8f5e9 !important;
}

/* Same for score badges in the modal scorecard */
.score-badge.s-birdie {
  border-radius: 50% !important;
  border-width: 2px !important;
  border-color: #ef9a9a !important;
  color: #b71c1c !important;
  background: #ffebee !important;
}
.score-badge.s-eagle {
  border-radius: 50% !important;
  border-width: 2px !important;
  box-shadow: 0 0 0 3px #66bb6a, 0 0 0 5px #e8f5e9 !important;
  color: #1b5e20 !important;
  background: #e8f5e9 !important;
}
.score-badge.s-bogey {
  color: #1a237e !important;
  background: #e8eaf6 !important;
  border-color: #7986cb !important;
}
.score-badge.s-double {
  color: #1a237e !important;
  background: #e8eaf6 !important;
  border-color: #5c6bc0 !important;
}
