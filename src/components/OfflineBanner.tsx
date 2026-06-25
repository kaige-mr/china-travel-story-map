import React, { useState, useEffect } from 'react';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: '#FEF3C7',
      color: '#92400E',
      padding: '8px 16px',
      fontSize: '13px',
      fontWeight: 500,
      textAlign: 'center',
      zIndex: 9999,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      网络连接中断，当前处于离线模式。您的最新修改已保存在本地 IndexedDB 中。
    </div>
  );
};
