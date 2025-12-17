import { useNetworkState } from 'expo-network';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export const NetworkContext = createContext<{
  isConnected: boolean | undefined;
  isNetworkInitialized: boolean;
  showOfflineUI: boolean;
}>({
  isConnected: undefined,
  isNetworkInitialized: false,
  showOfflineUI: false,
});

export const NetworkContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const network = useNetworkState();
  // const network = { isConnected: false };
  const [isNetworkInitialized, setIsNetworkInitialized] = useState(false);
  const [showOfflineUI, setShowOfflineUI] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track when network state has been determined (not undefined)
  useEffect(() => {
    if (network.isConnected !== undefined && !isNetworkInitialized) {
      setIsNetworkInitialized(true);
    }
  }, [network.isConnected, isNetworkInitialized]);

  // Debounce showing offline UI to prevent flashing
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // If we haven't initialized yet, don't show offline UI
    if (!isNetworkInitialized) {
      setShowOfflineUI(false);
      return;
    }

    // If connected, immediately hide offline UI
    if (network.isConnected === true) {
      setShowOfflineUI(false);
      return;
    }

    // If disconnected, wait a bit before showing offline UI to prevent flashing
    if (network.isConnected === false) {
      // @ts-ignore
      timeoutRef.current = setTimeout(() => {
        setShowOfflineUI(true);
      }, 500); // 500ms delay before showing offline UI
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [network.isConnected, isNetworkInitialized]);

  const contextValue = useMemo(
    () => ({
      isConnected: network.isConnected,
      isNetworkInitialized,
      showOfflineUI,
    }),
    [network.isConnected, isNetworkInitialized, showOfflineUI]
  );

  return (
    <NetworkContext.Provider value={contextValue}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkContextProvider');
  }
  return context;
};
