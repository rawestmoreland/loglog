import { addEventListener } from '@react-native-community/netinfo';
import { createContext, useContext, useEffect, useState } from 'react';

export const ConnectionContext = createContext({
  isConnected: false,
});

export const ConnectionContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const unsubscribe = addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return (
    <ConnectionContext.Provider value={{ isConnected }}>{children}</ConnectionContext.Provider>
  );
};

export const useConnection = () => {
  const context = useContext(ConnectionContext);

  if (!context) {
    throw new Error('useConnection must be used within a ConnectionContextProvider');
  }

  return context;
};
