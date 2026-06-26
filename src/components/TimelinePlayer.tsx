import React, { useState, useEffect } from 'react';

export interface TimelinePlayerProps {
  totalNodes: number;
  currentNodeIndex: number;
  onIndexChange: (index: number) => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
}

export const TimelinePlayer: React.FC<TimelinePlayerProps> = ({
  totalNodes,
  currentNodeIndex,
  onIndexChange,
  isPlaying,
  onPlayToggle
}) => {
  const [speed, setSpeed] = useState<number>(1);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      onIndexChange((currentNodeIndex + 1) % Math.max(1, totalNodes));
    }, 2000 / speed);

    return () => clearInterval(interval);
  }, [isPlaying, currentNodeIndex, totalNodes, speed, onIndexChange]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: '#FFFFFF', borderRadius: '8px' }}>
      <button onClick={onPlayToggle} style={{ padding: '4px 12px', cursor: 'pointer' }}>
        {isPlaying ? '暂停' : '播放巡检'}
      </button>
      <input
        type="range"
        min={0}
        max={Math.max(0, totalNodes - 1)}
        value={currentNodeIndex}
        onChange={(e) => onIndexChange(Number(e.target.value))}
      />
      <span>速度:</span>
      <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
        <option value={0.5}>0.5x</option>
        <option value={1}>1.0x</option>
        <option value={2}>2.0x</option>
      </select>
    </div>
  );
};
