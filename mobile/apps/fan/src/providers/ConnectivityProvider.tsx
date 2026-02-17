import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import NetInfo from '@react-native-community/netinfo';
import OfflineScreen from '../screens/OfflineScreen';

interface ConnectivityContextType {
  isConnected: boolean;
  isInternetReachable: boolean;
  checkConnection: () => Promise<void>;
}

const ConnectivityContext = createContext<ConnectivityContextType | undefined>(undefined);

interface ConnectivityProviderProps {
  children: ReactNode;
}

export const useConnectivity = () => {
  const context = useContext(ConnectivityContext);
  if (!context) {
    throw new Error('useConnectivity must be used within a ConnectivityProvider');
  }
  return context;
};

export const ConnectivityProvider: React.FC<ConnectivityProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean>(true);
  const [showOfflineScreen, setShowOfflineScreen] = useState<boolean>(false);

  const updateConnectivityState = (connected: boolean, reachable: boolean) => {
    console.log('Updating connectivity state:', { connected, reachable });
    
    setIsConnected(connected);
    setIsInternetReachable(reachable);
    
    // Dismiss offline screen as soon as isConnected is true
    // Don't wait for isInternetReachable which can be slow/unreliable
    if (connected) {
      console.log('Connected - dismissing offline screen immediately');
      setShowOfflineScreen(false);
    } else if (!connected || !reachable) {
      console.log('Not connected - showing offline screen');
      setShowOfflineScreen(true);
    }
  };

  const checkConnection = async () => {
    try {
      const netInfoState = await NetInfo.fetch();
      const connected = netInfoState.isConnected ?? false;
      const reachable = netInfoState.isInternetReachable ?? false;
      
      console.log('Manual connection check:', { connected, reachable, details: netInfoState });
      
      // Use the same prioritized logic
      if (connected) {
        console.log('Manual check: Connected - dismissing offline screen immediately');
        setIsConnected(true);
        setIsInternetReachable(reachable);
        setShowOfflineScreen(false);
      } else {
        updateConnectivityState(connected, reachable);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      updateConnectivityState(false, false);
    }
  };

  useEffect(() => {
    // Initial connection check
    checkConnection();

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected ?? false;
      const reachable = state.isInternetReachable ?? false;
      
      console.log('Network state changed:', { connected, reachable, details: state });
      
      // Immediate check: if connected, dismiss offline screen right away
      if (connected) {
        console.log('Immediate: Connected detected - dismissing offline screen');
        setIsConnected(true);
        setIsInternetReachable(reachable);
        setShowOfflineScreen(false);
      } else {
        updateConnectivityState(connected, reachable);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Force re-render with delay to ensure background navigation state is ready
  useEffect(() => {
    if (isConnected && showOfflineScreen) {
      const timer = setTimeout(() => {
        console.log('Force dismiss: Ensuring offline screen is hidden after delay');
        setShowOfflineScreen(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, showOfflineScreen]);

  const handleRetry = () => {
    console.log('Retry button pressed');
    checkConnection();
  };

  return (
    <ConnectivityContext.Provider
      value={{
        isConnected,
        isInternetReachable,
        checkConnection,
      }}
    >
      {children}
      {showOfflineScreen && <OfflineScreen onRetry={handleRetry} />}
    </ConnectivityContext.Provider>
  );
};
