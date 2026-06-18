import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext.jsx';

const DataRefreshContext = createContext(0);

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
    const es = new EventSource('/api/events');
    esRef.current = es;
    es.addEventListener('update', () => setRefreshKey((k) => k + 1));
    return () => {
      es.close();
      esRef.current = null;
    };
  }, [user]);

  return (
    <DataRefreshContext.Provider value={refreshKey}>
      {children}
    </DataRefreshContext.Provider>
  );
}

export const useRefreshKey = () => useContext(DataRefreshContext);
