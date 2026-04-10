// ── Skins computation ──────────────────────────────────────────────────────────
// Rules:
//  1. Skins are calculated across ALL players playing the same two nines,
//     regardless of which group they are in.
//  2. Find the best raw score on each hole across all players.
//  3. If best raw is birdie or better (under par) — strokes irrelevant.
//     One player must have it alone to win.
//  4. If best raw is par or worse — apply strokes (net = raw - 1 if player
//     gets a stroke on that hole). Best net score wins if held by one player.
//  5. Ties at any level → no skin, no carryover.
//
//  Examples:
//   Eagle vs par          → eagle wins outright
//   Birdie vs par+stroke  → birdie wins outright
//   Par vs bogey+stroke   → net 4 vs net 4 → tie, no skin
//   Par vs bogey no stroke→ net 4 vs net 5 → par wins
//   Par+stroke vs par     → net 3 vs net 4 → stroke player wins

// Merge all groups playing the same nine combination into one virtual group
function mergeGroupsByNines(allGroups) {
  const merged = {}; // key = "nine1|nine2" -> { nine1, nine2, players:[], scores:{} }

  Object.values(allGroups || {}).forEach(group => {
    const { nine1, nine2, players, scores } = group;
    if (!players || !nine1 || !nine2) return;
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

    // Birdie or better — strokes irrelevant
    if (minRaw < par) {
      const winners = holeData.filter(d => d.raw === minRaw);
      if (winners.length === 1) {
        skins.push({
          hole: hIdx + 1, winner: winners[0].name,
          groupId: winners[0].groupId,
          raw: winners[0].raw, par, overallHdcp, nineLabel,
          usedStroke: false
        });
      }
      return;
    }

    // Par or worse — use net scores
    const minNet    = Math.min(...holeData.map(d => d.net));
    const netWinners = holeData.filter(d => d.net === minNet);

    if (netWinners.length === 1) {
      const w = netWinners[0];
      skins.push({
        hole: hIdx + 1, winner: w.name,
        groupId: w.groupId,
        raw: w.raw, par, overallHdcp, nineLabel,
        usedStroke: w.hasStroke
      });
    }
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
