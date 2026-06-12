import { useState, useEffect, useCallback } from 'react';
import GroupTable from '../components/GroupTable.jsx';
import MatchCard from '../components/MatchCard.jsx';

const GROUP_LETTERS = ['A','B','C','D','E','F','G','H','I','J','K','L'];

function GroupSection({ activeGroup, teams, groupMatches }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="group-section">
      <button
        className="group-section__header group-section__header--toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="group-section__badge">GRUPO {activeGroup}</span>
        <h2>Clasificación (según tus pronósticos)</h2>
        <span className="group-section__chevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && teams.length > 0 && (
        <GroupTable teams={teams} matches={groupMatches} />
      )}
    </div>
  );
}

export default function GroupStage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState('A');

  const load = useCallback(async () => {
    const r = await fetch('/api/matches', { credentials: 'include' });
    if (r.ok) setMatches(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="loading">Cargando fixture…</div>;

  const groupMatches = matches.filter((m) => m.round === 'Group' && m.group === activeGroup);
  const matchDay1 = groupMatches.filter((m) => m.matchDay === 1);
  const matchDay2 = groupMatches.filter((m) => m.matchDay === 2);
  const matchDay3 = groupMatches.filter((m) => m.matchDay === 3);

  // Unique teams in this group
  const teams = [];
  const seen = new Set();
  for (const m of groupMatches) {
    for (const t of [m.homeTeam, m.awayTeam]) {
      if (t && !seen.has(t.id)) { seen.add(t.id); teams.push(t); }
    }
  }

  const completedCount = matches.filter(
    (m) => m.round === 'Group' && m.userPrediction
  ).length;
  const totalGroup = matches.filter((m) => m.round === 'Group').length;

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1>⚽ Fase de Grupos</h1>
          <p>Pronósticos: {completedCount} / {totalGroup} partidos</p>
        </div>
      </div>

      <div className="container">
        <div className="group-tabs">
          {GROUP_LETTERS.map((g) => (
            <button
              key={g}
              className={`group-tabs__tab${activeGroup === g ? ' group-tabs__tab--active' : ''}`}
              onClick={() => setActiveGroup(g)}
            >
              Grupo {g}
            </button>
          ))}
        </div>

        <GroupSection activeGroup={activeGroup} teams={teams} groupMatches={groupMatches} />


        {[
          { label: 'Fecha 1', items: matchDay1 },
          { label: 'Fecha 2', items: matchDay2 },
          { label: 'Fecha 3', items: matchDay3 },
        ].map(({ label, items }) =>
          items.length > 0 && (
            <div key={label} className="match-day">
              <div className="match-day__label">{label}</div>
              <div className="matches-grid">
                {items.map((m) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    onPredictionSaved={load}
                    onResultSet={load}
                  />
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
