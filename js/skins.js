// ── Skins computation ──────────────────────────────────────────────────────────
// Rules:
//  • Lowest net score on a hole wins the skin (net = raw - stroke if player gets one)
//  • Ties: no skin awarded, no carryover
//  • Strokes use interleaved odd/even handicap system across both nines
//  • Skins are within each group separately

function computeSkins(group) {
  const { nine1, nine2, players, scores } = group;
  if (!players || players.length < 2) return [];

  const { pars, hdcps } = getRoundArrays(nine1, nine2);
  const skins = [];

  pars.forEach((par, hIdx) => {
    // Collect each player's raw score and net score for this hole
    const holeData = players.map((p, gIdx) => {
      const raw = parseInt((scores[gIdx] || [])[hIdx]) || 0;
      if (!raw) return null;
      const stroke = playerGetsStroke(p.hdcp, hdcps[hIdx]) ? 1 : 0;
      return { raw, net: raw - stroke, stroke, name: p.name, gIdx };
    });

    // Skip hole if any player hasn't posted a score yet
    if (holeData.some(d => d === null)) return;

    const nets   = holeData.map(d => d.net);
    const minNet = Math.min(...nets);
    const winners = holeData.filter(d => d.net === minNet);

    if (winners.length === 1) {
      const w = winners[0];
      skins.push({
        hole:   hIdx + 1,
        winner: w.name,
        raw:    w.raw,
        net:    w.net,
        par,
        usedStroke: w.stroke === 1,
        nineLabel: hIdx < 9 ? nine1 : nine2
      });
    }
    // ties → no skin, no carryover
  });

  return skins;
}

// Summarise skins count per player name
function skinsSummary(skins) {
  const counts = {};
  skins.forEach(s => {
    counts[s.winner] = (counts[s.winner] || 0) + 1;
  });
  return counts;
}
