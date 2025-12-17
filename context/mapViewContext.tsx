import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';

const MapViewContext = createContext<{
  poopsToView: 'friends' | 'yours' | 'all';
  setPoopsToView: (poopsToView: 'friends' | 'yours' | 'all') => void;
  palSelected: string | null;
  setPalSelected: (palSelected: string | null) => void;
  recenterCamera: () => void;
  registerRecenterCallback: (callback: () => void) => void;
}>({
  poopsToView: 'yours',
  setPoopsToView: () => {},
  palSelected: null,
  setPalSelected: () => {},
  recenterCamera: () => {},
  registerRecenterCallback: () => {},
});

export const MapViewContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [poopsToView, setPoopsToViewState] = useState<
    'friends' | 'yours' | 'all'
  >('yours');
  const [palSelected, setPalSelectedState] = useState<string | null>(null);
  const recenterCallbackRef = useRef<(() => void) | null>(null);

  const setPoopsToView = useCallback(
    (newValue: 'friends' | 'yours' | 'all') => {
      setPoopsToViewState(newValue);
    },
    []
  );

  const setPalSelected = useCallback((newValue: string | null) => {
    setPalSelectedState(newValue);
  }, []);

  const registerRecenterCallback = useCallback((callback: () => void) => {
    recenterCallbackRef.current = callback;
  }, []);

  const recenterCamera = useCallback(() => {
    if (recenterCallbackRef.current) {
      recenterCallbackRef.current();
    }
  }, []);

  return (
    <MapViewContext.Provider
      value={{
        poopsToView,
        setPoopsToView,
        palSelected,
        setPalSelected,
        recenterCamera,
        registerRecenterCallback,
      }}
    >
      {children}
    </MapViewContext.Provider>
  );
};

export const useMapViewContext = () => {
  const context = useContext(MapViewContext);
  if (!context) {
    throw new Error(
      'useMapViewContext must be used within a MapViewContextProvider'
    );
  }
  return context;
};
