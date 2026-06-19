import React from 'react';

interface ScrewProps {
  size?: number;
  rotation?: number;
}

export const Screw: React.FC<ScrewProps> = ({ size = 12, rotation = 45 }) => (
  <div
    className="screw"
    style={{
      width: size,
      height: size,
    }}
  >
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        width: size * 0.5,
        height: Math.max(1.5, size * 0.12),
        background: '#2a2a30',
        borderRadius: 1,
        boxShadow: '0 0.5px 0 rgba(255,255,255,0.15)',
      }}
    />
  </div>
);
