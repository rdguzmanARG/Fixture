import { useMemo, useEffect, useRef } from 'react';

// ── Layout constants ──────────────────────────────────────────────────────────
const SLOT_H = 52;   // match card height (px)
const SLOT_W = 178;  // match card width (px)
const COL_W  = 214;  // column width (px); gap = COL_W - SLOT_W = 36px
const UNIT   = 82;   // vertical space per bracket leaf (px)

const TOTAL_H = 16 * UNIT;  // 1312 px
const TOTAL_W = 5 * COL_W;  // 1070 px

// ── Bracket structure ─────────────────────────────────────────────────────────

// Vertical ordering of R32 matches (top → bottom) so that every adjacent pair
// feeds the same R16 match, every adjacent quartet feeds the same QF, etc.
const R32_ORDER = [74, 77, 73, 75, 83, 84, 81, 82, 76, 78, 79, 80, 86, 88, 85, 87];

// matchNumber → [feeder1, feeder2]  (excludes 3rd-place match 103)
const TREE = {
  89:  [74, 77],  90:  [73, 75],
  93:  [83, 84],  94:  [81, 82],
  91:  [76, 78],  92:  [79, 80],
  95:  [86, 88],  96:  [85, 87],
  97:  [89, 90],  98:  [93, 94],
  99:  [91, 92],  100: [95, 96],
  101: [97, 98],  102: [99, 100],
  104: [101, 102],
};

// Round → column index (0-based left to right)
const COL_IDX = { R32: 0, R16: 1, QF: 2, SF: 3, Final: 4 };

// matchNumber → round key
const ROUND_OF = {
  ...Object.fromEntries(R32_ORDER.map(n => [n, 'R32'])),
  89: 'R16', 90: 'R16', 91: 'R16', 92: 'R16',
  93: 'R16', 94: 'R16', 95: 'R16', 96: 'R16',
  97: 'QF',  98: 'QF',  99: 'QF',  100: 'QF',
  101: 'SF', 102: 'SF',
  103: '3rd', 104: 'Final',
};

// All match numbers shown in the main bracket tree (excludes 3rd)
const MAIN_NUMS = [
  ...R32_ORDER,
  89, 90, 91, 92, 93, 94, 95, 96,
  97, 98, 99, 100,
  101, 102,
  104,
];

const COL_HEADERS = [
  { col: 0, label: '16vos' },
  { col: 1, label: 'Octavos' },
  { col: 2, label: 'Cuartos' },
  { col: 3, label: 'Semis' },
  { col: 4, label: 'Final' },
];

// ── Pre-compute Y-centres for every match ─────────────────────────────────────
function buildYMap() {
  const y = {};
  R32_ORDER.forEach((n, i) => { y[n] = (i + 0.5) * UNIT; });
  // Ascending order guarantees feeders are resolved before their parent
  Object.keys(TREE).map(Number).sort((a, b) => a - b).forEach(n => {
    const [f1, f2] = TREE[n];
    y[n] = (y[f1] + y[f2]) / 2;
  });
  return y;
}

const Y = buildYMap();
const GAP_X = COL_W - SLOT_W;

// Round ordering used to find the most advanced active round
const ROUND_ORDER = ['R32', 'R16', 'QF', 'SF', 'Final'];

function getCurrentRound(matches) {
  // Prefer a live/starting match
  const live = matches.find(m => m.matchStatus === 'PLAYING' || m.matchStatus === 'STARTING');
  if (live && COL_IDX[live.round] != null) return live.round;
  // Fall back to the latest round with at least one finalized match
  let latest = 'R32';
  for (const r of ROUND_ORDER) {
    if (matches.some(m => m.round === r && m.matchStatus === 'FINALIZED')) latest = r;
  }
  return latest;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TeamRow({ team, label, score, winner }) {
  return (
    <div className={`bslot__row${winner ? ' bslot__row--win' : ''}`}>
      {team ? (
        <>
          <img
            className="bslot__flag"
            src={`https://flagcdn.com/w40/${team.flag}.png`}
            srcSet={`https://flagcdn.com/w80/${team.flag}.png 2x`}
            alt={team.name}
            width={20}
            height={14}
          />
          <span className="bslot__code">{team.code}</span>
        </>
      ) : (
        <span className="bslot__lbl">{label || '—'}</span>
      )}
      {score != null && <span className="bslot__sc">{score}</span>}
    </div>
  );
}

function MatchSlot({ match, x, y }) {
  const hs = match?.homeScore;
  const as = match?.awayScore;
  const scored = hs != null && as != null;

  return (
    <div
      className={`bslot${scored ? ' bslot--fin' : ''}`}
      style={{ left: x, top: y - SLOT_H / 2 }}
    >
      <TeamRow
        team={match?.homeTeam}
        label={match?.homeTeamLabel}
        score={scored ? hs : null}
        winner={scored && hs > as}
      />
      <div className="bslot__sep" />
      <TeamRow
        team={match?.awayTeam}
        label={match?.awayTeamLabel}
        score={scored ? as : null}
        winner={scored && as > hs}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BracketDiagram({ matches }) {
  const scrollRef = useRef(null);

  // On mount, scroll so the current active round is centred in the viewport
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const round = getCurrentRound(matches);
    const col = COL_IDX[round] ?? 0;
    const colCenterX = col * COL_W + COL_W / 2;
    el.scrollLeft = colCenterX - el.clientWidth / 2;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const byNum = useMemo(
    () => Object.fromEntries(matches.map(m => [m.matchNumber, m])),
    [matches],
  );

  // Build SVG connector lines (computed once — structure never changes)
  const connectors = useMemo(() => {
    const els = [];
    Object.entries(TREE).forEach(([numStr, [f1, f2]]) => {
      const num    = Number(numStr);
      const col    = COL_IDX[ROUND_OF[num]];
      const fColX  = (col - 1) * COL_W;           // left edge of feeder column
      const midX   = fColX + SLOT_W + GAP_X / 2;  // centre of the gap
      const matchX = col * COL_W;                  // left edge of parent column

      const py = Y[num], f1y = Y[f1], f2y = Y[f2];

      els.push(
        // feeder 1 right → midpoint
        <line key={`${num}a`} x1={fColX + SLOT_W} y1={f1y} x2={midX}   y2={f1y} />,
        // feeder 2 right → midpoint
        <line key={`${num}b`} x1={fColX + SLOT_W} y1={f2y} x2={midX}   y2={f2y} />,
        // vertical spine between the two feeders
        <line key={`${num}c`} x1={midX}            y1={f1y} x2={midX}   y2={f2y} />,
        // midpoint → parent match left
        <line key={`${num}d`} x1={midX}            y1={py}  x2={matchX} y2={py}  />,
      );
    });
    return els;
  }, []);

  return (
    <div className="bdiagram" ref={scrollRef}>
      {/* Column headers */}
      <div className="bdiagram__hdr-row" style={{ width: TOTAL_W }}>
        {COL_HEADERS.map(({ col, label }) => (
          <div key={col} className="bdiagram__hdr" style={{ left: col * COL_W, width: COL_W }}>
            {label}
          </div>
        ))}
      </div>

      {/* Bracket canvas */}
      <div className="bdiagram__canvas" style={{ width: TOTAL_W, height: TOTAL_H }}>
        <svg width={TOTAL_W} height={TOTAL_H} className="bdiagram__svg">
          <g stroke="currentColor" strokeWidth="1.5" fill="none">
            {connectors}
          </g>
        </svg>

        {MAIN_NUMS.map(num => (
          <MatchSlot
            key={num}
            match={byNum[num]}
            x={COL_IDX[ROUND_OF[num]] * COL_W}
            y={Y[num]}
          />
        ))}
      </div>

      {/* Third-place match (losers of SF — not part of the winner tree) */}
      <div className="bdiagram__third">
        <span className="bdiagram__third-lbl">Tercer puesto</span>
        <div style={{ position: 'relative', width: SLOT_W, height: SLOT_H }}>
          <MatchSlot match={byNum[103]} x={0} y={SLOT_H / 2} />
        </div>
      </div>
    </div>
  );
}
