import { createContext, useContext, useState } from 'react';

const MapViewContext = createContext<{
  poopsToView: 'friends' | 'yours' | 'all';
  setPoopsToView: (poopsToView: 'friends' | 'yours' | 'all') => void;
  palSelected: string | null;
  setPalSelected: (palSelected: string | null) => void;
}>({
  poopsToView: 'all',
  setPoopsToView: () => {},
  palSelected: null,
  setPalSelected: () => {},
});

export const MapViewContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [poopsToView, setPoopsToView] = useState<'friends' | 'yours' | 'all'>('all');
  const [palSelected, setPalSelected] = useState<string | null>('all');

  return (
    <MapViewContext.Provider value={{ poopsToView, setPoopsToView, palSelected, setPalSelected }}>
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
