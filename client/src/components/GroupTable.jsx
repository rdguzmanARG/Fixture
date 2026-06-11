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

// Computes standings from group matches using actual results (if set) or user predictions
export default function GroupTable({ teams, matches }) {
  const standings = teams.map((team) => {
    let mp = 0, w = 0, d = 0, l = 0, gf = 0, ga = 0;

    for (const m of matches) {
      const isHome = m.homeTeam?.id === team.id;
      const isAway = m.awayTeam?.id === team.id;
      if (!isHome && !isAway) continue;

      // Use actual result first; fall back to user prediction
      const result = m.homeScore != null
        ? { homeScore: m.homeScore, awayScore: m.awayScore }
        : m.userPrediction;

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
        {standings.map((t, i) => (
          <tr key={t.id} className={i < 2 ? 'qualified' : i === 2 ? 'third' : ''}>
            <td>
              <FlagImg code={t.flag} name={t.name} />
              <span className="group-table__name">{t.name}</span>
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
        ))}
      </tbody>
    </table>
    </div>
  );
}
