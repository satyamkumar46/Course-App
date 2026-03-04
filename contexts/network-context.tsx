'use client';

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

type NetworkContextValue = {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
};

const NetworkContext = createContext<NetworkContextValue>({
  isConnected: null,
  isInternetReachable: null,
});

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<NetworkContextValue>({
    isConnected: null,
    isInternetReachable: null,
  });

  const update = useCallback((netState: NetInfoState) => {
    setState({
      isConnected: netState.isConnected ?? null,
      isInternetReachable: netState.isInternetReachable ?? null,
    });
  }, []);

  useEffect(() => {
    const unsub = NetInfo.addEventListener(update);
    NetInfo.fetch().then(update);
    return () => unsub();
  }, [update]);

  return (
    <NetworkContext.Provider value={state}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  return useContext(NetworkContext);
}
