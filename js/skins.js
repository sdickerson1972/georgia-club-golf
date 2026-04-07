// ── Skins computation ──────────────────────────────────────────────────────────
// Rules:
//  1. Lowest RAW score on the hole wins the skin outright.
//  2. If two or more players tie on raw score, the stroke is used as a
//     tiebreaker: if exactly ONE of the tied players gets a stroke on that
//     hole (per the interleaved handicap system), that player wins the skin.
//  3. If the stroke tiebreaker still leaves a tie (both or neither get a
//     stroke), no skin is awarded.
//  4. No carryovers — tied holes simply produce no skin.
//  5. Skins are within each group separately.

function computeSkins(group) {
  const { nine1, nine2, players, scores } = group;
  if (!players || players.length < 2) return [];

  const { pars, hdcps } = getRoundArrays(nine1, nine2);
  const skins = [];

  pars.forEach((par, hIdx) => {
    // Build hole data for each player
    const holeData = players.map((p, gIdx) => {
      const raw = parseInt((scores[gIdx] || [])[hIdx]) || 0;
      if (!raw) return null;
      const hasStroke = playerGetsStroke(p.hdcp, hdcps[hIdx]);
      return { raw, hasStroke, name: p.name, gIdx };
    });

    // Skip hole if any player hasn't posted a score yet
    if (holeData.some(d => d === null)) return;

    // Step 1 — find lowest raw score
    const minRaw = Math.min(...holeData.map(d => d.raw));
    const tied   = holeData.filter(d => d.raw === minRaw);

    const overallHdcp = hdcps[hIdx];
    const nineLabel   = hIdx < 9 ? nine1 : nine2;

    if (tied.length === 1) {
      // Outright winner — no stroke needed
      const w = tied[0];
      skins.push({
        hole: hIdx + 1, winner: w.name,
        raw: w.raw, par, overallHdcp, nineLabel,
        usedStroke: false
      });
      return;
    }

    // Step 2 — tied on raw: use stroke as tiebreaker
    const tiersWithStroke = tied.filter(d => d.hasStroke);
    if (tiersWithStroke.length === 1) {
      // Exactly one tied player gets a stroke -> they win
      const w = tiersWithStroke[0];
      skins.push({
        hole: hIdx + 1, winner: w.name,
        raw: w.raw, par, overallHdcp, nineLabel,
        usedStroke: true
      });
    }
    // Otherwise still tied -> no skin
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
