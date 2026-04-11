// ── Skins computation ──────────────────────────────────────────────────────────
// Rules:
//  1. Skins are calculated across ALL players playing the same two nines,
//     regardless of which group they are in.
//  2. Find the best raw score on each hole. One player with the best raw wins
//     outright — strokes play no part.
//  3. If two or more players TIE on raw score, the stroke is used as tiebreaker
//     at ANY score level (eagle, birdie, par, bogey, etc.):
//     net = raw - 1 if player gets stroke, else raw.
//     The player with the best net among the tied players wins.
//  4. A stroke NEVER elevates a worse raw score — it only breaks ties.
//  5. Ties after stroke tiebreaker → no skin, no carryover.
//
//  Examples:
//   Eagle vs par             → eagle wins outright (best raw)
//   Two eagles, one +stroke  → net eagle-1 vs net eagle → stroke player wins
//   Two birdies, one +stroke → stroke player wins tie
//   Birdie vs par+stroke     → birdie wins outright (best raw)
//   Par vs bogey+stroke      → net 4 vs net 4 → tie, no skin
//   Par vs bogey no stroke   → par wins outright (best raw)
//   Par+stroke vs par        → net 3 vs net 4 → stroke player wins

// Merge all groups playing the same nine combination into one virtual group
function mergeGroupsByNines(allGroups) {
  const merged = {}; // key = "nine1|nine2" -> { nine1, nine2, players:[], scores:{} }

  Object.values(allGroups || {}).forEach(group => {
    const { nine1, nine2 } = group;
    if (!nine1 || !nine2 || !COURSES[nine1] || !COURSES[nine2]) return;
    const players = normalizeArray(group.players);
    const scores  = group.scores || {};
    // Skip claimed-only placeholders with no real players
    if (!players || players.length === 0) return;
    if (!COURSES[nine1] || !COURSES[nine2]) return;

    const key = `${nine1}|${nine2}`;
    if (!merged[key]) {
      merged[key] = { nine1, nine2, players: [], scores: {} };
    }
    const m = merged[key];
    players.forEach((p, gIdx) => {
      const newIdx = m.players.length;
      m.players.push({ ...p, groupId: group.groupId });
      // Copy scores — resolve Firebase object or array format
      const pScores = scores[gIdx] || scores[String(gIdx)] || {};
      m.scores[newIdx] = pScores;
    });
  });

  return Object.values(merged);
}

function computeSkins(mergedGroup) {
  const { nine1, nine2, players, scores } = mergedGroup;
  if (!players || players.length < 2) return [];

  const { pars, hdcps } = getRoundArrays(nine1, nine2);
  const skins = [];

  pars.forEach((par, hIdx) => {
    const holeData = players.map((p, gIdx) => {
      const playerScores = scores[gIdx] || scores[String(gIdx)] || {};
      const raw = parseInt(playerScores[hIdx] ?? playerScores[String(hIdx)]) || 0;
      if (!raw) return null;
      const hasStroke = playerGetsStroke(p.hdcp, hdcps[hIdx]);
      const net = raw - (hasStroke ? 1 : 0);
      return { raw, net, hasStroke, name: p.name, groupId: p.groupId, gIdx };
    });

    // Skip hole if any player hasn't posted a score yet
    if (holeData.some(d => d === null)) return;

    const overallHdcp = hdcps[hIdx];
    const nineLabel   = hIdx < 9 ? nine1 : nine2;
    const minRaw      = Math.min(...holeData.map(d => d.raw));

    // Step 1 — find all players tied at the best raw score
    const rawWinners = holeData.filter(d => d.raw === minRaw);

    if (rawWinners.length === 1) {
      // Outright best raw score — wins regardless of strokes
      const w = rawWinners[0];
      skins.push({
        hole: hIdx + 1, winner: w.name, groupId: w.groupId,
        raw: w.raw, par, overallHdcp, nineLabel, usedStroke: false
      });
      return;
    }

    // Step 2 — tie on raw score: use net (raw - stroke) as tiebreaker
    // This applies for ALL score levels — eagle, birdie, par, bogey, etc.
    // A stroke can break a tie at any level but never elevates a worse raw score
    const minNet     = Math.min(...rawWinners.map(d => d.net));
    const netWinners = rawWinners.filter(d => d.net === minNet);

    if (netWinners.length === 1) {
      const w = netWinners[0];
      skins.push({
        hole: hIdx + 1, winner: w.name, groupId: w.groupId,
        raw: w.raw, par, overallHdcp, nineLabel, usedStroke: w.hasStroke
      });
    }
    // Still tied after stroke tiebreaker → no skin
  });

  return skins;
}

function skinsSummary(skins) {
  const counts = {};
  skins.forEach(s => {
    counts[s.winner] = (counts[s.winner] || 0) + 1;
  });
  return counts;
}
