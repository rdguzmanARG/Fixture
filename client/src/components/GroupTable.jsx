function FlagImg({ code, name }) {
  if (!code) return null;
  return (
    <img
      className="group-table__flag-img"
      src={`https://flagcdn.com/w40/${code}.png`}
      srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
      alt={name}
      width={24}
      height={18}
    />
  );
}

const LIVE_STATUSES = new Set(['PLAYING', 'STARTING']);

// Computes standings from group matches using actual results only
export default function GroupTable({ teams, matches }) {
  const playingTeamIds = new Set(
    matches
      .filter((m) => LIVE_STATUSES.has(m.matchStatus))
      .flatMap((m) => [m.homeTeam?.id, m.awayTeam?.id].filter(Boolean))
  );

  const standings = teams.map((team) => {
    let mp = 0, w = 0, d = 0, l = 0, gf = 0, ga = 0;

    for (const m of matches) {
      const isHome = m.homeTeam?.id === team.id;
      const isAway = m.awayTeam?.id === team.id;
      if (!isHome && !isAway) continue;

      const result = m.homeScore != null
        ? { homeScore: m.homeScore, awayScore: m.awayScore }
        : null;

      if (!result) continue;

      mp++;
      const myGoals  = isHome ? result.homeScore : result.awayScore;
      const oppGoals = isHome ? result.awayScore : result.homeScore;
      gf += myGoals;
      ga += oppGoals;
      if (myGoals > oppGoals) w++;
      else if (myGoals === oppGoals) d++;
      else l++;
    }

    return { ...team, mp, w, d, l, gf, ga, gd: gf - ga, pts: w * 3 + d };
  });

  standings.sort((a, b) =>
    b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name)
  );

  return (
    <div className="group-table__wrapper">
    <table className="group-table">
      <thead>
        <tr>
          <th>Equipo</th>
          <th>PJ</th><th>G</th><th>E</th><th>P</th>
          <th>GF</th><th>GC</th><th>DG</th>
          <th>Pts</th>
        </tr>
      </thead>
      <tbody>
        {standings.map((t, i) => {
          const isPlaying = playingTeamIds.has(t.id);
          const rowClass = [
            i < 2 ? 'qualified' : i === 2 ? 'third' : '',
            isPlaying ? 'playing' : '',
          ].filter(Boolean).join(' ');
          return (
          <tr key={t.id} className={rowClass}>
            <td>
              <FlagImg code={t.flag} name={t.name} />
              <span className="group-table__name">{t.name}</span>
              {isPlaying && <span className="group-table__live-dot" title="Jugando ahora" />}
            </td>
            <td>{t.mp}</td>
            <td>{t.w}</td>
            <td>{t.d}</td>
            <td>{t.l}</td>
            <td>{t.gf}</td>
            <td>{t.ga}</td>
            <td>{t.gd > 0 ? `+${t.gd}` : t.gd}</td>
            <td><strong>{t.pts}</strong></td>
          </tr>
          );
        })}
      </tbody>
    </table>
    </div>
  );
}
