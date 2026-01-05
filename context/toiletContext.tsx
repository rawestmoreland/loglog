import { RecordModel } from 'pocketbase';
import { createContext, useContext, useEffect, useState } from 'react';
import { useSesh } from './seshContext';

const ToiletContext = createContext<{
  selectedToilet: RecordModel | null;
  setSelectedToilet: (toilet: RecordModel | null) => void;
}>({
  selectedToilet: null,
  setSelectedToilet: () => {},
});

export const ToiletContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { selectedSesh, setSelectedSesh } = useSesh();

  const [selectedToilet, setSelectedToilet] = useState<RecordModel | null>(
    null
  );

  // Only allow one or the other to be selected at a time
  useEffect(() => {
    if (Boolean(selectedSesh)) {
      setSelectedToilet(null);
    }

    if (Boolean(selectedToilet)) {
      setSelectedSesh(null);
    }
  }, [selectedToilet, selectedSesh, setSelectedSesh]);

  return (
    <ToiletContext.Provider value={{ selectedToilet, setSelectedToilet }}>
      {children}
    </ToiletContext.Provider>
  );
};

export const useToilet = () => {
  const context = useContext(ToiletContext);
  if (!context) {
    throw new Error('useToilet must be used within a ToiletContextProvider');
  }
  return context;
};
