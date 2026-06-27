import React, { createContext, useContext, useState } from 'react';

const NoCodeSDKContext = createContext();

export const useNoCodeSDK = () => {
  const context = useContext(NoCodeSDKContext);
  if (!context) {
    throw new Error('useNoCodeSDK must be used within a NoCodeProvider');
  }
  return context;
};

export const NoCodeProvider = ({ children }) => {
  // 跳过 NoCode SDK 检查，直接标记为就绪
  const [isReady] = useState(true);

  const value = {
    isReady,
  };

  return (
    <NoCodeSDKContext.Provider value={value}>
      {children}
    </NoCodeSDKContext.Provider>
  );
};
