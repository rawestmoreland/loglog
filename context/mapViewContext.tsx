import { createContext, useContext, useState, useCallback } from 'react';

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
  const [poopsToView, setPoopsToViewState] = useState<'friends' | 'yours' | 'all'>('all');
  const [palSelected, setPalSelectedState] = useState<string | null>('all');

  const setPoopsToView = useCallback((newValue: 'friends' | 'yours' | 'all') => {
    setPoopsToViewState(newValue);
  }, []);

  const setPalSelected = useCallback((newValue: string | null) => {
    console.log('Setting palSelected to:', newValue);
    setPalSelectedState(newValue);
  }, []);

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
