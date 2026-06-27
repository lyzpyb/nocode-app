import React, { createContext, useContext, useState } from 'react';

const AfterlineSDKContext = createContext();

export const useAfterlineSDK = () => {
  const context = useContext(AfterlineSDKContext);
  if (!context) {
    throw new Error('useAfterlineSDK must be used within a AfterlineProvider');
  }
  return context;
};

export const AfterlineProvider = ({ children }) => {
  // 跳过 Afterline SDK 检查，直接标记为就绪
  const [isReady] = useState(true);

  const value = {
    isReady,
  };

  return (
    <AfterlineSDKContext.Provider value={value}>
      {children}
    </AfterlineSDKContext.Provider>
  );
};
