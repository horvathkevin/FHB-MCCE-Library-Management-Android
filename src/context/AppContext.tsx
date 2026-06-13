import React, { createContext, useContext, useState, useCallback } from 'react';

interface AppContextValue {
  refreshKey: number;
  triggerRefresh: () => void;
}

const AppContext = createContext<AppContextValue>({
  refreshKey: 0,
  triggerRefresh: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = useCallback(() => setRefreshKey(k => k + 1), []);
  return (
    <AppContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
