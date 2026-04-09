// ── Skins computation ──────────────────────────────────────────────────────────
// Rules:
//  1. Find the best raw score on the hole.
//  2. If that best score is better than par (birdie or better), it wins
//     outright — strokes are irrelevant. One player must have it alone.
//  3. If the best score is par or worse, apply strokes first:
//     net score = raw - (1 if player gets stroke, else 0)
//     Then find the best NET score. If one player has it alone, they win.
//  4. Ties at any level → no skin, no carryover.
//  5. Skins are within each group separately.
//
//  Examples:
//   Eagle vs par        → eagle wins outright (birdie or better rule)
//   Birdie vs par+stroke → birdie wins outright
//   Par vs bogey+stroke  → par=4, bogey net=4 → tie, no skin
//   Par vs bogey no stroke → par wins outright (net bogey=5)
//   Par+stroke vs par no stroke → net 3 vs net 4 → stroke player wins
//   Two pars, one gets stroke → net 3 vs net 4 → stroke player wins

function computeSkins(group) {
  const { nine1, nine2, players, scores } = group;
  if (!players || players.length < 2) return [];

  const { pars, hdcps } = getRoundArrays(nine1, nine2);
  const skins = [];

  pars.forEach((par, hIdx) => {
    // Build hole data for each player
    // scores may be array (local) or object with string keys (from Firebase)
    const holeData = players.map((p, gIdx) => {
      const playerScores = scores[gIdx] || scores[String(gIdx)] || {};
      const raw = parseInt(playerScores[hIdx] ?? playerScores[String(hIdx)]) || 0;
      if (!raw) return null;
      const hasStroke = playerGetsStroke(p.hdcp, hdcps[hIdx]);
      const net = raw - (hasStroke ? 1 : 0);
      return { raw, net, hasStroke, name: p.name, gIdx };
    });

    // Skip hole if any player hasn't posted a score yet
    if (holeData.some(d => d === null)) return;

    const overallHdcp = hdcps[hIdx];
    const nineLabel   = hIdx < 9 ? nine1 : nine2;

    // Step 1 — find the best raw score
    const minRaw = Math.min(...holeData.map(d => d.raw));

    // Step 2 — if best raw is birdie or better (under par), strokes don't apply
    if (minRaw < par) {
      const winners = holeData.filter(d => d.raw === minRaw);
      if (winners.length === 1) {
        skins.push({
          hole: hIdx + 1, winner: winners[0].name,
          raw: winners[0].raw, par, overallHdcp, nineLabel,
          usedStroke: false
        });
      }
      // Tied birdies/eagles → no skin
      return;
    }

    // Step 3 — par or worse: use net scores (raw - stroke)
    const minNet = Math.min(...holeData.map(d => d.net));
    const netWinners = holeData.filter(d => d.net === minNet);

    if (netWinners.length === 1) {
      const w = netWinners[0];
      skins.push({
        hole: hIdx + 1, winner: w.name,
        raw: w.raw, par, overallHdcp, nineLabel,
        usedStroke: w.hasStroke
      });
    }
    // Tied net scores → no skin
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
