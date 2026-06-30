import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginOrCreateUser, getAllUserProgress } from '@/lib/api';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// 生成或获取设备 ID
function getDeviceId() {
  let deviceId = localStorage.getItem('afterline_device_id');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem('afterline_device_id', deviceId);
  }
  return deviceId;
}

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [progress, setProgress] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // 初始化用户
  useEffect(() => {
    const initUser = async () => {
      try {
        const deviceId = getDeviceId();
        const result = await loginOrCreateUser(deviceId);
        setUser(result);
        setUserId(result.user_id);
        
        // 加载用户所有进度
        try {
          const allProgress = await getAllUserProgress(result.user_id);
          const progressMap = {};
          (allProgress || []).forEach(p => {
            const key = `${p.drama_id}_${p.character_id}`;
            progressMap[key] = p;
          });
          setProgress(progressMap);
        } catch (e) {
          console.warn('Failed to load progress:', e);
        }
      } catch (err) {
        console.error('Init user failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initUser();
  }, []);

  // 更新进度
  const updateProgress = useCallback((dramaId, characterId, data) => {
    const key = `${dramaId}_${characterId}`;
    setProgress(prev => ({
      ...prev,
      [key]: { ...prev[key], ...data },
    }));
  }, []);

  // 获取进度
  const getProgress = useCallback((dramaId, characterId) => {
    const key = `${dramaId}_${characterId}`;
    return progress[key] || null;
  }, [progress]);

  const value = {
    user,
    userId,
    isLoading,
    progress,
    updateProgress,
    getProgress,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;
