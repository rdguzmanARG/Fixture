import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

function FlagImg({ code, name }) {
  if (!code) return <span className="match-card__flag-placeholder">🏳</span>;
  return (
    <img
      className="match-card__flag-img"
      src={`https://flagcdn.com/w40/${code}.png`}
      srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
      alt={name}
      width={28}
      height={21}
    />
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function cardStatus(match, prediction) {
  if (!prediction) return '';
  if (match.homeScore == null) return 'saved';
  if (match.matchStatus === 'PLAYING') return 'saved';
  if (prediction.points === 5) return 'exact';
  if (prediction.points === 3) return 'correct';
  return 'wrong';
}

export default function MatchCard({ match, onPredictionSaved, onResultSet }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const pred = match.userPrediction;

  const [home, setHome] = useState(pred?.homeScore ?? '');
  const [away, setAway] = useState(pred?.awayScore ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [localSaved, setLocalSaved] = useState(!!pred);

  // Admin state
  const [adminHome, setAdminHome] = useState(match.homeScore ?? '');
  const [adminAway, setAdminAway] = useState(match.awayScore ?? '');
  const [settingResult, setSettingResult] = useState(false);
  const [removingResult, setRemovingResult] = useState(false);
  const [locked, setLocked] = useState(match.isLocked ?? false);
  const [togglingLock, setTogglingLock] = useState(false);

  useEffect(() => { setLocked(match.isLocked ?? false); }, [match.isLocked]);

  const hasPred = !!pred || localSaved;
  const status = cardStatus(match, pred);
  const homeLabel = match.homeTeam?.name || match.homeTeamLabel || '?';
  const awayLabel = match.awayTeam?.name || match.awayTeamLabel || '?';
  const homeFlag  = match.homeTeam?.flag;
  const awayFlag  = match.awayTeam?.flag;

  async function savePrediction() {
    if (home === '' || away === '') return;
    setSaving(true);
    setSaveError(null);
    try {
      const r = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ matchId: match.id, homeScore: Number(home), awayScore: Number(away) }),
      });
      if (r.ok) {
        setDirty(false);
        setLocalSaved(true);
        onPredictionSaved?.();
      } else if (r.status === 401) {
        await logout();
        navigate('/login');
      } else {
        const data = await r.json().catch(() => ({}));
        setSaveError(data.error || 'Error al guardar');
      }
    } catch {
      setSaveError('Error de red');
    } finally {
      setSaving(false);
    }
  }

  async function deletePrediction() {
    setDeleting(true);
    setSaveError(null);
    try {
      const r = await fetch(`/api/predictions/${match.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (r.ok) {
        setHome('');
        setAway('');
        setDirty(false);
        setLocalSaved(false);
        onPredictionSaved?.();
      } else if (r.status === 401) {
        await logout();
        navigate('/login');
      } else {
        const data = await r.json().catch(() => ({}));
        setSaveError(data.error || 'Error al borrar');
      }
    } catch {
      setSaveError('Error de red');
    } finally {
      setDeleting(false);
    }
  }

  async function setResult() {
    if (adminHome === '' || adminAway === '') return;
    setSettingResult(true);
    try {
      const r = await fetch(`/api/matches/${match.id}/result`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ homeScore: Number(adminHome), awayScore: Number(adminAway) }),
      });
      if (r.ok) onResultSet?.();
    } finally {
      setSettingResult(false);
    }
  }

  async function removeResult() {
    setRemovingResult(true);
    try {
      const r = await fetch(`/api/matches/${match.id}/result`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (r.ok) onResultSet?.();
    } finally {
      setRemovingResult(false);
    }
  }

  async function toggleLock() {
    setTogglingLock(true);
    try {
      const r = await fetch(`/api/matches/${match.id}/lock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isLocked: !locked }),
      });
      if (r.ok) setLocked((v) => !v);
    } finally {
      setTogglingLock(false);
    }
  }

  return (
    <div className={`match-card${status ? ` match-card--${status}` : ''}`}>
      <div className="match-card__meta">
        {match.matchStatus === 'PLAYING' && (
          <div>
            <span className="live-badge">
              <span className="live-badge__dot" />
              EN VIVO
            </span>
          </div>
        )}
        <span>#{match.matchNumber}</span>
        {match.date && <span>{formatDate(match.date)}</span>}
        {match.city && <span>{match.city}</span>}
      </div>

      <div className="match-card__teams">
        <div className="match-card__team">
          <FlagImg code={homeFlag} name={homeLabel} />
          <span className="match-card__name">{homeLabel}</span>
        </div>
        <div className="match-card__vs">VS</div>
        <div className="match-card__team match-card__team--away">
          <FlagImg code={awayFlag} name={awayLabel} />
          <span className="match-card__name">{awayLabel}</span>
        </div>
      </div>

      {match.homeScore != null && (
        <div className="match-card__result">
          {match.matchStatus === 'PLAYING' ? 'En juego:' : 'Resultado:'} {match.homeScore} – {match.awayScore}
        </div>
      )}

      <div className="match-card__footer">
        <button
          className="match-card__all-preds"
          onClick={() => navigate(`/matches/${match.id}/predictions`)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Ver pronósticos
        </button>
      </div>

      {!user?.isAdmin && (
        <div className="match-card__prediction">
          {locked && (
            <span className="match-card__locked">Cerrado</span>
          )}
          <input
            className={`match-card__score-input${hasPred && !dirty ? ' match-card__score-input--saved' : ''}`}
            type="number"
            min="0"
            max="99"
            value={home}
            onChange={(e) => { setHome(e.target.value); setDirty(true); }}
            placeholder="0"
            disabled={locked}
            readOnly={!locked && hasPred && !dirty}
          />
          <span className="match-card__dash">–</span>
          <input
            className={`match-card__score-input${hasPred && !dirty ? ' match-card__score-input--saved' : ''}`}
            type="number"
            min="0"
            max="99"
            value={away}
            onChange={(e) => { setAway(e.target.value); setDirty(true); }}
            placeholder="0"
            disabled={locked}
            readOnly={!locked && hasPred && !dirty}
          />
          {(!hasPred || dirty) && (
            <button
              className="match-card__save"
              onClick={savePrediction}
              disabled={saving || home === '' || away === ''}
            >
              {saving ? '…' : 'Guardar'}
            </button>
          )}
          {hasPred && !dirty && !locked && (
            <button
              className="match-card__delete"
              onClick={deletePrediction}
              disabled={deleting}
              title="Borrar pronóstico"
            >
              {deleting ? '…' : '✕'}
            </button>
          )}
          {saveError && <span className="match-card__save-error">{saveError}</span>}
          {pred?.points != null && (
            <span className={`match-card__points-badge match-card__points-badge--${pred.points}`}>
              {pred.points}pt
            </span>
          )}
        </div>
      )}

      {user?.isAdmin && (
        <div className="match-card__admin">
          <small style={{ color: '#868e96' }}>Resultado:</small>
          <input
            className="match-card__score-input"
            type="number"
            min="0"
            value={adminHome}
            onChange={(e) => setAdminHome(e.target.value)}
            style={{ width: 40 }}
          />
          <span>–</span>
          <input
            className="match-card__score-input"
            type="number"
            min="0"
            value={adminAway}
            onChange={(e) => setAdminAway(e.target.value)}
            style={{ width: 40 }}
          />
          <button className="btn btn--sm btn--admin" onClick={setResult} disabled={settingResult}>
            {settingResult ? '…' : 'Aplicar'}
          </button>
          {match.homeScore != null && (
            <button className="btn btn--sm btn--danger" onClick={removeResult} disabled={removingResult}>
              {removingResult ? '…' : 'Borrar resultado'}
            </button>
          )}
          <button
            className={`btn btn--sm ${locked ? 'btn--lock-on' : 'btn--lock-off'}`}
            onClick={toggleLock}
            disabled={togglingLock}
            title={locked ? 'Desbloquear pronósticos' : 'Bloquear pronósticos'}
          >
            {togglingLock ? '…' : locked ? '🔒' : '🔓'}
          </button>
        </div>
      )}
    </div>
  );
}
