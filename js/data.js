// ── Course Data ────────────────────────────────────────────────────────────────
const COURSES = {
  Red: {
    name: 'Red Nine', color: '#c0392b',
    par:  [5,4,3,4,4,5,4,3,4],
    hdcp: [5,7,8,6,2,3,1,9,4],
    yards: {
      Black:  [510,350,227,378,463,604,453,184,429],
      Silver: [497,323,178,355,422,554,398,160,410],
      White:  [480,298,154,312,398,530,375,136,377]
    }
  },
  Black: {
    name: 'Black Nine', color: '#2c3e50',
    par:  [5,3,4,4,4,4,5,3,4],
    hdcp: [6,9,1,7,3,2,5,8,4],
    yards: {
      Black:  [562,136,482,385,440,455,628,183,414],
      Silver: [507,122,437,365,391,410,578,168,394],
      White:  [485,109,414,348,365,384,554,146,369]
    }
  },
  Silver: {
    name: 'Silver Nine', color: '#607d8b',
    par:  [5,4,3,4,4,3,5,3,4],
    hdcp: [1,2,6,4,7,9,3,8,5],
    yards: {
      Black:  [604,429,249,444,387,167,557,189,402],
      Silver: [554,410,194,435,368,150,536,168,379],
      White:  [530,382,166,404,345,129,511,143,354]
    }
  }
};

const TEE_COLORS = { Black: '#212121', Silver: '#9e9e9e', White: '#bdbdbd' };
const ADMIN_PIN  = 'Elite';

// ── Scoring helpers ────────────────────────────────────────────────────────────
function getPoints(score, par) {
  if (!score || score <= 0) return null;
  const d = score - par;
  if (d <= -2) return 8;
  if (d === -1) return 4;
  if (d ===  0) return 2;
  if (d ===  1) return 1;
  return 0;
}

function getScoreClass(score, par) {
  if (!score) return '';
  const d = score - par;
  if (d <= -2) return 's-eagle';
  if (d === -1) return 's-birdie';
  if (d ===  0) return '';
  if (d ===  1) return 's-bogey';
  return 's-double';
}

function getScoreLabel(score, par) {
  if (!score) return '';
  const d = score - par;
  if (d <= -2) return 'Eagle' + (d < -2 ? '+' : '');
  if (d === -1) return 'Birdie';
  if (d ===  0) return 'Par';
  if (d ===  1) return 'Bogey';
  if (d ===  2) return 'Double';
  return '+' + d;
}

// ── Handicap / stroke helpers ──────────────────────────────────────────────────
// Nine 1 holes map to odd overall handicaps  (holeHdcp 1→1, 2→3, 3→5 …)
// Nine 2 holes map to even overall handicaps (holeHdcp 1→2, 2→4, 3→6 …)
function getOverallHdcp(nineIndex, holeHdcp) {
  return nineIndex === 0 ? holeHdcp * 2 - 1 : holeHdcp * 2;
}

function playerGetsStroke(playerHdcp, overallHdcp) {
  return playerHdcp >= overallHdcp;
}

// Returns full 18-hole arrays for a round given two nines
function getRoundArrays(nine1, nine2) {
  const pars  = [...COURSES[nine1].par,  ...COURSES[nine2].par];
  const hdcps = [
    ...COURSES[nine1].hdcp.map(h => getOverallHdcp(0, h)),
    ...COURSES[nine2].hdcp.map(h => getOverallHdcp(1, h))
  ];
  return { pars, hdcps };
}

// Today's date string YYYY-MM-DD
function todayStr() {
  return new Date().toISOString().split('T')[0];
}
