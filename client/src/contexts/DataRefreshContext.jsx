import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext.jsx';

const DataRefreshContext = createContext(0);
const POLL_INTERVAL = 30_000;

export function DataRefreshProvider({ children }) {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const esRef = useRef(null);

  useEffect(() => {
    if (!user) {
      esRef.current?.close();
      esRef.current = null;
      return;
    }

    const bump = () => setRefreshKey((k) => k + 1);

    const es = new EventSource('/api/events');
    esRef.current = es;
    es.addEventListener('update', bump);

    // Fallback polling — fires if SSE is blocked or buffered by the host
    const poll = setInterval(bump, POLL_INTERVAL);

    return () => {
      es.close();
      esRef.current = null;
      clearInterval(poll);
    };
  }, [user]);

  return (
    <DataRefreshContext.Provider value={refreshKey}>
      {children}
    </DataRefreshContext.Provider>
  );
}

export const useRefreshKey = () => useContext(DataRefreshContext);
