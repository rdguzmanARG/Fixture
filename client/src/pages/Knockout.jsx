import { useState, useEffect, useCallback } from 'react';
import MatchCard from '../components/MatchCard.jsx';

const ROUNDS = [
  { key: 'R32',   label: 'Ronda de 32' },
  { key: 'R16',   label: 'Octavos de final' },
  { key: 'QF',    label: 'Cuartos de final' },
  { key: 'SF',    label: 'Semifinales' },
  { key: '3rd',   label: 'Tercer puesto' },
  { key: 'Final', label: 'Final' },
];

export default function Knockout() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const r = await fetch('/api/matches', { credentials: 'include' });
    if (r.ok) {
      const all = await r.json();
      setMatches(all.filter((m) => m.round !== 'Group'));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="loading">Cargando eliminatorias…</div>;

  const completedCount = matches.filter((m) => m.userPrediction).length;

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1>🏆 Fase Eliminatoria</h1>
          <p>Pronósticos: {completedCount} / {matches.length} partidos</p>
        </div>
      </div>
      <div className="container">
        <div className="bracket">
          {ROUNDS.map(({ key, label }) => {
            const roundMatches = matches.filter((m) => m.round === key);
            if (roundMatches.length === 0) return null;
            return (
              <div key={key} className="bracket__round">
                <div className="bracket__round-title">
                  {label}
                  <span className="round-badge">{roundMatches.length} {roundMatches.length === 1 ? 'partido' : 'partidos'}</span>
                </div>
                <div className="bracket__grid">
                  {roundMatches.map((m) => (
                    <MatchCard
                      key={m.id}
                      match={m}
                      onPredictionSaved={load}
                      onResultSet={load}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
