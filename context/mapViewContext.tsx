import { createContext, useContext, useState } from 'react';

const MapViewContext = createContext<{
  poopsToView: 'friends' | 'yours' | 'all';
  setPoopsToView: (poopsToView: 'friends' | 'yours' | 'all') => void;
}>({
  poopsToView: 'all',
  setPoopsToView: () => {},
});

export const MapViewContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [poopsToView, setPoopsToView] = useState<'friends' | 'yours' | 'all'>('all');

  return (
    <MapViewContext.Provider value={{ poopsToView, setPoopsToView }}>
      {children}
    </MapViewContext.Provider>
  );
};

export const useMapViewContext = () => {
  const context = useContext(MapViewContext);
  if (!context) {
    throw new Error('useMapViewContext must be used within a MapViewContextProvider');
  }
  return context;
};
